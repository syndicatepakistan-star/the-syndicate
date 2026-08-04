from PIL import Image
from pathlib import Path

assets = Path(r"C:\Users\PC\.cursor\projects\d-subhan-nav\assets")
course = Path(r"d:\subhan\nav\Frontend-Dashboard\public\assets\programs\cources imnages")
offers = Path(r"d:\subhan\nav\Frontend-Dashboard\public\assets\programs\offers")

# (attachment key substring, dest path, max_width, jpeg_quality)
mapping = [
    ("13rules-7550a862", course / "13rules.jpg", 1100, 72),
    ("0_to_1M-3499a934", course / "0 to 1M.jpg", 1100, 72),
    ("9-5-72ac7ec9", course / "9-5.jpg", 1100, 72),
    ("consistency-8574d958", course / "consistency.jpg", 1100, 70),
    ("custom-app-blueprint-f1a66793", course / "custom-app-blueprint.png", 1100, 75),
    ("app-building-vibe-coding-2d166a45", course / "app-building-vibe-coding.png", 1100, 75),
    ("micro_business-a58b40ea", course / "micro business.jpg", 1100, 72),
    ("money-philosophy-ab49d8a6", course / "money-philosophy.jpg", 1100, 72),
    ("uncertainty-5f3b6bc7", course / "uncertainty.jpg", 1100, 70),
    ("trading-ec4e2da5", offers / "trading.jpg", 1100, 72),
    ("money-mastery-v2-adacc341", offers / "money-mastery-v2.jpg", 960, 68),
]

# Optional hustle if present
for p in assets.glob("*"):
    if p.is_file() and "hustle-" in p.name.lower() and "images_hustle" in p.name:
        mapping.append((p.name, course / "hustle.jpg", 1100, 72))
        break


def find_src(key: str):
    for p in assets.iterdir():
        if p.is_file() and key in p.name:
            return p
    return None


def save_jpeg(img: Image.Image, dest: Path, quality: int):
    rgb = img.convert("RGB")
    dest.parent.mkdir(parents=True, exist_ok=True)
    rgb.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)


for key, dest, max_w, quality in mapping:
    src = find_src(key)
    if src is None:
        print(f"MISSING {key}")
        continue
    img = Image.open(src)
    w, h = img.size
    if w > max_w:
        nh = int(h * max_w / w)
        img = img.resize((max_w, nh), Image.Resampling.LANCZOS)

    before = dest.stat().st_size if dest.exists() else 0

    # PNG destinations: write optimized JPEG twin + replace PNG with JPEG bytes
    # keeping the .png filename is wrong for browsers sniffing; convert path to .jpg
    # and print rename note for code updates.
    if dest.suffix.lower() == ".png":
        jpg_dest = dest.with_suffix(".jpg")
        save_jpeg(img, jpg_dest, quality)
        # Also overwrite png with jpeg content under .jpg only; leave old png deleted after refs update
        after = jpg_dest.stat().st_size
        print(
            f"PNG->JPG {dest.name} => {jpg_dest.name}: "
            f"{before/1024:.1f}KB -> {after/1024:.1f}KB (src {src.name[:60]})"
        )
        continue

    save_jpeg(img, dest, quality)
    after = dest.stat().st_size
    print(f"OK {dest.name}: {before/1024:.1f}KB -> {after/1024:.1f}KB (src {src.name[:60]})")

print("DONE")
