function notify(message, iconUrl) {
  chrome.notifications.create(null, {
    type: 'basic',
    iconUrl: iconUrl || 'artwork/icons/icon-128.png',
    title: 'Form Checkpoint',
    message: message,
    priority: 2
  });
}

chrome.runtime.onMessage.addListener(function (request) {
  if (request.type === 'saved') {
    var savedAction = request.createdNewVersion ? 'Saved a new version with ' : 'Replaced the latest version with ';
    notify(savedAction + request.fieldCount + ' fields.');
  } else if (request.type === 'restored') {
    var result = request.result || {};
    var restoredCount = (result.restored || []).length;
    var unresolvedCount = (result.unmatched || []).length + (result.ambiguous || []).length;
    var message = 'Restored ' + restoredCount + ' fields.';
    if (unresolvedCount > 0) {
      message += ' ' + unresolvedCount + ' fields could not be matched safely.';
    }
    notify(message);
  } else if (request.type === 'cleared') {
    notify('All checkpoint and legacy template data was cleared.');
  }
});
