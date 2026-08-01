# Development

## Automated baseline tests

Run the dependency-free characterization suite with:

```sh
npm test
```

These tests record the inherited FormVault parser's current behavior, including known limitations that later implementation phases are expected to replace. See `PROJECT-STATUS.md` for the current baseline and phased plan.

## Test local changes in Chrome

The extension does not need a build step for local development. Chrome can load the repository directly:

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the repository root—the directory containing `manifest.json`.
4. Pin the extension from Chrome's Extensions menu if you want its toolbar button to remain visible.
5. Open a non-sensitive test page, enter sample form values, and exercise the popup actions.

After changing the source, return to `chrome://extensions` and click the extension's **Reload** button. Form Checkpoint injects its capture engine only when an action is clicked, so existing test tabs do not normally need to be refreshed. Popup changes appear when the popup is reopened.

To use the included test fixture, serve the repository over HTTP from its root:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000/test.html](http://localhost:8000/test.html). Press `Ctrl+C` in the terminal when finished. Serving the fixture avoids Chrome's additional **Allow access to file URLs** setting.

## Debug extension errors

- Use **Errors** or the **service worker** link on `chrome://extensions` for background errors.
- Right-click the extension popup and choose **Inspect** for popup errors.
- Use the test page's DevTools console for content-script errors.

## Pre-submission check

Before preparing a Chrome Web Store upload:

1. Install the unpacked extension with the target form already open and filled with non-sensitive test data.
2. Save a checkpoint without refreshing the form tab.
3. Reopen or clear the form and restore the checkpoint.
4. Confirm the restored values and checked or selected states are correct.
5. Confirm that no real form answers, personal information, credentials, production snapshots, or other sensitive data are included in the repository or package.

Review [COMPATIBILITY.md](COMPATIBILITY.md) for the supported control matrix and [PRIVACY.md](PRIVACY.md) for the permission and data-handling model before release.

## Build the release package

Create a tested Chrome Web Store ZIP with:

```sh
npm run package
```

The archive is written to `dist/form-checkpoint-<version>.zip`. Its contents come from an explicit allowlist in `gulpfile.js`; tests, local planning files, dependencies, fixtures, and inherited FormVault runtime files are excluded. Inspect the archive before uploading:

```sh
unzip -l dist/form-checkpoint-0.9.0.zip
```

See [STORE-LISTING.md](STORE-LISTING.md) for draft listing copy and remaining dashboard assets.
