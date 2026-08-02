# FormVault upstream pull-request plan

This is a conditional contribution plan for the original [FormVault](https://github.com/drewsb/FormVault) repository. Do not invest in later PRs until the maintainer reviews and accepts—or otherwise meaningfully engages with—the preceding work.

The goal is to contribute generally useful compatibility improvements without asking upstream to adopt Form Checkpoint's product identity, release strategy, or storage model.

## Contribution rules

- Base every branch directly on the latest `drewsb/FormVault` default branch.
- Preserve FormVault terminology and UI unless a change is essential to the PR.
- Keep each PR independently testable and useful.
- Add tests for the behavior changed by that PR.
- Avoid Form Checkpoint branding, icons, screenshots, store copy, and privacy positioning.
- Avoid schema-v2 checkpoint history, fork migration, and other product-specific storage behavior.
- Do not stack several unpublished PRs. Wait for review before preparing the next one.

## PR 1: Characterization tests and compatibility fixture

Status: **Open as draft [FormVault PR #12](https://github.com/drewsb/FormVault/pull/12).**

Scope:

- Add dependency-free tests for the inherited parser.
- Record repeated-name and `serializeArray()` limitations.
- Expand `test.html` with non-sensitive standard and edge-case controls.
- Add a generic `npm test` command and local-development instructions.

Gate: proceed only if the maintainer reviews and approves this direction.

## PR 2: Dependency-free form snapshot collector

Scope:

- Add a standalone collector for inputs, textareas, and selects inside and outside forms.
- Preserve repeated names as ordered records rather than collapsing them.
- Record values, checked states, selected options, control type, identifiers, labels, and structural position.
- Exclude password, file, hidden, submit, reset, image, and button inputs.
- Add collection and privacy-exclusion tests.

Keep out:

- Restoration behavior.
- Chrome APIs, popup wiring, storage, URL identity, and product UI.

Why separate: capture is useful and reviewable without committing upstream to a complete application rewrite.

## PR 3: Safe matching and standard-control replay

Scope:

- Match records using compatible tag/type plus weighted ID, name, label, option value, and structural signals.
- Reserve each target element for one record.
- Restore text values, checkbox/radio states, and selected options.
- Report missing or ambiguous fields rather than guessing.
- Add round-trip, moved-control, missing-field, and ambiguity tests.

Keep out:

- Framework-aware native setters and events.
- Conditional multi-pass restoration.
- Popup and storage integration.

Review option: if the maintainer considers PRs 2 and 3 too granular, combine them into one capture-and-basic-replay PR while retaining separate commits.

## PR 4: Framework-aware restoration events

Scope:

- Restore values through native prototype setters.
- Dispatch bubbling `input` and `change` events after successful changes.
- Add tests demonstrating controlled-input compatibility.

Optional follow-up, only if requested: bounded multi-pass restoration for synchronously revealed conditional controls. Keep that in a separate commit or PR if it materially increases review size.

## PR 5: On-demand engine injection

Scope:

- Inject the self-contained capture/restore engine immediately before explicit popup actions.
- Support tabs opened before extension installation without requiring refresh.
- Report protected-page and injection failures clearly.
- Add tests for injection order, argument passing, and error handling.

Keep out:

- Form Checkpoint wording and redesigned popup styling.
- Versioned checkpoint storage and management UI.

## Possible later PRs

Prepare these only if the maintainer remains responsive and asks for more:

- URL normalization that ignores query strings and fragments while preserving pathname isolation.
- Least-privilege Manifest V3 permissions and removal of always-on content scripts.
- Removal of remote popup CSS and other Web Store compliance fixes.
- Tested allowlist-based release packaging and lint coverage.

These are lower priority because they touch policy, permissions, or release workflow rather than the core parser limitation.

## Explicitly fork-only

Do not propose these upstream unless the maintainer specifically requests them:

- Form Checkpoint naming, icons, descriptions, and store artwork.
- Multiple timestamped checkpoint versions and replacement prompts.
- Form Checkpoint schema migrations or legacy-template separation UI.
- Chrome Web Store listing, privacy-policy text, competitive positioning, or launch plans.
- Continuous autosave, encryption locks, retention policies, and other Form Checkpoint product ideas outside the current roadmap.

## Stop conditions

Pause upstream extraction if PR #12 receives no meaningful response after a reasonable waiting period, is rejected because the maintainer does not want this direction, or reveals that upstream prefers a substantially different architecture. The fork can continue independently without keeping its internal history shaped around unreviewed PRs.
