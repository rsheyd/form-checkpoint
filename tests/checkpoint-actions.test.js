'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const CheckpointActions = require('../popup/checkpoint-actions.js');

test('capture injects the engine before collecting the current document', async () => {
  const calls = [];
  const snapshot = { schemaVersion: 1, controls: [] };
  const chromeApi = {
    scripting: {
      async executeScript(details) {
        calls.push(details);
        if (details.func) {
          return [{ result: snapshot }];
        }
        return [];
      }
    }
  };

  const result = await CheckpointActions.captureTab(chromeApi, 42);

  assert.equal(result, snapshot);
  assert.deepEqual(calls[0], {
    target: { tabId: 42 },
    files: ['content_scripts/form-snapshot.js']
  });
  assert.equal(calls[1].target.tabId, 42);
  assert.equal(calls[1].func.name, 'capturePage');
});

test('restore injects the engine and passes the snapshot as an argument', async () => {
  const calls = [];
  const snapshot = { schemaVersion: 1, controls: [] };
  const restoreResult = { restored: [], unmatched: [], ambiguous: [], passes: 0 };
  const chromeApi = {
    scripting: {
      async executeScript(details) {
        calls.push(details);
        if (details.func) {
          return [{ result: restoreResult }];
        }
        return [];
      }
    }
  };

  const result = await CheckpointActions.restoreTab(chromeApi, 7, snapshot);

  assert.equal(result, restoreResult);
  assert.deepEqual(calls[0].files, ['content_scripts/form-snapshot.js']);
  assert.equal(calls[1].func.name, 'restorePage');
  assert.deepEqual(calls[1].args, [snapshot]);
});

test('reports a readable error when Chrome blocks script injection', async () => {
  const chromeApi = {
    scripting: {
      async executeScript() {
        throw new Error('Cannot access a chrome:// URL');
      }
    }
  };

  await assert.rejects(
    CheckpointActions.captureTab(chromeApi, 3),
    /Form data cannot be accessed on this page.*Cannot access a chrome:\/\//
  );
});
