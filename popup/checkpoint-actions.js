/* global FormSnapshot, globalThis, module */
/*
 * On-demand capture and restoration for the active tab.
 * Loading the engine before every operation makes this work in tabs that were
 * opened before the extension was installed or reloaded.
 */
(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.CheckpointActions = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function capturePage() {
    return FormSnapshot.capture(document);
  }

  function restorePage(snapshot) {
    return FormSnapshot.restore(snapshot, document);
  }

  function firstResult(results, operation) {
    if (!results || results.length === 0 || results[0].result === undefined) {
      throw new Error(operation + ' did not return a result.');
    }

    return results[0].result;
  }

  function loadEngine(chromeApi, tabId) {
    return chromeApi.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content_scripts/form-snapshot.js']
    });
  }

  function runInTab(chromeApi, tabId, details) {
    return loadEngine(chromeApi, tabId).then(function () {
      return chromeApi.scripting.executeScript(details);
    }).catch(function (error) {
      throw new Error(
        'Form data cannot be accessed on this page. Chrome blocks extensions on internal pages and some protected sites. ' +
        (error && error.message ? error.message : String(error))
      );
    });
  }

  function captureTab(chromeApi, tabId) {
    return runInTab(chromeApi, tabId, {
      target: { tabId: tabId },
      func: capturePage
    }).then(function (results) {
      return firstResult(results, 'Capture');
    });
  }

  function restoreTab(chromeApi, tabId, snapshot) {
    return runInTab(chromeApi, tabId, {
      target: { tabId: tabId },
      func: restorePage,
      args: [snapshot]
    }).then(function (results) {
      return firstResult(results, 'Restore');
    });
  }

  return {
    captureTab: captureTab,
    restoreTab: restoreTab
  };
}));
