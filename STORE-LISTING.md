# Chrome Web Store listing draft

This file contains draft submission copy and the remaining dashboard checklist. Keep the listing accurate as behavior changes.

## Product details

Name: **Form Checkpoint**

Category: **Productivity**

Single purpose:

> Save the current values of a web form in the browser and restore a saved version later.

Short description:

> Save a filled form locally and restore it later—even when the form was filled before installing the extension.

Detailed description:

> Form Checkpoint saves the values currently present in a web form so you can return to them later. Saving is explicit: the extension reads the active page only after you click Save Form.
>
> Features:
>
> - Save forms that were already filled before the extension was installed.
> - Keep multiple timestamped versions for the same form page.
> - Restore the latest version from the toolbar or choose an older version from Saved Forms.
> - Preserve repeated fields, checkboxes, radio buttons, textareas, and selected options.
> - Restore many controlled and conditional forms using native setters and browser events.
> - Keep saved form data in local Chrome extension storage.
>
> Password, file, and hidden inputs are deliberately excluded. Form Checkpoint is an actively maintained, MIT-licensed fork of FormVault; it is not an official FormVault release.

## Privacy dashboard draft

- Disclose form data and website content because both can be processed and stored locally.
- Disclose browsing activity to the extent that page URLs are stored as form identity metadata.
- State that data is used only for the user-facing save-and-restore feature.
- State that saved data is not sold, transferred to third parties, used for advertising, or used for credit decisions.
- Certify limited use only if the final build and public privacy policy remain consistent with those statements.
- Provide a publicly accessible HTTPS URL containing the substance of `PRIVACY.md`; a repository file alone is not the dashboard URL.

Published privacy-policy URL: `https://github.com/rsheyd/form-checkpoint/blob/main/PRIVACY.md`

## Required assets and dashboard work

- [x] Produce dedicated 16x16, 32x32, 48x48, and 128x128 PNG extension icons and declare them in `manifest.json`.
- [x] Produce accurate 1280x800 screenshots showing the popup and Saved Forms interface.
- [x] Produce the required 440x280 small promotional tile.
- [x] Produce a 1400x560 marquee image.
- [ ] Add homepage and support URLs.
- [x] Publish the privacy policy at a stable HTTPS URL.
- [ ] Enter the published privacy-policy URL in the dashboard.
- [ ] Complete privacy disclosures and limited-use certification.
- [ ] Confirm the developer account has 2-Step Verification enabled.
- [ ] Select distribution regions and visibility.
- [ ] Upload the ZIP created by `npm run package`. A clean-profile manual test was completed successfully on August 1, 2026.

## Accuracy checks

- Do not imply that Form Checkpoint is an official FormVault update or that existing FormVault installations upgrade automatically.
- Do not claim compatibility beyond `COMPATIBILITY.md`.
- Keep screenshots and descriptions synchronized with the submitted version.
- Do not include test data, saved production forms, credentials, source maps containing private paths, or development-only files in the ZIP.
