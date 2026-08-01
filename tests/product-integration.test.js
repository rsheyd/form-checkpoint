'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

test('manifest and package metadata identify Form Checkpoint and its repository', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const packageJson = JSON.parse(read('package.json'));

  assert.equal(manifest.name, 'Form Checkpoint');
  assert.equal(manifest.version, '0.9.0');
  assert.equal(manifest.action.default_title, 'Form Checkpoint');
  assert.equal(new Set(manifest.permissions).size, manifest.permissions.length);
  assert.deepEqual(manifest.permissions.sort(), [
    'activeTab', 'notifications', 'scripting', 'storage', 'unlimitedStorage'
  ]);
  assert.equal(manifest.content_scripts, undefined);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.optional_host_permissions.sort(), [
    'file:///*', 'http://*/*', 'https://*/*'
  ]);
  assert.equal(packageJson.name, 'form-checkpoint');
  assert.equal(packageJson.version, manifest.version);
  assert.equal(packageJson.license, 'MIT');
  assert.match(packageJson.repository.url, /rsheyd\/form-checkpoint/);
});

test('popup presents checkpoint actions and loads only their required modules', () => {
  const popupHtml = read('popup/popup.html');

  assert.match(popupHtml, />Save Form</);
  assert.match(popupHtml, />Restore Saved Form</);
  assert.match(popupHtml, />Saved Forms</);
  assert.match(popupHtml, /Save the values on this page and restore them later\./);
  assert.match(popupHtml, />Save New Version</);
  assert.match(popupHtml, />Replace Latest</);
  assert.match(popupHtml, />Cancel</);
  assert.match(popupHtml, /checkpoint-storage\.js/);
  assert.match(popupHtml, /checkpoint-actions\.js/);
  assert.match(popupHtml, /\.\.\/css\/bootstrap\.min\.css/);
  assert.doesNotMatch(popupHtml, /button\.css/);
  assert.doesNotMatch(popupHtml, /https?:\/\//);
  assert.doesNotMatch(popupHtml, /form-parser\.js/);
  assert.doesNotMatch(popupHtml, /main\.js/);
});

test('management page uses current checkpoint APIs and separates legacy records', () => {
  const managerHtml = read('templates/templates.html');
  const managerSource = read('templates/template-table.js');

  assert.match(managerHtml, /id="checkpoint-groups"/);
  assert.match(managerHtml, /Legacy FormVault templates/);
  assert.match(managerSource, /CheckpointStorage\.list/);
  assert.match(managerSource, /CheckpointStorage\.removeVersion/);
  assert.match(managerSource, /CheckpointActions\.restoreTab/);
  assert.match(managerSource, /chrome\.permissions\.request/);
  assert.match(managerSource, /chrome\.storage\.sync/);
});

test('popup creates versions, permits replacement, and restores the latest', () => {
  const popupSource = read('popup/popup.js');

  assert.match(popupSource, /CheckpointStorage\.listForPage/);
  assert.match(popupSource, /CheckpointStorage\.saveNew/);
  assert.match(popupSource, /CheckpointStorage\.replaceLatest/);
  assert.match(popupSource, /CheckpointStorage\.loadLatest/);
});

test('release packaging uses an explicit runtime allowlist', () => {
  const gulpSource = read('gulpfile.js');
  const packageJson = JSON.parse(read('package.json'));

  assert.match(gulpSource, /var RELEASE_FILES = \[/);
  assert.match(gulpSource, /content_scripts\/form-snapshot\.js/);
  assert.match(gulpSource, /content_scripts\/checkpoint-storage\.js/);
  assert.doesNotMatch(gulpSource, /RELEASE_FILES[\s\S]*content_scripts\/form-parser\.js/);
  assert.equal(packageJson.scripts.package, 'npm test && npm run lint && gulp zip');
  assert.deepEqual(packageJson.dependencies, {});
});
