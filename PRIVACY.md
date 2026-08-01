# Privacy and permissions

Form Checkpoint is designed for explicit, local form recovery.

## Data handling

- Form values are read only after the user clicks **Save Form**.
- Saved versions remain in Chrome extension local storage on the current browser profile.
- Form Checkpoint does not transmit saved form values to a server.
- Password, file, and hidden inputs are excluded from capture.
- Saved versions remain until the user deletes them or chooses **Clear Saved Data**.
- Legacy FormVault templates may remain in Chrome sync storage until the user deletes them; the new snapshot engine does not restore or rewrite those legacy records.

Users should still avoid saving forms containing information they would not want retained in their browser profile.

## Permission rationale

- `activeTab` — grants temporary access to the page only after the user invokes the extension.
- `scripting` — injects the dependency-free capture or restore engine after a Save or Restore action.
- `storage` — stores saved form versions and settings in extension-owned browser storage.
- `unlimitedStorage` — allows users to retain multiple versions without silently deleting older form data when the ordinary local-storage quota is reached.
- `notifications` — confirms saves, restores, partial matches, and clearing saved data.

The Saved Forms page can open and restore an older version in a new tab. Because `activeTab` does not cover a newly created tab, that action asks for optional access to the selected site at click time. Form Checkpoint does not request access to every site during installation.

The extension does not request install-time host permissions and does not register an always-on content script. Chrome internal pages and other protected surfaces remain inaccessible.
