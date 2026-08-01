'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');

function loadLegacyParser(classNamesByName = {}) {
  const context = {
    DataStack: function DataStack() {},
    TemplateService: function TemplateService() {},
    console: { log() {}, warn() {} },
    $: function jqueryStub(selector) {
      const match = /^input\[name="(.+)"\]$/.exec(selector);
      return {
        attr(attribute) {
          assert.equal(attribute, 'class');
          return match ? classNamesByName[match[1]] : undefined;
        }
      };
    }
  };

  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(projectRoot, 'content_scripts/form-parser.js'), 'utf8'),
    context,
    { filename: 'content_scripts/form-parser.js' }
  );
  return context;
}

test('legacy serialization maps ordinary named values and their classes', () => {
  const { createFormObj } = loadLegacyParser({ fullName: 'form-control' });
  const result = createFormObj([
    { name: 'fullName', value: 'Sample Person' }
  ]);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    fullName: { class: 'form-control', value: 'Sample Person' }
  });
});

test('baseline limitation: repeated names collapse to the final serialized value', () => {
  const { createFormObj } = loadLegacyParser();
  const result = createFormObj([
    { name: 'householdMember', value: 'Alex' },
    { name: 'householdMember', value: 'Sam' }
  ]);

  assert.equal(Object.keys(result).length, 1);
  assert.equal(result.householdMember.value, 'Sam');
});

test('baseline limitation: the parser can only retain controls supplied by serializeArray', () => {
  const { createFormObj } = loadLegacyParser();
  const serializedByJquery = [
    { name: 'fullName', value: 'Sample Person' }
  ];
  const result = createFormObj(serializedByJquery);

  assert.equal(result.fullName.value, 'Sample Person');
  assert.equal(result.updates, undefined);
  assert.equal(result.outsideForm, undefined);
});

test('baseline limitation: popup save injection references globals not included in the injected function', () => {
  const popupSource = fs.readFileSync(path.join(projectRoot, 'popup/popup.js'), 'utf8');

  assert.match(popupSource, /func:\s*saveTemplates/);
  assert.match(popupSource, /function saveTemplates\(\)[\s\S]*new FormParser/);
  assert.match(popupSource, /function saveTemplates\(\)[\s\S]*new URLParser/);
  assert.doesNotMatch(
    popupSource,
    /files:\s*\[[^\]]*form-parser\.js[^\]]*\]/
  );
});
