'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const SnapshotText = require('../content_scripts/snapshot-text.js');

test('formats page context and controls in snapshot order', () => {
  const text = SnapshotText.format({
    page: { title: 'Application', url: 'https://example.test/apply' },
    controls: [
      { label: 'Full name', name: 'name', value: 'Ada Lovelace', tag: 'input', type: 'text' },
      { name: 'notes', value: 'First line\nSecond line', tag: 'textarea', type: null },
      { id: 'terms', value: 'yes', checked: true, tag: 'input', type: 'checkbox' },
      { value: '', tag: 'input', type: 'text' }
    ]
  }, { savedAt: '8/2/2026, 2:30:00 PM' });

  assert.equal(text, [
    'Application',
    'https://example.test/apply',
    'Saved: 8/2/2026, 2:30:00 PM',
    '',
    'Full name: Ada Lovelace',
    'notes: First line\nSecond line',
    'terms: Selected (yes)',
    'Field 4: '
  ].join('\n'));
});

test('formats checkable states and selected options explicitly', () => {
  const snapshot = {
    page: { url: 'https://example.test/preferences' },
    controls: [
      { label: 'Email updates', value: 'email', checked: false, tag: 'input', type: 'checkbox' },
      { label: 'Plan', value: 'pro', checked: true, tag: 'input', type: 'radio' },
      {
        label: 'Regions', value: 'north', tag: 'select', type: null,
        selectedOptions: [{ index: 0, value: 'north' }, { index: 2, value: 'west' }]
      }
    ]
  };

  var text = SnapshotText.format(snapshot);
  assert.match(text, /Email updates: Not selected \(email\)/);
  assert.match(text, /Plan: Selected \(pro\)/);
  assert.match(text, /Regions: north, west/);
});

test('rejects values that are not snapshots', () => {
  assert.throws(() => SnapshotText.format(null), /form snapshot/i);
});
