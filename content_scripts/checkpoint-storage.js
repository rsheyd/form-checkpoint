/* global globalThis, module */
/*
 * Versioned checkpoint persistence and page identity.
 *
 * Page identity intentionally uses origin + pathname. Query strings and
 * fragments frequently contain session state, while domain-wide fallback
 * could apply saved answers to an unrelated form.
 */
(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.CheckpointStorage = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STORAGE_VERSION = 2;
  var KEY_PREFIX = 'form-checkpoint:checkpoint:v2:';
  var VERSION_ONE_KEY_PREFIX = 'form-checkpoint:checkpoint:v1:';
  var TEMPORARY_KEY_PREFIX = 'form-checkpoint:snapshot:';

  function normalizePageUrl(url) {
    var parsed;
    try {
      parsed = new URL(url);
    } catch (error) {
      throw new TypeError('A valid absolute page URL is required.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'file:') {
      throw new TypeError('Only HTTP, HTTPS, and local file pages can have saved forms.');
    }

    if (parsed.protocol === 'file:') {
      return 'file://' + parsed.pathname;
    }

    return parsed.origin + parsed.pathname;
  }

  function createId(savedAt) {
    return String(savedAt).replace(/[^0-9A-Za-z]/g, '') + '-' +
      Math.random().toString(36).slice(2, 10);
  }

  function versionKey(pageIdentity, id) {
    return KEY_PREFIX + encodeURIComponent(pageIdentity) + ':' + id;
  }

  function storageGet(storageArea, key) {
    return new Promise(function (resolve) {
      storageArea.get(key, function (items) {
        resolve(items || {});
      });
    });
  }

  function storageSet(storageArea, value) {
    return new Promise(function (resolve) {
      storageArea.set(value, resolve);
    });
  }

  function storageRemove(storageArea, key) {
    return new Promise(function (resolve) {
      storageArea.remove(key, resolve);
    });
  }

  function validateSnapshot(snapshot) {
    if (!snapshot || snapshot.schemaVersion === undefined ||
        !snapshot.page || !snapshot.page.url || !Array.isArray(snapshot.controls)) {
      throw new TypeError('A versioned form snapshot with a page URL is required.');
    }
  }

  function createRecord(snapshot, options) {
    validateSnapshot(snapshot);
    options = options || {};
    var savedAt = options.savedAt || snapshot.capturedAt || new Date().toISOString();
    return {
      storageVersion: STORAGE_VERSION,
      id: options.id || createId(savedAt),
      pageIdentity: normalizePageUrl(snapshot.page.url),
      savedAt: savedAt,
      snapshot: snapshot
    };
  }

  function isRecord(value) {
    return Boolean(
      value && value.storageVersion === STORAGE_VERSION && value.id &&
      value.pageIdentity && value.snapshot && Array.isArray(value.snapshot.controls)
    );
  }

  function writeRecord(storageArea, record) {
    var value = {};
    value[versionKey(record.pageIdentity, record.id)] = record;
    return storageSet(storageArea, value).then(function () {
      return record;
    });
  }

  function migrationId(snapshot) {
    var savedAt = snapshot.capturedAt || 'unknown';
    return 'migrated-' + String(savedAt).replace(/[^0-9A-Za-z]/g, '');
  }

  function migrateEntry(storageArea, key, value) {
    var snapshot = value && value.snapshot ? value.snapshot : value;
    if (!snapshot || !snapshot.page || !snapshot.page.url || !Array.isArray(snapshot.controls)) {
      return Promise.resolve();
    }

    var record = createRecord(snapshot, {
      id: migrationId(snapshot),
      savedAt: value.savedAt || snapshot.capturedAt
    });
    return writeRecord(storageArea, record).then(function () {
      return storageRemove(storageArea, key);
    });
  }

  function migrateLegacyRecords(storageArea) {
    return storageGet(storageArea, null).then(function (items) {
      var keys = Object.keys(items).filter(function (key) {
        return key.indexOf(VERSION_ONE_KEY_PREFIX) === 0 ||
          key.indexOf(TEMPORARY_KEY_PREFIX) === 0;
      });
      return keys.reduce(function (promise, key) {
        return promise.then(function () {
          return migrateEntry(storageArea, key, items[key]);
        });
      }, Promise.resolve());
    });
  }

  function list(storageArea) {
    return migrateLegacyRecords(storageArea).then(function () {
      return storageGet(storageArea, null);
    }).then(function (items) {
      return Object.keys(items).filter(function (key) {
        return key.indexOf(KEY_PREFIX) === 0 && isRecord(items[key]);
      }).map(function (key) {
        return items[key];
      }).sort(function (left, right) {
        return String(right.savedAt).localeCompare(String(left.savedAt));
      });
    });
  }

  function listForPage(storageArea, url) {
    var pageIdentity = normalizePageUrl(url);
    return list(storageArea).then(function (records) {
      return records.filter(function (record) {
        return record.pageIdentity === pageIdentity;
      });
    });
  }

  function saveNew(storageArea, snapshot, options) {
    return writeRecord(storageArea, createRecord(snapshot, options));
  }

  function replaceLatest(storageArea, snapshot) {
    return listForPage(storageArea, snapshot.page.url).then(function (records) {
      if (records.length === 0) {
        return saveNew(storageArea, snapshot);
      }
      return writeRecord(storageArea, createRecord(snapshot, { id: records[0].id }));
    });
  }

  function loadLatest(storageArea, url) {
    return listForPage(storageArea, url).then(function (records) {
      return records.length > 0 ? records[0] : null;
    });
  }

  function removeVersion(storageArea, record) {
    if (!isRecord(record)) {
      throw new TypeError('A saved-form version record is required.');
    }
    return storageRemove(storageArea, versionKey(record.pageIdentity, record.id));
  }

  function removeAllForPage(storageArea, url) {
    return listForPage(storageArea, url).then(function (records) {
      return records.reduce(function (promise, record) {
        return promise.then(function () {
          return removeVersion(storageArea, record);
        });
      }, Promise.resolve());
    });
  }

  return {
    KEY_PREFIX: KEY_PREFIX,
    STORAGE_VERSION: STORAGE_VERSION,
    createRecord: createRecord,
    list: list,
    listForPage: listForPage,
    loadLatest: loadLatest,
    normalizePageUrl: normalizePageUrl,
    removeAllForPage: removeAllForPage,
    removeVersion: removeVersion,
    replaceLatest: replaceLatest,
    saveNew: saveNew,
    versionKey: versionKey
  };
}));
