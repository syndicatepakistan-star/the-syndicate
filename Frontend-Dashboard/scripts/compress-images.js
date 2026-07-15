/**
 * Batch-compress oversized source images in place (same filename + format).
 *
 * High-quality settings only: JPEG mozjpeg q85 progressive, PNG max compression,
 * resize to a 1920px cap (cards render at <=828px via the Next optimizer, so this
 * keeps >2x retina headroom). A file is only replaced when the re-encode saves
 * at least 15% AND 50 KB — otherwise the original is kept untouched.
 *
 * Usage: node scripts/compress-images.js [rootDir] [--dry]
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Windows: libvips caches input file handles, which blocks overwriting the
// same file we just read. Disable caching so in-place writes succeed.
sharp.cache(false);

const args = process.argv.slice(2).filter((a) => a !== "--dry");
const ROOT = args[0] || path.join(__dirname, "..", "public", "assets", "programs");
const DRY_RUN = process.argv.includes("--dry");

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 85;
const MIN_SAVINGS_RATIO = 0.15;
const MIN_SAVINGS_BYTES = 50 * 1024;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

async function compressOne(file) {
  const ext = path.extname(file).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) return null;

  const input = fs.readFileSync(file);
  const before = input.length;
  const meta = await sharp(input, { failOn: "none" }).metadata();
  if (!meta.width || !meta.height) return null;

  const needsResize = meta.width > MAX_DIMENSION || meta.height > MAX_DIMENSION;
  let pipeline = sharp(input, { failOn: "none" });
  if (needsResize) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (ext === ".png") {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true });
  }

  const buffer = await pipeline.toBuffer();
  const after = buffer.length;
  const saved = before - after;

  if (saved < MIN_SAVINGS_BYTES || saved / before < MIN_SAVINGS_RATIO) {
    return { file, before, after: before, skipped: true };
  }

  if (!DRY_RUN) {
    fs.writeFileSync(file, buffer);
  }
  return { file, before, after, skipped: false, resized: needsResize, dims: `${meta.width}x${meta.height}` };
}

(async () => {
  const files = walk(ROOT);
  let totalBefore = 0;
  let totalAfter = 0;
  let changed = 0;
  let skipped = 0;
  const rows = [];

  for (const file of files) {
    try {
      const result = await compressOne(file);
      if (!result) continue;
      totalBefore += result.before;
      totalAfter += result.after;
      if (result.skipped) {
        skipped++;
      } else {
        changed++;
        rows.push(result);
      }
    } catch (err) {
      console.error(`ERROR ${file}: ${err.message}`);
    }
  }

  rows.sort((a, b) => b.before - b.after - (a.before - a.after));
  for (const r of rows.slice(0, 40)) {
    const mb = (n) => (n / 1024 / 1024).toFixed(2);
    console.log(
      `${mb(r.before)}MB -> ${mb(r.after)}MB${r.resized ? ` (resized from ${r.dims})` : ""}  ${path.relative(ROOT, r.file)}`
    );
  }
  if (rows.length > 40) console.log(`... and ${rows.length - 40} more files`);

  const mb = (n) => (n / 1024 / 1024).toFixed(1);
  console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Compressed ${changed} files, kept ${skipped} as-is.`);
  console.log(`Total: ${mb(totalBefore)} MB -> ${mb(totalAfter)} MB (saved ${mb(totalBefore - totalAfter)} MB)`);
})();
