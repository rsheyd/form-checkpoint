'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const FormSnapshot = require('../content_scripts/form-snapshot.js');

function control(properties) {
  const attributes = Object.assign({}, properties.attributes);
  const element = Object.assign({
    tagName: 'INPUT',
    type: 'text',
    value: '',
    id: '',
    name: '',
    checked: false,
    labels: [],
    form: null,
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null;
    },
    closest() {
      return null;
    }
  }, properties);
  delete element.attributes;
  return element;
}

function documentWith(controls) {
  return {
    title: 'Compatibility fixture',
    location: { href: 'https://example.test/application?step=1#details' },
    querySelectorAll(selector) {
      assert.equal(selector, 'input, textarea, select');
      return controls;
    }
  };
}

test('captures current values from controls inside and outside forms', () => {
  const form = { elements: [] };
  const inside = control({ id: 'full-name', name: 'fullName', value: 'Edited value', form });
  const outside = control({ tagName: 'TEXTAREA', type: undefined, name: 'outsideForm', value: 'Outside value' });
  form.elements.push(inside);

  const snapshot = FormSnapshot.capture(documentWith([inside, outside]), {
    capturedAt: '2026-08-01T12:00:00.000Z'
  });

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.capturedAt, '2026-08-01T12:00:00.000Z');
  assert.deepEqual(snapshot.page, {
    url: 'https://example.test/application?step=1#details',
    title: 'Compatibility fixture'
  });
  assert.equal(snapshot.controls[0].value, 'Edited value');
  assert.equal(snapshot.controls[0].position.form, 0);
  assert.equal(snapshot.controls[1].value, 'Outside value');
  assert.equal(snapshot.controls[1].position.form, null);
});

test('preserves repeated names as separate ordered records', () => {
  const snapshot = FormSnapshot.capture(documentWith([
    control({ name: 'householdMember', value: 'Alex' }),
    control({ name: 'householdMember', value: 'Sam' })
  ]));

  assert.equal(snapshot.controls.length, 2);
  assert.deepEqual(snapshot.controls.map((record) => record.value), ['Alex', 'Sam']);
  assert.deepEqual(snapshot.controls.map((record) => record.position.document), [0, 1]);
});

test('records both checked and unchecked checkbox and radio states', () => {
  const snapshot = FormSnapshot.capture(documentWith([
    control({ type: 'checkbox', name: 'updates', value: 'news', checked: true }),
    control({ type: 'checkbox', name: 'updates', value: 'events', checked: false }),
    control({ type: 'radio', name: 'contact', value: 'email', checked: true }),
    control({ type: 'radio', name: 'contact', value: 'phone', checked: false })
  ]));

  assert.deepEqual(snapshot.controls.map((record) => record.checked), [true, false, true, false]);
});

test('records every selected option by index and value', () => {
  const select = control({
    tagName: 'SELECT',
    type: undefined,
    name: 'regions',
    value: 'north',
    options: [
      { value: 'north', selected: true },
      { value: 'south', selected: false },
      { value: 'west', selected: true }
    ],
    attributes: { multiple: '' }
  });

  const [record] = FormSnapshot.capture(documentWith([select])).controls;

  assert.deepEqual(record.selectedOptions, [
    { index: 0, value: 'north' },
    { index: 2, value: 'west' }
  ]);
  assert.equal(record.attributes.multiple, '');
});

test('captures stable identifying and descriptive signals', () => {
  const labelled = control({
    id: 'email',
    name: 'applicantEmail',
    value: 'sample@example.test',
    labels: [{ textContent: ' Applicant   email ' }],
    attributes: {
      autocomplete: 'email',
      placeholder: 'name@example.test',
      'aria-label': 'Email address'
    }
  });

  const [record] = FormSnapshot.capture(documentWith([labelled])).controls;

  assert.equal(record.label, 'Applicant email');
  assert.equal(record.id, 'email');
  assert.equal(record.name, 'applicantEmail');
  assert.deepEqual(record.attributes, {
    autocomplete: 'email',
    placeholder: 'name@example.test',
    'aria-label': 'Email address'
  });
});

test('excludes sensitive and non-data input types', () => {
  const snapshot = FormSnapshot.capture(documentWith([
    control({ type: 'password', name: 'password', value: 'secret' }),
    control({ type: 'file', name: 'attachment', value: 'resume.pdf' }),
    control({ type: 'hidden', name: 'csrf', value: 'token' }),
    control({ type: 'submit', value: 'Send' }),
    control({ type: 'text', name: 'safe', value: 'Sample' })
  ]));

  assert.equal(snapshot.controls.length, 1);
  assert.equal(snapshot.controls[0].name, 'safe');
});

