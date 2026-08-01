/* global CheckpointActions, CheckpointStorage */

var pendingSaveTab = null;

function setStatus(message) {
  $('#status').text(message);
}

function setPrimaryActionsVisible(visible) {
  $('#save-template, #restore-template, #edit-templates, #clear').prop('hidden', !visible);
}

function hideSaveChoice() {
  pendingSaveTab = null;
  document.getElementById('save-choice').hidden = true;
  setPrimaryActionsVisible(true);
}

function showSaveChoice(tab, latest) {
  pendingSaveTab = tab;
  var savedAt = new Date(latest.savedAt).toLocaleString();
  $('#save-choice-message').text('A saved version already exists from ' + savedAt + '.');
  setPrimaryActionsVisible(false);
  document.getElementById('save-choice').hidden = false;
  setStatus('');
}

async function getActiveTab() {
  var tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tabs[0] || tabs[0].id === undefined) {
    throw new Error('The active tab is unavailable.');
  }
  return tabs[0];
}

async function saveCurrentForm(tab, replaceLatest) {
  try {
    setStatus(replaceLatest ? 'Replacing latest saved version…' : 'Saving new version…');
    var snapshot = await CheckpointActions.captureTab(chrome, tab.id);
    if (replaceLatest) {
      await CheckpointStorage.replaceLatest(chrome.storage.local, snapshot);
    } else {
      await CheckpointStorage.saveNew(chrome.storage.local, snapshot);
    }
    chrome.runtime.sendMessage({
      type: 'saved',
      id: snapshot.page.url,
      fieldCount: snapshot.controls.length,
      createdNewVersion: !replaceLatest
    });
    window.close();
  } catch (error) {
    hideSaveChoice();
    setStatus(error.message || String(error));
  }
}

$(function () {
  $('#save-template').click(async function () {
    try {
      setStatus('Checking saved versions…');
      var tab = await getActiveTab();
      var versions = await CheckpointStorage.listForPage(chrome.storage.local, tab.url);
      if (versions.length > 0) {
        showSaveChoice(tab, versions[0]);
      } else {
        await saveCurrentForm(tab, false);
      }
    } catch (error) {
      setStatus(error.message || String(error));
    }
  });

  $('#save-new-version').click(function () {
    if (pendingSaveTab) {
      saveCurrentForm(pendingSaveTab, false);
    }
  });

  $('#replace-latest').click(function () {
    if (pendingSaveTab) {
      saveCurrentForm(pendingSaveTab, true);
    }
  });

  $('#cancel-save').click(function () {
    hideSaveChoice();
    setStatus('Save cancelled.');
  });

  $('#restore-template').click(async function () {
    try {
      setStatus('Restoring latest saved version…');
      var tab = await getActiveTab();
      var savedVersion = await CheckpointStorage.loadLatest(chrome.storage.local, tab.url);
      if (!savedVersion) {
        setStatus('There is no saved form for this page.');
        return;
      }
      var result = await CheckpointActions.restoreTab(chrome, tab.id, savedVersion.snapshot);
      chrome.runtime.sendMessage({ type: 'restored', id: tab.url, result: result });
      window.close();
    } catch (error) {
      setStatus(error.message || String(error));
    }
  });

  $('#edit-templates').click(function () {
    chrome.tabs.create({ url: 'templates/templates.html' });
    window.close();
  });

  $('#clear').click(function () {
    // Destructive clearing requires an explicit browser-native confirmation.
    // eslint-disable-next-line no-alert
    if (!confirm('Delete all saved forms, including every version and legacy FormVault template?')) {
      return;
    }
    Promise.all([
      chrome.storage.local.clear(),
      chrome.storage.sync.clear()
    ]).then(function () {
      chrome.runtime.sendMessage({ type: 'cleared' });
      window.close();
    }).catch(function (error) {
      setStatus(error.message || String(error));
    });
  });
});
