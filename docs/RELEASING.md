# Releasing Form Checkpoint

Use this checklist to publish an update to the existing Chrome Web Store item.

## Prepare the release

1. Choose the next [semantic version](https://semver.org/): patch for compatible fixes, minor for backward-compatible features, or major for incompatible changes.
2. Set the same version in `manifest.json`, `package.json`, and the two root-package version fields near the top of `package-lock.json`.
3. Update the README, compatibility notes, Store listing draft, and privacy disclosures only where behavior changed.
4. Test the unpacked extension in a clean Chrome profile. Exercise save, restore, Saved Forms, Copy All, and the behavior changed by this release using non-sensitive test data.

## Build and verify

Run:

```sh
npm run package
```

This runs the tests and lint checks before creating `dist/form-checkpoint-<version>.zip` from the allowlist in `gulpfile.js`.

Confirm that the archive has the intended version and contents:

```sh
unzip -p dist/form-checkpoint-<version>.zip manifest.json
unzip -l dist/form-checkpoint-<version>.zip
shasum -a 256 dist/form-checkpoint-<version>.zip
```

Do not release an archive containing personal information, real form answers, credentials, production snapshots, dependencies, tests, or local planning files.

## Submit the update

1. Open the existing Form Checkpoint item in the Chrome Web Store Developer Dashboard.
2. Under **Package**, upload `dist/form-checkpoint-<version>.zip` and confirm that the dashboard reports the intended version.
3. Edit **Store listing** only when its public copy or assets need to reflect the update. Existing fields carry forward; they do not need to be re-entered.
4. Review **Privacy** and **Distribution** for accuracy. Leave them unchanged when the release adds no permissions, data handling, regions, or visibility changes.
5. Save the draft, then click **Submit for review**.
6. Choose automatic publishing after approval, or defer publishing if the release must be staged. A deferred approved submission must be published within 30 days.

The previously published version remains available while the update is under review. See Google's [update instructions](https://developer.chrome.com/docs/webstore/update/) for the current dashboard workflow.

## After publication

1. Confirm that the Store listing and dashboard show the new version.
2. Install or update from the Store and repeat a short save, restore, and Copy All smoke test.
3. Record the published version and date in `PROJECT-STATUS.md`.
4. Commit the release changes and, if the project is using GitHub releases, create a matching `v<version>` tag and release notes.
