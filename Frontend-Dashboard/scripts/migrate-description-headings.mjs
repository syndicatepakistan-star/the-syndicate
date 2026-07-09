import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const TARGETS = [
  "src/data/businessPsychologyProgramDescriptions.ts",
  "src/data/businessModelProgramDescriptions.ts",
  "src/data/tradingScalpelProgramDescriptions.ts",
  "src/data/tradingStrategiesProgramDescriptions.ts",
  "src/data/tradingSetupsProgramDescriptions.ts",
  "src/data/tradingSecretsProgramDescriptions.ts",
  "src/data/tradingVaultPackProgramDescriptions.ts",
  "src/data/agenticAiVaultProgramDescriptions.ts",
  "src/data/stream-playlist-catalog.json",
];

function migrateDescriptionText(text) {
  if (!text || /Programme Introduction\s*\n/i.test(text)) {
    return text
      .replace(/\bThe Hook\b/g, "Programme Introduction")
      .replace(/\bThe Core Protocol\b/g, "Programme Description")
      .replace(/(?:^|\n)Introduction\s*\n/g, (m, offset, full) => {
        if (/Programme Introduction\s*\n/i.test(full)) return m;
        return m.replace("Introduction", "Programme Introduction");
      });
  }

  let out = text
    .replace(/\bThe Hook\b/g, "Programme Introduction")
    .replace(/\bThe Core Protocol\b/g, "Programme Description");

  const learnMatch = out.match(/(\n\s*What You Will Learn\s*\n[\s\S]*)$/i);
  if (!learnMatch) {
    return out.replace(/(?:^|\n)Introduction\s*\n/i, "\nProgramme Introduction\n");
  }

  const learnTail = learnMatch[1].replace(/^\n+/, "");
  const head = out.slice(0, learnMatch.index).trim();
  const introMatch = head.match(/^(?:Programme Introduction|Introduction)\s*\n([\s\S]*)$/i);
  if (!introMatch) return out;

  const body = introMatch[1].trim();
  const parts = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 2) {
    return `Programme Introduction\n${parts[0]}\n\nProgramme Description\n${parts.slice(1).join("\n\n")}\n\n${learnTail}`;
  }

  return `Programme Introduction\n${body}\n\n${learnTail}`;
}

function migrateTsFile(filePath) {
  let text = fs.readFileSync(filePath, "utf8");
  const original = text;

  text = text.replace(
    /Section headers: Introduction, What You Will Learn\./g,
    "Section headers: Programme Introduction, Programme Description, What You Will Learn.",
  );

  text = text.replace(/`([\s\S]*?)`/g, (full, inner) => {
    if (!/(?:^|\n)\s*(?:Introduction|The Hook|Programme Introduction)\s*\n/i.test(inner)) {
      return full;
    }
    if (!/What You Will Learn/i.test(inner) && !/The Core Protocol/i.test(inner) && !/Programme Description/i.test(inner)) {
      return full;
    }
    return "`" + migrateDescriptionText(inner) + "`";
  });

  if (text !== original) {
    fs.writeFileSync(filePath, text, "utf8");
    console.log(`updated ${path.relative(root, filePath)}`);
  }
}

function migrateJsonCatalog(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let changed = false;
  for (const row of data) {
    if (!row.description) continue;
    const next = migrateDescriptionText(row.description);
    if (next !== row.description) {
      row.description = next;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`updated ${path.relative(root, filePath)}`);
  }
}

for (const rel of TARGETS) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) {
    console.warn(`skip missing ${rel}`);
    continue;
  }
  if (rel.endsWith(".json")) migrateJsonCatalog(filePath);
  else migrateTsFile(filePath);
}

console.log("done");
