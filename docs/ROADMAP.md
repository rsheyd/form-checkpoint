# Form Checkpoint roadmap

This roadmap records possible future work, not promised features or release dates. Form Checkpoint is intentionally centered on explicit, user-initiated form checkpoints.

## Product direction: manual checkpoints

Form Checkpoint will not pursue automatic form autosave for now. Competing recovery extensions already focus on continuous background recording, while Form Checkpoint solves a different problem: deliberately saving the complete state of a form that is already filled in, including a form opened before the extension was installed.

Keeping capture manual has meaningful product advantages:

- The extension reads a page only after the user clicks **Save Form**.
- It does not require persistent access to every site or continuously monitor typing.
- A checkpoint is a deliberate whole-form version rather than an automatically generated stream of drafts.
- Saved versions remain under the user's control until they are explicitly replaced or deleted.
- The permission model, privacy explanation, and interface remain easier to understand.

Automatic recovery could protect work when a user forgets to save before a crash, refresh, expired session, or closed tab. That benefit is real, but implementing it responsibly would broaden site permissions and require separate work on retention, sensitive-field detection, storage limits, permission transitions, performance, and privacy disclosures. It would also place the product in direct competition with extensions built primarily around continuous recording.

For now, the better use of development effort is making deliberate checkpoints more complete, portable, and reliable. Autosave may be reconsidered only if sustained user feedback shows that manual saving is the main obstacle to adoption. It is not part of the current planned roadmap.

## Shipped: Copy All

The Saved Forms page provides a **Copy All** action for each saved checkpoint so users can recover their answers even when a page cannot be restored automatically.

The copied output should:

- Present the checkpoint as readable plain text.
- Use field labels when available, with stable fallbacks for unlabeled controls.
- Preserve the order in which controls appeared on the page.
- Represent checkboxes, radio buttons, and selected options clearly.
- Omit controls that were deliberately excluded from capture.
- Work from the saved snapshot without requiring access to the original site.
- Report clipboard failures clearly and avoid claiming that data was copied when it was not.

Copy All is a checkpoint-level fallback that preserves the central whole-form workflow.

## Next priority: editable and rich-text content

Extend capture, matching, restoration, and Copy All output to support user-authored content stored outside ordinary form controls.

### Native `contenteditable`

- Capture editable regions with their current user-visible content.
- Record suitable matching signals such as IDs, accessible labels, roles, editor attributes, and structural position.
- Exclude non-editable descendants and avoid recording duplicate nested editable regions.
- Restore through an editing-compatible path and dispatch the events expected by the page.
- Preserve plain text reliably before considering richer markup fidelity.
- Add fixtures for standalone, nested, dynamically rendered, and unlabeled editable regions.

### Common rich-text editors

Evaluate representative editors such as TinyMCE, CKEditor, Quill, and ProseMirror-based interfaces. Prefer standards-based `contenteditable` behavior that benefits multiple editors over editor-specific integrations.

Compatibility work should determine:

- Whether the authoritative value lives in an editable element, hidden backing control, iframe, or framework state.
- Which browser events are required for the editor to accept restored content.
- How to avoid duplicating content when both an editor surface and backing field are present.
- Whether restoration can preserve formatting safely; when it cannot, readable plain text remains the minimum recovery path.
- How unsupported editors are reported without applying content to an uncertain target.

Same-origin iframe support may be added where it is required by a common editor. Cross-origin frames remain constrained by browser security boundaries and should not be presented as universally supported.

## Later compatibility candidates

- Asynchronous restoration for fields rendered after delayed framework updates.
- Open shadow-DOM compatibility.
- Improved multi-step form handling without guessing across unrelated pages.
- Optional export and import after a separate security and privacy design review.

Upstream contributions are planned separately in [UPSTREAM-PR-PLAN.md](UPSTREAM-PR-PLAN.md). Do not imply that speculative Form Checkpoint roadmap features are proposed or endorsed upstream.
