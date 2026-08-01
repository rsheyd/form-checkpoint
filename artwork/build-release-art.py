#!/usr/bin/env python3
"""Build deterministic release artwork from the transparent icon master."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
MASTER = ROOT / "source" / "form-checkpoint-icon-v1.png"
POPUP_SCREENSHOT = ROOT / "source" / "popup-screenshot.png"
SAVED_FORMS_SCREENSHOT = ROOT / "source" / "saved-forms-screenshot.png"
ICONS = ROOT / "icons"
STORE = ROOT / "store"

NAVY = "#12304A"
BLUE = "#168BCB"
PALE = "#F2F8FC"
WHITE = "#FFFFFF"
AMBER = "#F5B43B"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "HelveticaNeue.ttc" if not bold else "HelveticaNeue.ttc"
    path = Path("/System/Library/Fonts") / name
    return ImageFont.truetype(str(path), size=size, index=1 if bold else 0)


def fitted_master() -> Image.Image:
    image = Image.open(MASTER).convert("RGBA")
    alpha = image.getchannel("A")
    # Ignore a handful of nearly transparent chroma-removal edge pixels when
    # finding the visual bounds; otherwise the icon is needlessly undersized.
    bbox = alpha.point(lambda value: 255 if value >= 128 else 0).getbbox()
    if not bbox:
        raise RuntimeError("Icon master has no visible pixels")
    return image.crop(bbox)


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    result = Image.new("RGBA", size, (0, 0, 0, 0))
    scaled = image.copy()
    scaled.thumbnail(size, Image.Resampling.LANCZOS)
    result.alpha_composite(scaled, ((size[0] - scaled.width) // 2, (size[1] - scaled.height) // 2))
    return result


def make_icons(master: Image.Image) -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        padding = max(1, round(size * 0.06))
        icon = contain(master, (size - padding * 2, size - padding * 2))
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        canvas.alpha_composite(icon, (padding, padding))
        canvas.save(ICONS / f"icon-{size}.png", optimize=True)


def rounded_panel(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=WHITE)


def make_tile(master: Image.Image) -> None:
    canvas = Image.new("RGB", (440, 280), PALE)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((0, 0, 439, 279), radius=0, fill=PALE)
    draw.ellipse((310, -72, 520, 138), fill="#D9EDF8")
    draw.ellipse((-76, 198, 92, 366), fill="#DDEFF7")
    rounded_panel(draw, (28, 26, 156, 154), 30)
    icon = contain(master, (112, 112))
    canvas.paste(icon, (36, 34), icon)
    draw.text((184, 52), "Form", font=font(38, True), fill=NAVY)
    draw.text((184, 91), "Checkpoint", font=font(38, True), fill=NAVY)
    draw.rounded_rectangle((184, 144, 318, 150), radius=3, fill=AMBER)
    draw.text((30, 196), "Save a form. Restore it later.", font=font(21), fill=NAVY)
    draw.text((30, 230), "Private, local, and on demand.", font=font(15), fill=BLUE)
    canvas.save(STORE / "small-promo-440x280.png", optimize=True)


def make_marquee(master: Image.Image) -> None:
    canvas = Image.new("RGB", (1400, 560), PALE)
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((1060, -250, 1580, 270), fill="#D9EDF8")
    draw.ellipse((-230, 360, 220, 810), fill="#DDEFF7")
    rounded_panel(draw, (110, 90, 470, 450), 72)
    icon = contain(master, (314, 314))
    canvas.paste(icon, (133, 113), icon)
    draw.text((565, 126), "Form Checkpoint", font=font(74, True), fill=NAVY)
    draw.rounded_rectangle((568, 228, 872, 240), radius=6, fill=AMBER)
    draw.text((568, 284), "Save a form.", font=font(42), fill=NAVY)
    draw.text((568, 340), "Restore it later.", font=font(42), fill=NAVY)
    draw.text((568, 416), "Private, local, and on demand.", font=font(26), fill=BLUE)
    canvas.save(STORE / "marquee-1400x560.png", optimize=True)


def paste_contained(canvas: Image.Image, source: Image.Image, box: tuple[int, int, int, int]) -> None:
    width = box[2] - box[0]
    height = box[3] - box[1]
    scaled = source.copy()
    scaled.thumbnail((width, height), Image.Resampling.LANCZOS)
    x = box[0] + (width - scaled.width) // 2
    y = box[1] + (height - scaled.height) // 2
    canvas.paste(scaled, (x, y), scaled if scaled.mode == "RGBA" else None)


def make_store_screenshots(master: Image.Image) -> None:
    popup = Image.open(POPUP_SCREENSHOT).convert("RGBA")
    saved_forms = Image.open(SAVED_FORMS_SCREENSHOT).convert("RGBA")

    # The supplied capture predates approval of the new mark. Replace only the
    # inherited vault glyphs so the screenshot matches the packaged build.
    popup_draw_source = ImageDraw.Draw(popup)
    popup_draw_source.rectangle((240, 224, 410, 382), fill=WHITE)
    popup_icon = contain(master, (128, 128))
    popup.alpha_composite(popup_icon, (282, 241))
    toolbar_fill = popup.getpixel((541, 80))
    popup_draw_source.ellipse((548, 63, 588, 103), fill=toolbar_fill)
    toolbar_icon = contain(master, (32, 32))
    popup.alpha_composite(toolbar_icon, (552, 67))

    popup_canvas = Image.new("RGB", (1280, 800), PALE)
    popup_draw = ImageDraw.Draw(popup_canvas)
    popup_draw.ellipse((-170, 590, 160, 920), fill="#DDEFF7")
    popup_draw.ellipse((1090, -170, 1420, 160), fill="#D9EDF8")
    popup_draw.text((74, 174), "Save what’s", font=font(54, True), fill=NAVY)
    popup_draw.text((74, 235), "already filled.", font=font(54, True), fill=NAVY)
    popup_draw.rounded_rectangle((76, 322, 358, 332), radius=5, fill=AMBER)
    popup_draw.text((76, 379), "Explicit snapshots.", font=font(27), fill=NAVY)
    popup_draw.text((76, 425), "Restore when needed.", font=font(27), fill=NAVY)
    popup_draw.text((76, 492), "Private and stored locally.", font=font(20), fill=BLUE)
    popup_draw.rounded_rectangle((640, 38, 1212, 762), radius=24, fill=WHITE, outline="#C9D8E2", width=2)
    paste_contained(popup_canvas, popup, (660, 58, 1192, 742))
    popup_canvas.save(STORE / "screenshot-popup-1280x800.png", optimize=True)

    manager_canvas = Image.new("RGB", (1280, 800), PALE)
    manager_draw = ImageDraw.Draw(manager_canvas)
    icon = contain(master, (72, 72))
    manager_canvas.paste(icon, (72, 48), icon)
    manager_draw.text((164, 55), "Keep multiple saved versions", font=font(43, True), fill=NAVY)
    manager_draw.text((166, 111), "Choose exactly which form checkpoint to restore.", font=font(22), fill=BLUE)
    manager_draw.rounded_rectangle((48, 188, 1232, 630), radius=22, fill=WHITE, outline="#C9D8E2", width=2)
    paste_contained(manager_canvas, saved_forms, (70, 210, 1210, 608))
    manager_draw.text((48, 686), "Actual Form Checkpoint interface", font=font(18), fill="#5B7182")
    manager_canvas.save(STORE / "screenshot-saved-forms-1280x800.png", optimize=True)


def main() -> None:
    STORE.mkdir(parents=True, exist_ok=True)
    master = fitted_master()
    make_icons(master)
    make_tile(master)
    make_marquee(master)
    make_store_screenshots(master)


if __name__ == "__main__":
    main()
