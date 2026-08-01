/* global CheckpointActions, CheckpointStorage */

function setStatus(message) {
  document.getElementById('status').textContent = message;
}

function createButton(label, className, handler) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-xs ' + className;
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

function createTab(url) {
  return new Promise(function (resolve) {
    chrome.tabs.create({ url: url, active: true }, resolve);
  });
}

function sitePattern(url) {
  var parsed = new URL(url);
  return parsed.protocol === 'file:' ? 'file:///*' : parsed.origin + '/*';
}

function ensureSiteAccess(url) {
  var request = { origins: [sitePattern(url)] };
  return new Promise(function (resolve, reject) {
    chrome.permissions.request(request, function (granted) {
      if (granted) {
        resolve();
      } else {
        reject(new Error('Site access is required to restore this saved version.'));
      }
    });
  });
}

function waitForTab(tabId) {
  return new Promise(function (resolve, reject) {
    function done(error) {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    }
    function onUpdated(id, info) {
      if (id === tabId && info.status === 'complete') {
        done();
      }
    }
    function onRemoved(id) {
      if (id === tabId) {
        done(new Error('The tab was closed before the checkpoint could be restored.'));
      }
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    chrome.tabs.get(tabId, function (tab) {
      if (!chrome.runtime.lastError && tab.status === 'complete') {
        done();
      }
    });
  });
}

async function openAndRestore(record) {
  try {
    await ensureSiteAccess(record.snapshot.page.url);
    setStatus('Opening ' + record.pageIdentity + '…');
    var tab = await createTab(record.snapshot.page.url);
    await waitForTab(tab.id);
    var result = await CheckpointActions.restoreTab(chrome, tab.id, record.snapshot);
    var unresolved = result.unmatched.length + result.ambiguous.length;
    var message = 'Restored ' + result.restored.length + ' fields.';
    if (unresolved > 0) {
      message += ' ' + unresolved + ' fields could not be matched safely.';
    }
    setStatus(message);
  } catch (error) {
    setStatus(error.message || String(error));
  }
}

function renderVersion(record, tableBody, group) {
  var row = tableBody.insertRow();
  row.insertCell().textContent = new Date(record.savedAt).toLocaleString();
  row.insertCell().textContent = String(record.snapshot.controls.length);
  var actions = row.insertCell();
  actions.appendChild(createButton('Open & restore', 'btn-primary', function () {
    openAndRestore(record);
  }));
  actions.appendChild(document.createTextNode(' '));
  actions.appendChild(createButton('Delete', 'btn-danger', async function () {
    // Destructive deletion requires an explicit browser-native confirmation.
    // eslint-disable-next-line no-alert
    if (!confirm('Delete this saved version?')) {
      return;
    }
    await CheckpointStorage.removeVersion(chrome.storage.local, record);
    row.remove();
    if (tableBody.rows.length === 0) {
      group.remove();
    }
    setStatus('Saved version deleted.');
  }));
}

function renderCheckpointGroups(records) {
  var groups = {};
  records.forEach(function (record) {
    if (!groups[record.pageIdentity]) {
      groups[record.pageIdentity] = [];
    }
    groups[record.pageIdentity].push(record);
  });

  Object.keys(groups).sort().forEach(function (pageIdentity) {
    var group = document.createElement('section');
    group.className = 'saved-form-group';
    var heading = document.createElement('h2');
    heading.textContent = pageIdentity;
    group.appendChild(heading);

    var table = document.createElement('table');
    table.className = 'table table-bordered table-striped';
    table.innerHTML = '<thead><tr><th>Saved</th><th>Fields</th><th>Actions</th></tr></thead>';
    var tableBody = document.createElement('tbody');
    table.appendChild(tableBody);
    group.appendChild(table);
    document.getElementById('checkpoint-groups').appendChild(group);

    groups[pageIdentity].forEach(function (record) {
      renderVersion(record, tableBody, group);
    });
  });
}

function getLegacyTemplates() {
  return new Promise(function (resolve) {
    chrome.storage.sync.get(null, function (items) {
      resolve(Object.keys(items || {}).filter(function (key) {
        return key.indexOf('-domain') === -1 && key.slice(-9) === '-template';
      }));
    });
  });
}

function renderLegacyTemplate(key) {
  var url = key.slice(0, -9);
  var row = document.getElementById('legacy-rows').insertRow();
  row.insertCell().textContent = url;
  var actions = row.insertCell();
  actions.appendChild(createButton('Open page', 'btn-default', function () {
    chrome.tabs.create({ url: url, active: true });
  }));
  actions.appendChild(document.createTextNode(' '));
  actions.appendChild(createButton('Delete', 'btn-danger', function () {
    // Destructive deletion requires an explicit browser-native confirmation.
    // eslint-disable-next-line no-alert
    if (!confirm('Delete this legacy template?')) {
      return;
    }
    chrome.storage.sync.remove(key, function () {
      row.remove();
      setStatus('Legacy template deleted.');
    });
  }));
}

document.addEventListener('DOMContentLoaded', async function () {
  var records = await CheckpointStorage.list(chrome.storage.local);
  renderCheckpointGroups(records);
  if (records.length === 0) {
    setStatus('No saved forms yet.');
  }

  var legacyKeys = await getLegacyTemplates();
  if (legacyKeys.length > 0) {
    document.getElementById('legacy-section').hidden = false;
    legacyKeys.forEach(renderLegacyTemplate);
  }
});
