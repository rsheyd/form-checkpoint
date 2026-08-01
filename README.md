# Form Checkpoint

Form Checkpoint is a Chrome extension for saving the current state of a filled-in form and restoring it later.

The defining goal is explicit whole-form capture: after installing the extension, a user should be able to save values that are already present in an open tab—even if that tab was opened and filled out before the extension was installed—and later restore that checkpoint to the same form.

## Project status

Form Checkpoint is under development and does not yet reliably provide the behavior described above. It currently retains much of FormVault's original interface and implementation while its capture and restore engine is being improved.

Development setup and local testing instructions are in [DEVELOPMENT.md](DEVELOPMENT.md).

## Lineage and license

Form Checkpoint is an MIT-licensed fork of [FormVault](https://github.com/drewsb/FormVault). FormVault provides the original template-saving, restoration, autosave, and template-management functionality on which this project is based.

Generally useful compatibility and parser improvements are kept separate from Form Checkpoint-specific branding and product changes where practical, so they can be proposed upstream.

See [LICENSE](LICENSE) for license details.
