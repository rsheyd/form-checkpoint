# Release artwork

Versioned Form Checkpoint release assets live here so artwork can be reviewed before replacing the inherited FormVault icon.

## Files

- `source/form-checkpoint-icon-v1.png` — transparent 1254×1254 master.
- `icons/icon-{16,32,48,128}.png` — Chrome extension icon sizes.
- `store/small-promo-440x280.png` — required Chrome Web Store small promotional tile.
- `store/marquee-1400x560.png` — optional Chrome Web Store marquee image.
- `store/screenshot-popup-1280x800.png` — popup feature screenshot made from the supplied live UI capture.
- `store/screenshot-saved-forms-1280x800.png` — version-management screenshot made from the supplied live UI capture.
- `build-release-art.py` — deterministic resizing and store-layout script.

## Generation notes

Mode: new image generation followed by deterministic local compositing.

The icon prompt requested a simple flat document/form symbol combined with a checkpoint badge, using deep navy, teal-blue, and a small amber accent. It excluded text, browser chrome, locks, safes, vault imagery, and fine detail. The generated master used a solid magenta background, which was removed locally to produce transparency.

Run `python3 artwork/build-release-art.py` after changing the transparent master to rebuild all derived sizes.

Store screenshots use current extension UI captures supplied after clean-profile testing. The interface pixels are preserved; the build script only scales and frames them with release copy.
