/* global globalThis, module */
/*
 * Readable plain-text export for a saved form snapshot.
 *
 * This module has no Chrome or DOM dependency so saved checkpoints can be
 * copied from the management page without reopening or accessing the site.
 */
(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.SnapshotText = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function fieldLabel(control, index) {
    return control.label || control.name || control.id || 'Field ' + (index + 1);
  }

  function fieldValue(control) {
    if (control.type === 'checkbox' || control.type === 'radio') {
      var state = control.checked ? 'Selected' : 'Not selected';
      return control.value ? state + ' (' + control.value + ')' : state;
    }

    if (control.tag === 'select' && Array.isArray(control.selectedOptions)) {
      return control.selectedOptions.map(function (option) {
        return String(option.value);
      }).join(', ');
    }

    return String(control.value === undefined || control.value === null ? '' : control.value);
  }

  function format(snapshot, options) {
    if (!snapshot || !snapshot.page || !Array.isArray(snapshot.controls)) {
      throw new TypeError('A form snapshot is required.');
    }

    options = options || {};
    var lines = [];
    var title = String(snapshot.page.title || '').trim();
    if (title) {
      lines.push(title);
    }
    if (snapshot.page.url) {
      lines.push(String(snapshot.page.url));
    }
    if (options.savedAt) {
      lines.push('Saved: ' + String(options.savedAt));
    }
    if (lines.length > 0) {
      lines.push('');
    }

    snapshot.controls.forEach(function (control, index) {
      lines.push(fieldLabel(control, index) + ': ' + fieldValue(control));
    });

    return lines.join('\n');
  }

  return {
    fieldLabel: fieldLabel,
    fieldValue: fieldValue,
    format: format
  };
}));