test('requires a document-like capture root', () => {
  assert.throws(
    () => FormSnapshot.capture(null),
    /document-like root with querySelectorAll/
  );
});

test('round trips standard values and controls with repeated names', () => {
  const original = [
    control({ id: 'full-name', name: 'fullName', value: 'Sample Person' }),
    control({ name: 'householdMember', value: 'Alex' }),
    control({ name: 'householdMember', value: 'Sam' }),
    control({ tagName: 'TEXTAREA', type: undefined, name: 'notes', value: 'Saved notes' })
  ];
  const snapshot = FormSnapshot.capture(documentWith(original));
  const targets = [
    control({ id: 'full-name', name: 'fullName', value: '' }),
    control({ name: 'householdMember', value: '' }),
    control({ name: 'householdMember', value: '' }),
    control({ tagName: 'TEXTAREA', type: undefined, name: 'notes', value: '' })
  ];

  const result = FormSnapshot.restore(snapshot, documentWith(targets));

  assert.deepEqual(targets.map((element) => element.value), [
    'Sample Person', 'Alex', 'Sam', 'Saved notes'
  ]);
  assert.equal(result.restored.length, 4);
  assert.deepEqual(result.unmatched, []);
  assert.deepEqual(result.ambiguous, []);
});

test('uses stable IDs and names when controls move', () => {
  const snapshot = FormSnapshot.capture(documentWith([
    control({ id: 'first', name: 'first', value: 'One' }),
    control({ id: 'second', name: 'second', value: 'Two' })
  ]));
  const targets = [
    control({ id: 'second', name: 'second', value: '' }),
    control({ id: 'first', name: 'first', value: '' })
  ];

  FormSnapshot.restore(snapshot, documentWith(targets));

  assert.equal(targets[0].value, 'Two');
  assert.equal(targets[1].value, 'One');
});

test('restores checkbox and radio checked states without changing option values', () => {
  const snapshot = FormSnapshot.capture(documentWith([
    control({ type: 'checkbox', name: 'updates', value: 'news', checked: true }),
    control({ type: 'checkbox', name: 'updates', value: 'events', checked: false }),
    control({ type: 'radio', name: 'contact', value: 'email', checked: true }),
    control({ type: 'radio', name: 'contact', value: 'phone', checked: false })
  ]));
  const targets = [
    control({ type: 'checkbox', name: 'updates', value: 'news', checked: false }),
    control({ type: 'checkbox', name: 'updates', value: 'events', checked: true }),
    control({ type: 'radio', name: 'contact', value: 'email', checked: false }),
    control({ type: 'radio', name: 'contact', value: 'phone', checked: true })
  ];

  FormSnapshot.restore(snapshot, documentWith(targets));

  assert.deepEqual(targets.map((element) => element.checked), [true, false, true, false]);
  assert.deepEqual(targets.map((element) => element.value), ['news', 'events', 'email', 'phone']);
});

test('restores selected options by index and value', () => {
  const original = control({
    tagName: 'SELECT',
    type: undefined,
    id: 'regions',
    name: 'regions',
    value: 'north',
    options: [
      { value: 'north', selected: true },
      { value: 'south', selected: false },
      { value: 'west', selected: true }
    ]
  });
  const target = control({
    tagName: 'SELECT',
    type: undefined,
    id: 'regions',
    name: 'regions',
    value: 'south',
    options: [
      { value: 'north', selected: false },
      { value: 'south', selected: true },
      { value: 'west', selected: false }
    ]
  });

  FormSnapshot.restore(FormSnapshot.capture(documentWith([original])), documentWith([target]));

  assert.deepEqual(target.options.map((option) => option.selected), [true, false, true]);
});

test('reports missing fields without mutating unrelated controls', () => {
  const snapshot = FormSnapshot.capture(documentWith([
    control({ id: 'missing', name: 'missing', value: 'Saved' })
  ]));
  const unrelated = control({ id: 'other', name: 'other', value: 'Keep me' });

  const result = FormSnapshot.restore(snapshot, documentWith([unrelated]));

  assert.deepEqual(result.unmatched, [0]);
  assert.equal(result.restored.length, 0);
  assert.equal(unrelated.value, 'Keep me');
});

