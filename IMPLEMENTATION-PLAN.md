# Form Checkpoint implementation plan

This plan divides the capture-and-restore rewrite into bounded phases. Complete, validate, and review one phase at a time; do not automatically continue into the next phase. Usage estimates are rough additional Codex quota ranges and should be revised after each phase.

The architectural rule throughout is to keep the snapshot engine dependency-free and independent of Form Checkpoint branding. Generic improvements should form focused commits suitable for submission to FormVault upstream. Product naming, UI redesign, store copy, and fork-only migration behavior belong in separate commits.

## Phase 0: Baseline and test seams

Estimated usage: **1–3%**

Status: **Complete (2026-08-01).** See `PROJECT-STATUS.md` for the confirmed baseline limitations.

- Record current Save Template and Restore Template behavior.
- Expand the non-sensitive fixture to cover ordinary inputs, repeated names, checked states, selects, textareas, fields outside forms, and a tab opened before extension installation.
- Add a lightweight automated test harness that does not require Chrome where practical.
- Document confirmed failures without changing production behavior.

Deliverable: characterization tests and a clear compatibility baseline.

Upstream candidate: fixture and regression-test commit.

## Phase 1: Dependency-free snapshot collector

Estimated usage: **2–3%**

Status: **Complete (2026-08-01).** The collector is intentionally not wired into popup or storage code yet.

- Introduce a standalone collector that reads current DOM state when invoked.
- Represent each control as a separate record so repeated names are preserved.
- Capture input type, value, checked state, selected options, IDs, names, labels, relevant attributes, and structural hints.
- Exclude passwords and other explicitly sensitive control types.
- Test collection independently of extension storage and popup code.

Deliverable: a tested snapshot data model and collector, not yet wired into the popup.

Upstream candidate: collector module and unit tests.

## Phase 2: Reliable matching and basic replay

Estimated usage: **2–3%**

Status: **Complete (2026-08-01).** Replay uses direct DOM property assignment; framework-aware setters and events remain Phase 3 work.

- Match saved records to current controls using multiple stable signals rather than name alone.
- Restore standard inputs, textareas, selects, radios, and checkboxes.
- Report matched, unmatched, and ambiguous records.
- Test duplicate names, changed DOM positions, and missing fields.

Deliverable: round-trip capture and replay for standard HTML controls.

Upstream candidate: matcher/replay module and tests.

## Phase 3: Framework-aware events and dynamic forms

Estimated usage: **3–5%**

Status: **Complete (2026-08-01).** Multi-pass restoration is synchronous and bounded; asynchronous and multi-step workflows remain later compatibility work.

- Apply values through native property setters where necessary.
- Dispatch bubbling `input` and `change` events so controlled forms react.
- Add bounded multi-pass restoration for fields revealed conditionally.
- Add fixtures for React-style controlled inputs and conditional sections.

Deliverable: compatibility with common modern form behavior.

Upstream candidate: event-aware restoration as its own focused PR. If this phase grows, split conditional multi-pass restoration into a separate phase before proceeding.

## Phase 4: On-demand injection into existing tabs

Estimated usage: **2–3%**

Status: **Complete (2026-08-01).** Manual Chrome verification confirmed capture from a filled tab that predated extension installation.

- Make Save and Restore inject their required code into the active tab when clicked.
- Remove reliance on content-script globals already being present.
- Verify the defining scenario: the tab is opened and filled before extension installation, then captured without refreshing.
- Handle restricted Chrome pages and injection failures with clear user feedback.

Deliverable: the core install-after-filling workflow works end to end.

Upstream candidate: on-demand injection and error-handling commit using FormVault's existing terminology.

## Phase 5: Storage identity and checkpoint integration

Estimated usage: **2–3%**

Status: **Complete (2026-08-01).** Checkpoints use versioned local storage keyed by normalized origin and pathname, with no automatic domain fallback.

- Store the versioned snapshot schema through extension storage.
- Normalize page identity so harmless fragments and query changes do not unnecessarily hide a checkpoint.
- Decide exact-URL versus domain fallback behavior and test it.
- Keep any legacy FormVault template reading isolated from the new engine.

Deliverable: durable save and later restore on the intended form.

Upstream candidate: versioned storage and URL-normalization commits, if they preserve upstream semantics.

## Phase 6: Form Checkpoint product integration

Estimated usage: **2–4%**

Status: **Complete (2026-08-01).** Product naming, metadata, notifications, popup actions, and checkpoint management now use the new versioned checkpoint model.

Post-phase versioning checkpoint: **Complete (2026-08-01).** Repeated saves can create new timestamped versions or explicitly replace the latest; restore defaults to the newest version; the management page groups all versions by form page; version-1 records migrate automatically.

- Rename the primary actions to Save Checkpoint and Restore Checkpoint.
- Update notifications, manifest metadata, package metadata, and remaining user-facing FormVault branding.
- Show useful save/restore results, including partial failures.
- Keep attribution and MIT-license information visible in repository and store-facing documentation.

Deliverable: a coherent Form Checkpoint development build.

Upstream candidate: none; keep this phase fork-specific.

## Phase 7: Compatibility expansion and release readiness

Estimated usage: **3–6%**, divided further if needed

Phase 7A status: **Complete (2026-08-01).** Removed inherited always-on content scripts, broad host access, and the sensitive `tabs` permission; replaced remote popup styling; documented privacy and the current compatibility matrix.

Phase 7B status: **Complete (2026-08-01).** Replaced the inherited broken ZIP task with a tested runtime allowlist, repaired lint coverage, removed an unused runtime dependency, and drafted the Web Store listing, privacy disclosures, and remaining asset checklist.

- Evaluate contenteditable controls, open shadow DOM, frames, file inputs, custom widgets, and multi-step forms individually.
- Add only capabilities that can be made safe and testable; document remaining limits.
- Test installation, save, restore, extension reload, and clean-profile behavior manually in Chrome.
- Review permissions, privacy disclosures, packaging contents, migration options, and Chrome Web Store copy.

Deliverable: a release candidate and an explicit compatibility matrix.

Upstream candidate: submit each generic compatibility improvement separately; keep release and branding work fork-specific.

## Commit and review discipline

- Prefer one focused commit per independently reviewable behavior.
- Do not mix fixture additions, engine behavior, storage changes, and branding unless inseparable.
- Preserve FormVault terminology in commits intended for upstream; apply Form Checkpoint terminology later in fork-specific commits.
- Run automated tests and the relevant manual Chrome scenario before marking a phase complete.
- Update `PROJECT-STATUS.md` after each phase with results, decisions, blockers, and the next proposed phase.
- Re-estimate quota before every phase and ask before proceeding whenever the reasonable upper bound exceeds 3%.
