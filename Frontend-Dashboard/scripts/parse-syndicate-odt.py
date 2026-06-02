import re
import xml.etree.ElementTree as ET
from pathlib import Path

path = Path(r"c:\Users\PC\Downloads\syndicate-odt-extract\content.xml")
root = ET.parse(path).getroot()
TEXT = "{urn:oasis:names:tc:opendocument:xmlns:text:1.0}"
HEADING_STYLES = {"P2", "P4", "P5", "P13", "P19", "P26", "P27", "P32", "P39", "P42", "P45"}

def clean(t: str) -> str:
    t = re.sub(r"\s+", " ", "".join(t)).strip()
    t = (
        t.replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2014", "—")
        .replace("\u2013", "-")
        .replace("\ufffd", "'")
    )
    t = re.sub(r"([a-z])([A-Z])", r"\1 \2", t)
    t = re.sub(r"\s+", " ", t)
    return t

sections = []
current = None
for p in root.iter(TEXT + "p"):
    style = p.get("{urn:oasis:names:tc:opendocument:xmlns:text:1.0}style-name") or ""
    t = clean("".join(p.itertext()))
    if not t:
        continue
    is_heading = style in HEADING_STYLES or (
        t.isupper() and len(t) < 80 and not t.endswith(".") and len(t.split()) <= 12
    )
    if is_heading:
        if current:
            sections.append(current)
        current = {"title": t, "paras": []}
    elif current is not None:
        current["paras"].append(t)
    else:
        if not sections:
            sections.append({"title": "_preamble", "paras": []})
        sections[0]["paras"].append(t)
if current:
    sections.append(current)

out = Path(__file__).resolve().parents[1] / "src" / "data" / "syndicateWebsiteCopy.ts"
lines = ['/** Auto-derived from Syndicate Website Text NEW.odt — edit source doc then re-run scripts/parse-syndicate-odt.py */', ""]
lines.append("export type SyndicateCopySection = { title: string; paragraphs: string[] };")
lines.append("")
lines.append("export const SYNDICATE_WEBSITE_COPY: SyndicateCopySection[] = [")
for s in sections:
    title = s["title"].replace("\\", "\\\\").replace('"', '\\"')
    lines.append("  {")
    lines.append(f'    title: "{title}",')
    lines.append("    paragraphs: [")
    for para in s["paras"]:
        p = para.replace("\\", "\\\\").replace('"', '\\"')
        lines.append(f'      "{p}",')
    lines.append("    ],")
    lines.append("  },")
lines.append("];")
lines.append("")
out.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {out} with {len(sections)} sections")