test('reports equally plausible matches as ambiguous instead of guessing', () => {
  const snapshot = {
    controls: [{
      tag: 'input',
      type: 'text',
      value: 'Saved',
      id: '',
      name: 'duplicate',
      label: null,
      attributes: {},
      position: {}
    }]
  };
  const targets = [
    control({ name: 'duplicate', value: 'First' }),
    control({ name: 'duplicate', value: 'Second' })
  ];

  const result = FormSnapshot.restore(snapshot, documentWith(targets));

  assert.equal(result.ambiguous.length, 1);
  assert.deepEqual(result.ambiguous[0].candidateIndexes, [0, 1]);
  assert.deepEqual(targets.map((element) => element.value), ['First', 'Second']);
});

test('uses a prototype setter instead of an element-level controlled setter', () => {
  let nativeSetterCalls = 0;
  let controlledSetterCalls = 0;

  function NativeInput() {
    this._value = '';
  }
  Object.defineProperty(NativeInput.prototype, 'value', {
    configurable: true,
    get() {
      return this._value;
    },
    set(value) {
      nativeSetterCalls += 1;
      this._value = value;
    }
  });

  const target = new NativeInput();
  Object.assign(target, control({ id: 'controlled', name: 'controlled' }));
  target._value = '';
  Object.defineProperty(target, 'value', {
    configurable: true,
    get() {
      return this._value;
    },
    set(value) {
      controlledSetterCalls += 1;
      this._value = value;
    }
  });
  nativeSetterCalls = 0;
  controlledSetterCalls = 0;
  const snapshot = FormSnapshot.capture(documentWith([
    control({ id: 'controlled', name: 'controlled', value: 'Restored' })
  ]));

  FormSnapshot.restore(snapshot, documentWith([target]));

  assert.equal(target.value, 'Restored');
  assert.equal(nativeSetterCalls, 1);
  assert.equal(controlledSetterCalls, 0);
});

test('dispatches bubbling input and change events after restoration', () => {
  const events = [];
  class TestEvent {
    constructor(type, options) {
      this.type = type;
      this.bubbles = options.bubbles;
    }
  }
  const target = control({
    id: 'eventful',
    name: 'eventful',
    ownerDocument: { defaultView: { Event: TestEvent } },
    dispatchEvent(event) {
      events.push({ type: event.type, bubbles: event.bubbles, value: this.value });
      return true;
    }
  });
  const snapshot = FormSnapshot.capture(documentWith([
    control({ id: 'eventful', name: 'eventful', value: 'Restored' })
  ]));

  FormSnapshot.restore(snapshot, documentWith([target]));

  assert.deepEqual(events, [
    { type: 'input', bubbles: true, value: 'Restored' },
    { type: 'change', bubbles: true, value: 'Restored' }
  ]);
});

test('restores synchronously revealed controls in a later bounded pass', () => {
  const controls = [];
  const revealed = control({ id: 'details', name: 'details', value: '' });
  const trigger = control({
    id: 'show-details',
    name: 'showDetails',
    type: 'checkbox',
    value: 'yes',
    checked: false,
    ownerDocument: {
      defaultView: {
        Event: class TestEvent {
          constructor(type, options) {
            this.type = type;
            this.bubbles = options.bubbles;
          }
        }
      }
    },
    dispatchEvent(event) {
      if (event.type === 'change' && this.checked && controls.indexOf(revealed) === -1) {
        controls.push(revealed);
      }
      return true;
    }
  });
  controls.push(trigger);
  const dynamicDocument = documentWith(controls);
  const snapshot = FormSnapshot.capture(documentWith([
    control({
      id: 'show-details',
      name: 'showDetails',
      type: 'checkbox',
      value: 'yes',
      checked: true
    }),
    control({ id: 'details', name: 'details', value: 'Conditional value' })
  ]));

  const result = FormSnapshot.restore(snapshot, dynamicDocument, { maxPasses: 3 });

  assert.equal(trigger.checked, true);
  assert.equal(revealed.value, 'Conditional value');
  assert.equal(result.passes, 2);
  assert.deepEqual(result.restored.map((entry) => entry.pass), [1, 2]);
  assert.deepEqual(result.unmatched, []);
});

test('stops dynamic restoration at the configured pass limit', () => {
  const snapshot = FormSnapshot.capture(documentWith([
    control({ id: 'present', name: 'present', value: 'Restored' }),
    control({ id: 'never-appears', name: 'neverAppears', value: 'Missing' })
  ]));
  const target = control({ id: 'present', name: 'present', value: '' });

  const result = FormSnapshot.restore(snapshot, documentWith([target]), { maxPasses: 1 });

  assert.equal(result.passes, 1);
  assert.deepEqual(result.unmatched, [1]);
});
