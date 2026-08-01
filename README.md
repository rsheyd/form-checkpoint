# Form Checkpoint

Form Checkpoint is a Chrome extension for saving the current state of a filled-in form and restoring it later.

The defining goal is explicit whole-form capture: after installing the extension, a user should be able to save values that are already present in an open tab—even if that tab was opened and filled out before the extension was installed—and later restore that checkpoint to the same form.

## Project status

Form Checkpoint 1.0 has been submitted to the Chrome Web Store for review. Its core explicit save-and-restore workflow is implemented; broader compatibility improvements remain under consideration.

Development setup and local testing instructions are in [DEVELOPMENT.md](DEVELOPMENT.md).

See [COMPATIBILITY.md](docs/COMPATIBILITY.md) for current form support and known limits, [PRIVACY.md](PRIVACY.md) for local data handling and permission rationale, and the [roadmap](docs/ROADMAP.md) for explicitly non-committed future ideas.

## Lineage and license

Form Checkpoint is an MIT-licensed fork of [FormVault](https://github.com/drewsb/FormVault), which provided the original template-saving, restoration, and template-management workflow. FormVault also included a legacy change-triggered autosave feature. Form Checkpoint currently focuses on explicit user-initiated snapshots and does not yet continuously autosave form entries; a modern, opt-in automatic recovery feature is planned on the [roadmap](docs/ROADMAP.md).

Generally useful compatibility and parser improvements are kept separate from Form Checkpoint-specific branding and product changes where practical, so they can be proposed upstream. See the [FormVault upstream pull-request plan](docs/UPSTREAM-PR-PLAN.md) for the conditional contribution sequence.

See [LICENSE](LICENSE) for license details.
