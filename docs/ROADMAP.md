# Form Checkpoint roadmap

This roadmap records possible future work, not promised features or release dates. Form Checkpoint's current product remains explicit, user-initiated form snapshots.

## Future candidate: automatic recovery drafts

Automatic recovery would protect work before a crash, refresh, expired session, or accidentally closed tab. It should complement manual checkpoints rather than replace them.

The design should improve on FormVault's legacy change-triggered autosave stack by reusing Form Checkpoint's broader capture, safer matching, and event-aware restoration engine.

### User modes

Offer three clearly distinguishable modes:

1. **Manual only** — current behavior; the extension reads a page only after an explicit Save or Restore action.
2. **Autosave on selected sites** — persistent access and automatic recovery only for sites the user approves.
3. **Autosave on all sites** — broad automatic recovery after a separate, explicit opt-in and Chrome permission prompt.

Manual only remains the default. Global autosave should be presented as the most reliable crash-recovery option because selected-site mode cannot protect a site the user forgot to enable.

Users who enable all-sites mode should be able to exclude individual sites. Incognito remains disabled unless the user separately enables the extension there through Chrome.

### Permissions and disclosure

- Do not request persistent access to every site during installation.
- Request selected-site or all-sites optional host access only after the user chooses that mode.
- Register automatic listeners only for authorized sites.
- Explain before the permission prompt that crash recovery requires the extension to observe eligible form changes while pages are open.
- Update the Web Store privacy disclosures and public privacy policy before releasing autosave.
- Make the current autosave mode and site status visible in the popup.

Disabling autosave or removing site access must stop future recording. The product must clearly explain whether existing local drafts are retained or deleted and provide an explicit deletion control.

### Manual checkpoints versus recovery drafts

Keep the two record types separate in storage and UI:

- **Manual checkpoints** are explicitly named or timestamped saves. They remain until the user deletes them and are never silently expired by autosave cleanup.
- **Recovery drafts** are automatically captured working states. They are bounded, pruned, and intended for recent crash recovery.

The Saved Forms interface should label automatic drafts clearly and allow users to restore, copy, or delete them without confusing them with deliberate checkpoints.

### Recording behavior

- Listen to both `input` and `change` events so drafts are not delayed until a control loses focus.
- Debounce capture rather than storing a full snapshot after every keystroke.
- Avoid new versions when captured content has not meaningfully changed.
- Reuse normalized origin-and-path identity while continuing to ignore harmless query strings and fragments.
- Use the existing snapshot engine's repeated-name support and privacy exclusions.
- Never capture password, file, hidden, submit, reset, image, or button inputs.
- Investigate conservative detection and exclusion of payment-card and authentication fields that are implemented as ordinary text inputs.
- Do not transmit drafts to a server; keep recovery local unless a separately designed and disclosed sync feature is considered later.

### Retention and storage

Initial policy proposal, to validate before implementation:

- Retain automatic drafts for up to 30 days.
- Keep a bounded number of meaningful drafts per normalized form page.
- Enforce a global storage ceiling and expose storage usage to the user.
- Prune the oldest automatic drafts first.
- Never prune manual checkpoints as part of automatic-draft cleanup.

Exact time, count, and size limits should be selected from compatibility testing rather than treated as committed values now.

### Recovery behavior

- Offer the newest eligible recovery draft when a page is empty or substantially different, without silently overwriting current values.
- Allow users to browse older automatic drafts.
- Restore through the existing safe matcher, native setters, and bubbling events.
- Report unmatched or ambiguous fields and provide a readable copy fallback.
- Never automatically restore data into another pathname or unrelated form on the same domain.

### Implementation checkpoints

1. **Product and privacy specification** — finalize modes, permissions, retention, disclosure, and manual-versus-automatic terminology.
2. **Preference and permission layer** — implement manual, selected-site, and all-sites modes plus exclusions and permission removal.
3. **Recovery-draft storage** — add a separate bounded schema with deterministic pruning and migration tests.
4. **Debounced recorder** — register authorized listeners, capture meaningful changes, and cover existing/open tabs where Chrome permits.
5. **Recovery UI** — distinguish drafts from checkpoints and support safe restore, copy fallback, and deletion.
6. **Compatibility and release review** — test crashes, reloads, restarts, SPAs, dynamic forms, permission transitions, storage limits, and clean profiles; then update public disclosures before release.

Do not automatically proceed from one checkpoint to the next. Re-estimate implementation cost and review privacy implications at every boundary.

### Success criteria

- After opt-in, non-sensitive form work can be recovered following reload, tab closure, browser restart, or simulated crash without a prior manual save.
- Manual-only users retain the current least-privilege behavior.
- Selected-site and all-sites permissions accurately match the user's choice and can be revoked cleanly.
- Automatic recording does not produce unbounded storage growth or noticeable typing latency.
- Sensitive exclusions, retention, and deletion behavior are tested and explained in the UI and privacy policy.

## Other possible post-1.0 work

- `contenteditable` and common rich-text editor support.
- Copy All and per-field copy fallback for controls that cannot be restored safely.
- Asynchronous conditional-form restoration.
- Open shadow-DOM compatibility.
- Optional export/import after a separate security and privacy design review.

Upstream contributions are planned separately in [UPSTREAM-PR-PLAN.md](UPSTREAM-PR-PLAN.md). Do not imply that speculative Form Checkpoint roadmap features are proposed or endorsed upstream.
