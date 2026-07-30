from PIL import Image
from pathlib import Path
import glob

assets = Path(r"C:\Users\PC\.cursor\projects\d-subhan-nav\assets")
dest = Path(r"d:\subhan\nav\Frontend-Dashboard\public\assets\programs\cources imnages")

mapping = [
    ("*eBook_Business_Blueprint*", "ebook-business-blueprint.jpg"),
    ("*Social_Media_Content_Automation*", "social-media-content-automation.jpg"),
    ("*AI_content_Automation_for_Businesses*", "ai-content-automation-for-businesses.jpg"),
]

MAX_EDGE = 1280
JPEG_QUALITY = 72

for pattern, out_name in mapping:
    matches = sorted(assets.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    if not matches:
        print(f"MISSING source for {out_name} ({pattern})")
        continue
    src = matches[0]
    img = Image.open(src).convert("RGB")
    w, h = img.size
    scale = min(1.0, MAX_EDGE / max(w, h))
    if scale < 1.0:
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    out = dest / out_name
    img.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    print(f"OK {src.name} -> {out_name} ({src.stat().st_size} -> {out.stat().st_size} bytes, {img.size})")
