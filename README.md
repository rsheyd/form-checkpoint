# Form Checkpoint

Form Checkpoint is a Chrome extension for saving the current state of a filled-in form and restoring it later.

The defining goal is explicit whole-form capture: after installing the extension, a user should be able to save values that are already present in an open tab—even if that tab was opened and filled out before the extension was installed—and later restore that checkpoint to the same form.

## Project status

Form Checkpoint is under active development. Its core explicit save-and-restore workflow is implemented; broader compatibility testing and Chrome Web Store release preparation remain.

Development setup and local testing instructions are in [DEVELOPMENT.md](DEVELOPMENT.md).

See [COMPATIBILITY.md](COMPATIBILITY.md) for current form support and known limits, and [PRIVACY.md](PRIVACY.md) for local data handling and permission rationale.

## Lineage and license

Form Checkpoint is an MIT-licensed fork of [FormVault](https://github.com/drewsb/FormVault). FormVault provides the original template-saving, restoration, autosave, and template-management functionality on which this project is based.

Generally useful compatibility and parser improvements are kept separate from Form Checkpoint-specific branding and product changes where practical, so they can be proposed upstream.

See [LICENSE](LICENSE) for license details.
