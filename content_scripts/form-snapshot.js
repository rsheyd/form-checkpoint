/* global globalThis, module */
/*
 * Dependency-free form snapshot collection.
 *
 * This module intentionally has no Chrome, storage, popup, or jQuery dependency
 * so it can be tested in isolation and reused by FormVault-compatible clients.
 */
(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.FormSnapshot = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SCHEMA_VERSION = 1;
  var EXCLUDED_INPUT_TYPES = {
    button: true,
    file: true,
    hidden: true,
    image: true,
    password: true,
    reset: true,
    submit: true
  };
  var COPIED_ATTRIBUTES = [
    'autocomplete',
    'inputmode',
    'multiple',
    'placeholder',
    'role'
  ];

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function readAttribute(element, name) {
    if (!element || typeof element.getAttribute !== 'function') {
      return null;
    }

    var value = element.getAttribute(name);
    return value === null ? null : String(value);
  }

  function getInputType(element) {
    if (String(element.tagName || '').toLowerCase() !== 'input') {
      return null;
    }

    return String(element.type || readAttribute(element, 'type') || 'text').toLowerCase();
  }

  function shouldCapture(element) {
    var tag = String(element && element.tagName || '').toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
      return false;
    }

    var inputType = getInputType(element);
    return inputType === null || !EXCLUDED_INPUT_TYPES[inputType];
  }

  function getLabel(element) {
    if (element && element.labels && element.labels.length > 0) {
      var labels = Array.prototype.map.call(element.labels, function (label) {
        return normalizeText(label.textContent);
      }).filter(Boolean);

      if (labels.length > 0) {
        return labels.join(' ');
      }
    }

    if (element && typeof element.closest === 'function') {
      var wrappingLabel = element.closest('label');
      if (wrappingLabel) {
        return normalizeText(wrappingLabel.textContent);
      }
    }

    return normalizeText(readAttribute(element, 'aria-label')) || null;
  }

  function getAttributes(element) {
    var attributes = {};

    COPIED_ATTRIBUTES.forEach(function (name) {
      var value = readAttribute(element, name);
      if (value !== null) {
        attributes[name] = value;
      }
    });

    var ariaLabel = readAttribute(element, 'aria-label');
    if (ariaLabel !== null) {
      attributes['aria-label'] = ariaLabel;
    }

    return attributes;
  }

  function getFormPosition(element) {
    if (!element || !element.form || !element.form.elements) {
      return null;
    }

    return Array.prototype.indexOf.call(element.form.elements, element);
  }

  function getSelectedOptions(element) {
    if (String(element.tagName || '').toLowerCase() !== 'select') {
      return undefined;
    }

    return Array.prototype.map.call(element.options || [], function (option, index) {
      if (!option.selected) {
        return null;
      }

      return {
        index: index,
        value: String(option.value)
      };
    }).filter(Boolean);
  }

  function captureControl(element, documentIndex) {
    var tag = String(element.tagName).toLowerCase();
    var inputType = getInputType(element);
    var record = {
      tag: tag,
      type: inputType,
      value: String(element.value === undefined || element.value === null ? '' : element.value),
      id: String(element.id || ''),
      name: String(element.name || ''),
      label: getLabel(element),
      attributes: getAttributes(element),
      position: {
        document: documentIndex,
        form: getFormPosition(element)
      }
    };

    if (inputType === 'checkbox' || inputType === 'radio') {
      record.checked = Boolean(element.checked);
    }

    var selectedOptions = getSelectedOptions(element);
    if (selectedOptions !== undefined) {
      record.selectedOptions = selectedOptions;
    }

    return record;
  }

  function capture(documentRoot, options) {
    if (!documentRoot || typeof documentRoot.querySelectorAll !== 'function') {
      throw new TypeError('A document-like root with querySelectorAll is required.');
    }

    options = options || {};
    var controls = Array.prototype.filter.call(
      documentRoot.querySelectorAll('input, textarea, select'),
      shouldCapture
    );
    var location = documentRoot.location || {};

    return {
      schemaVersion: SCHEMA_VERSION,
      capturedAt: options.capturedAt || new Date().toISOString(),
      page: {
        url: String(location.href || ''),
        title: String(documentRoot.title || '')
      },
      controls: controls.map(captureControl)
    };
  }

  function compatible(record, candidate) {
    if (!record || record.tag !== candidate.tag) {
      return false;
    }

    return record.tag !== 'input' || record.type === candidate.type;
  }

  function matchingAttributeScore(record, candidate) {
    var score = 0;
    var recordAttributes = record.attributes || {};
    var candidateAttributes = candidate.attributes || {};

    Object.keys(recordAttributes).forEach(function (name) {
      if (recordAttributes[name] && recordAttributes[name] === candidateAttributes[name]) {
        score += 5;
      }
    });

    return score;
  }

  function matchScore(record, candidate) {
    if (!compatible(record, candidate)) {
      return -1;
    }

    var score = 0;
    var identityScore = 0;
    var hasIdentity = Boolean(
      record.id || record.name || record.label ||
      Object.keys(record.attributes || {}).length > 0 ||
      record.type === 'checkbox' || record.type === 'radio'
    );
    if (record.id && record.id === candidate.id) {
      identityScore += 100;
    }
    if (record.name && record.name === candidate.name) {
      identityScore += 40;
    }
    if (record.label && record.label === candidate.label) {
      identityScore += 20;
    }
    if ((record.type === 'checkbox' || record.type === 'radio') &&
        record.value === candidate.value) {
      identityScore += 60;
    }

    identityScore += matchingAttributeScore(record, candidate);
    if (hasIdentity && identityScore === 0) {
      return -1;
    }
    score += identityScore;

    var recordPosition = record.position || {};
    var candidatePosition = candidate.position || {};
    if (recordPosition.form !== null && recordPosition.form !== undefined &&
        recordPosition.form === candidatePosition.form) {
      score += 8;
    }
    if (recordPosition.document !== null && recordPosition.document !== undefined &&
        recordPosition.document === candidatePosition.document) {
      score += 4;
    }

    return score;
  }

  function matchControls(records, elements) {
    var candidateRecords = elements.map(captureControl);
    var usedCandidates = {};
    var matches = [];
    var unmatched = [];
    var ambiguous = [];

    records.forEach(function (record, recordIndex) {
      var bestScore = 0;
      var bestCandidates = [];

      candidateRecords.forEach(function (candidate, candidateIndex) {
        if (usedCandidates[candidateIndex]) {
          return;
        }

        var score = matchScore(record, candidate);
        if (score > bestScore) {
          bestScore = score;
          bestCandidates = [candidateIndex];
        } else if (score === bestScore && score > 0) {
          bestCandidates.push(candidateIndex);
        }
      });

      if (bestCandidates.length === 1) {
        usedCandidates[bestCandidates[0]] = true;
        matches.push({
          recordIndex: recordIndex,
          candidateIndex: bestCandidates[0],
          score: bestScore
        });
      } else if (bestCandidates.length > 1) {
        ambiguous.push({
          recordIndex: recordIndex,
          candidateIndexes: bestCandidates,
          score: bestScore
        });
      } else {
        unmatched.push(recordIndex);
      }
    });

    return {
      matches: matches,
      unmatched: unmatched,
      ambiguous: ambiguous
    };
  }

  function restoreSelect(element, selectedOptions) {
    var savedOptions = selectedOptions || [];
    var options = Array.prototype.slice.call(element.options || []);

    options.forEach(function (option, optionIndex) {
      setNativeProperty(option, 'selected', savedOptions.some(function (savedOption) {
        if (savedOption.index === optionIndex && savedOption.value === String(option.value)) {
          return true;
        }

        return savedOption.index === undefined && savedOption.value === String(option.value);
      }));
    });
  }

  function setNativeProperty(element, property, value) {
    var prototype = Object.getPrototypeOf(element);

    while (prototype) {
      var descriptor = Object.getOwnPropertyDescriptor(prototype, property);
      if (descriptor && typeof descriptor.set === 'function') {
        descriptor.set.call(element, value);
        return;
      }
      prototype = Object.getPrototypeOf(prototype);
    }

    element[property] = value;
  }

  function dispatchRestoreEvents(element) {
    if (!element || typeof element.dispatchEvent !== 'function') {
      return;
    }

    var documentRoot = element.ownerDocument;
    var view = documentRoot && documentRoot.defaultView;
    var EventConstructor = view && view.Event;

    ['input', 'change'].forEach(function (type) {
      var event;
      if (typeof EventConstructor === 'function') {
        event = new EventConstructor(type, { bubbles: true });
      } else if (documentRoot && typeof documentRoot.createEvent === 'function') {
        event = documentRoot.createEvent('Event');
        event.initEvent(type, true, false);
      }

      if (event) {
        element.dispatchEvent(event);
      }
    });
  }

  function restoreControl(record, element, options) {
    if (record.tag === 'select') {
      restoreSelect(element, record.selectedOptions);
    } else if (record.type === 'checkbox' || record.type === 'radio') {
      setNativeProperty(element, 'checked', Boolean(record.checked));
    } else {
      setNativeProperty(
        element,
        'value',
        String(record.value === undefined || record.value === null ? '' : record.value)
      );
    }

    if (!options || options.dispatchEvents !== false) {
      dispatchRestoreEvents(element);
    }
  }

  function getControls(documentRoot, restoredElements) {
    return Array.prototype.filter.call(
      documentRoot.querySelectorAll('input, textarea, select'),
      function (element) {
        return shouldCapture(element) && restoredElements.indexOf(element) === -1;
      }
    );
  }

  function runRestorePass(pending, elements, options, pass) {
    var records = pending.map(function (entry) {
      return entry.record;
    });
    var result = matchControls(records, elements);
    var matchedRecordIndexes = {};
    var restored = [];
    var restoredElements = [];

    result.matches.forEach(function (match) {
      var pendingEntry = pending[match.recordIndex];
      var element = elements[match.candidateIndex];
      restoreControl(pendingEntry.record, element, options);
      restoredElements.push(element);
      matchedRecordIndexes[match.recordIndex] = true;
      restored.push({
        recordIndex: pendingEntry.recordIndex,
        candidateIndex: match.candidateIndex,
        score: match.score,
        pass: pass
      });
    });

    return {
      restored: restored,
      restoredElements: restoredElements,
      unmatched: result.unmatched.map(function (recordIndex) {
        return pending[recordIndex].recordIndex;
      }),
      ambiguous: result.ambiguous.map(function (entry) {
        return {
          recordIndex: pending[entry.recordIndex].recordIndex,
          candidateIndexes: entry.candidateIndexes,
          score: entry.score
        };
      }),
      pending: pending.filter(function (entry, pendingIndex) {
        return !matchedRecordIndexes[pendingIndex];
      })
    };
  }

  function restore(snapshot, documentRoot, options) {
    if (!snapshot || !Array.isArray(snapshot.controls)) {
      throw new TypeError('A snapshot with a controls array is required.');
    }
    if (!documentRoot || typeof documentRoot.querySelectorAll !== 'function') {
      throw new TypeError('A document-like root with querySelectorAll is required.');
    }

    options = options || {};
    var requestedPasses = parseInt(options.maxPasses, 10);
    var maxPasses = requestedPasses > 0 ? requestedPasses : 3;
    var pending = snapshot.controls.map(function (record, recordIndex) {
      return { record: record, recordIndex: recordIndex };
    });
    var restored = [];
    var restoredElements = [];
    var unmatched = pending.map(function (entry) {
      return entry.recordIndex;
    });
    var ambiguous = [];
    var passes = 0;

    while (pending.length > 0 && passes < maxPasses) {
      passes += 1;
      var elements = getControls(documentRoot, restoredElements);
      var passResult = runRestorePass(pending, elements, options, passes);
      restored = restored.concat(passResult.restored);
      restoredElements = restoredElements.concat(passResult.restoredElements);
      unmatched = passResult.unmatched;
      ambiguous = passResult.ambiguous;

      if (passResult.restored.length === 0) {
        break;
      }

      pending = passResult.pending;
    }

    return {
      restored: restored,
      unmatched: unmatched,
      ambiguous: ambiguous,
      passes: passes
    };
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    capture: capture,
    captureControl: captureControl,
    dispatchRestoreEvents: dispatchRestoreEvents,
    matchControls: matchControls,
    restore: restore,
    restoreControl: restoreControl,
    setNativeProperty: setNativeProperty,
    shouldCapture: shouldCapture
  };
}));
