import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const files = [
  "src/data/stream-playlist-catalog.json",
  "src/data/businessPsychologyProgramDescriptions.ts",
  "src/data/businessModelProgramDescriptions.ts",
  "src/data/tradingScalpelProgramDescriptions.ts",
  "src/data/tradingStrategiesProgramDescriptions.ts",
  "src/data/tradingSetupsProgramDescriptions.ts",
  "src/data/tradingSecretsProgramDescriptions.ts",
  "src/data/tradingVaultPackProgramDescriptions.ts",
  "src/data/agenticAiVaultProgramDescriptions.ts",
  "src/data/aiContentVaultProgramDescriptions.ts",
  "src/lib/structuredDescription.ts",
  "../Backend/apps/video_streaming/data/business_psychology_program_descriptions.json",
  "../Backend/apps/video_streaming/data/business_model_program_descriptions.json",
  "src/components/programs/vaultModuleCopy.ts",
  "src/components/programs/vaultStructuredDescriptions.ts",
  "src/components/programs/tradingVaultCopy.ts",
  "src/components/affiliate/AffiliatePublicSection.tsx",
  "src/components/affiliate/AffiliateMarketingPage.tsx",
  "src/lib/ourMethodsCopy.ts",
  "src/components/programs/planOfferCatalog.ts",
];

const encodingRe = /[ùÆû]/g;
const typoPatterns = [
  [/Strcuture/gi, "Structure"],
  [/documentory/gi, "documentary"],
  [/philosphy/gi, "philosophy"],
  [/perhistoric/gi, "prehistoric"],
  [/stickan/gi, "stickman"],
  [/Setusp/gi, "Setups"],
  [/tunning/gi, "tuning"],
  [/canvics/gi, "canva (filename typo)"],
  [/imnages/gi, "images (folder typo)"],
  [/lessing/gi, "leasing"],
  [/luckùit/g, "luck—it"],
  [/businessùyou/g, "business—you"],
  [/trapùa/g, "trap—a"],
  [/investorùyou/g, "investor—you"],
  [/Pythonùthe/g, "Python—the"],
];

console.log("=== ENCODING ISSUES (ù Æ û — broken em-dash/apostrophe) ===\n");
for (const rel of files) {
  const f = path.join(root, rel);
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, "utf8");
  if (rel.includes("stream-playlist-catalog")) {
    const data = JSON.parse(text);
    for (const row of data) {
      const desc = row.description || "";
      const m = desc.match(encodingRe);
      if (m) {
        const samples = [];
        for (const ch of ["ù", "Æ", "û"]) {
          const idx = desc.indexOf(ch);
          if (idx >= 0) {
            samples.push(`…${desc.slice(Math.max(0, idx - 20), idx + 25).replace(/\n/g, " ")}…`);
          }
        }
        console.log(`[${row.id}] ${row.title}`);
        console.log(`  ${m.length} bad char(s); samples: ${samples.slice(0, 2).join(" | ")}`);
      }
    }
  } else if (text.match(encodingRe)) {
    console.log(`${path.basename(f)}: ${(text.match(encodingRe) || []).length} occurrence(s)`);
  }
}

console.log("\n=== LIKELY TYPOS (pattern scan in description/copy files) ===\n");
const seen = new Set();
for (const rel of files) {
  const f = path.join(root, rel);
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, "utf8");
  for (const [re, fix] of typoPatterns) {
    const m = text.match(re);
    if (m && !seen.has(`${rel}:${m[0]}`)) {
      seen.add(`${rel}:${m[0]}`);
      console.log(`${path.basename(f)}: "${m[0]}" → ${fix}`);
    }
  }
}

// Curated coverage
const curatedPsych = [
  "level1-psych-01", "level1-psych-02", "level1-psych-03", "level1-psych-04",
  "level1-psych-05", "level1-psych-06", "level1-psych-07", "level1-psych-08",
];
const curatedModel = ["level1-model-01", "level1-model-02", "level1-model-06", "level1-model-07"];

console.log("\n=== LIVE UI NOTE ===");
console.log("Curated copy overrides API/static for psychology slugs:", curatedPsych.join(", "));
console.log("Curated copy overrides for business model slugs:", curatedModel.join(", "));
console.log("Other programs still use API DB or stream-playlist-catalog.json (encoding issues may show until fixed).");
