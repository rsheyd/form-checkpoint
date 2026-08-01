'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const CheckpointStorage = require('../content_scripts/checkpoint-storage.js');

function fakeStorage(initialItems = {}) {
  const items = Object.assign({}, initialItems);
  return {
    items,
    get(key, callback) {
      if (key === null) {
        callback(Object.assign({}, items));
      } else {
        const result = {};
        if (Object.prototype.hasOwnProperty.call(items, key)) {
          result[key] = items[key];
        }
        callback(result);
      }
    },
    set(values, callback) {
      Object.assign(items, values);
      callback();
    },
    remove(key, callback) {
      delete items[key];
      callback();
    }
  };
}

function snapshot(url, capturedAt = '2026-08-01T12:00:00.000Z', value = 'Sample') {
  return {
    schemaVersion: 1,
    capturedAt,
    page: { url, title: 'Fixture' },
    controls: [{ tag: 'input', type: 'text', value }]
  };
}

test('normalizes page identity to origin and pathname', () => {
  assert.equal(
    CheckpointStorage.normalizePageUrl('https://Example.TEST:443/application?step=2#details'),
    'https://example.test/application'
  );
  assert.notEqual(
    CheckpointStorage.normalizePageUrl('https://example.test/form-a'),
    CheckpointStorage.normalizePageUrl('https://example.test/form-b')
  );
});

test('saves multiple versions for the same form page', async () => {
  const storage = fakeStorage();
  await CheckpointStorage.saveNew(storage, snapshot(
    'https://example.test/form?step=1', '2026-08-01T10:00:00.000Z', 'First'
  ), { id: 'first' });
  await CheckpointStorage.saveNew(storage, snapshot(
    'https://example.test/form?step=2', '2026-08-01T11:00:00.000Z', 'Second'
  ), { id: 'second' });

  const records = await CheckpointStorage.listForPage(storage, 'https://example.test/form#later');

  assert.equal(records.length, 2);
  assert.deepEqual(records.map((record) => record.id), ['second', 'first']);
});

test('loads the newest version by default across query and fragment changes', async () => {
  const storage = fakeStorage();
  await CheckpointStorage.saveNew(storage, snapshot(
    'https://example.test/form?one', '2026-08-01T10:00:00.000Z', 'Old'
  ), { id: 'old' });
  await CheckpointStorage.saveNew(storage, snapshot(
    'https://example.test/form?two', '2026-08-01T11:00:00.000Z', 'New'
  ), { id: 'new' });

  const latest = await CheckpointStorage.loadLatest(storage, 'https://example.test/form#restore');

  assert.equal(latest.id, 'new');
  assert.equal(latest.snapshot.controls[0].value, 'New');
});

test('replace latest keeps its ID and does not add a version', async () => {
  const storage = fakeStorage();
  await CheckpointStorage.saveNew(storage, snapshot(
    'https://example.test/form', '2026-08-01T10:00:00.000Z', 'Old'
  ), { id: 'latest-id' });

  const replaced = await CheckpointStorage.replaceLatest(storage, snapshot(
    'https://example.test/form', '2026-08-01T12:00:00.000Z', 'Replacement'
  ));
  const records = await CheckpointStorage.listForPage(storage, 'https://example.test/form');

  assert.equal(replaced.id, 'latest-id');
  assert.equal(records.length, 1);
  assert.equal(records[0].snapshot.controls[0].value, 'Replacement');
});

test('different paths do not share versions', async () => {
  const storage = fakeStorage();
  await CheckpointStorage.saveNew(storage, snapshot('https://example.test/form-a'), { id: 'a' });

  assert.equal(await CheckpointStorage.loadLatest(storage, 'https://example.test/form-b'), null);
});

test('migrates a version-1 envelope exactly once', async () => {
  const original = snapshot('https://example.test/form', '2026-08-01T10:00:00.000Z');
  const legacyKey = 'form-checkpoint:checkpoint:v1:https://example.test/form';
  const storage = fakeStorage({
    [legacyKey]: {
      storageVersion: 1,
      pageIdentity: 'https://example.test/form',
      savedAt: original.capturedAt,
      snapshot: original
    }
  });

  const firstList = await CheckpointStorage.list(storage);
  const secondList = await CheckpointStorage.list(storage);

  assert.equal(firstList.length, 1);
  assert.equal(secondList.length, 1);
  assert.equal(storage.items[legacyKey], undefined);
});

test('migrates a Phase 4 temporary snapshot', async () => {
  const url = 'https://example.test/form?session=old#details';
  const original = snapshot(url);
  const temporaryKey = 'form-checkpoint:snapshot:' + url;
  const storage = fakeStorage({ [temporaryKey]: original });

  const latest = await CheckpointStorage.loadLatest(storage, url);

  assert.equal(latest.snapshot, original);
  assert.equal(storage.items[temporaryKey], undefined);
});

test('removes one version without deleting the others', async () => {
  const storage = fakeStorage();
  const first = await CheckpointStorage.saveNew(
    storage,
    snapshot('https://example.test/form', '2026-08-01T10:00:00.000Z'),
    { id: 'first' }
  );
  await CheckpointStorage.saveNew(
    storage,
    snapshot('https://example.test/form', '2026-08-01T11:00:00.000Z'),
    { id: 'second' }
  );

  await CheckpointStorage.removeVersion(storage, first);

  const records = await CheckpointStorage.listForPage(storage, 'https://example.test/form');
  assert.deepEqual(records.map((record) => record.id), ['second']);
});
