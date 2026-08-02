# Compatibility

Form Checkpoint explicitly captures the current state of a page when **Save Form** is clicked and restores a selected saved version later. It does not continuously monitor pages.

## Supported and tested

| Behavior | Status |
| --- | --- |
| Text-like inputs, textareas, and selects | Automated round-trip coverage |
| Checkboxes and radio buttons, including unchecked states | Automated round-trip coverage |
| Multiple selected options | Automated round-trip coverage |
| Repeated field names | Preserved as separate ordered records |
| Named and unnamed controls | Captured using multiple identity signals |
| Controls outside a `<form>` element | Supported |
| Fields whose DOM order changes | Stronger ID, name, label, and attribute signals take priority |
| Controlled inputs | Native setters plus bubbling `input` and `change` events are used |
| Synchronously revealed conditional fields | Restored in up to three bounded passes by default |
| Tabs opened and filled before extension installation | Manually verified without refreshing the tab |
| Query-string or URL-fragment changes | Manually verified; origin and pathname define page identity |
| Multiple saved versions | Supported with timestamps, latest-version restore, and explicit replacement |
| Restoring an older version from Saved Forms | Requests optional access only to the selected site |
| Copying a complete saved version | Copy All produces ordered, labeled plain text without accessing the original site |

Other ordinary non-sensitive HTML input types use the same native value path, but need broader manual Chrome coverage before they should be described individually as verified.

## Intentionally excluded

- Password inputs are never captured.
- File inputs are never captured; browsers do not permit safely restoring local file selections.
- Hidden inputs are not captured because they often contain application state or security tokens rather than user-authored answers.
- Submit, reset, image, and button inputs are not form-answer data and are not captured.
- Form Checkpoint never automatically restores a saved form from a different pathname or another page on the same domain.

## Not yet supported or verified

- `contenteditable` regions
- Open or closed shadow roots
- Controls inside iframes
- Custom widgets that do not expose standard form controls
- Fields rendered asynchronously after restore events
- Restoration that must navigate between separate pages or form steps
- Automatic matching across path-based record IDs such as `/applications/123/edit` and `/applications/456/edit`

When matching is incomplete or ambiguous, Form Checkpoint leaves those fields unchanged and reports the unresolved count rather than guessing.
