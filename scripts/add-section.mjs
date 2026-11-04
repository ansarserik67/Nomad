// Inserts a translation section in src/lib/i18n/dictionaries.ts for all three locales.
// Usage: node scripts/add-section.mjs <sectionName> <path-to-json>
// JSON shape: { "en": {...}, "ru": {...}, "kk": {...} }
import fs from "node:fs";

const [name, jsonPath] = process.argv.slice(2);
if (!name || !jsonPath) {
  console.error("usage: node scripts/add-section.mjs <section> <file.json>");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const dictPath = "src/lib/i18n/dictionaries.ts";
let source = fs.readFileSync(dictPath, "utf8");

const locales = [
  { key: "en", start: "const en = {", end: "\n} as const;\n" },
  { key: "ru", start: "const ru: Dictionary = {", end: "\n};\n\nconst kkMessages" },
  { key: "kk", start: "const kk: Dictionary = {", end: "\n};\n\nexport const DICTIONARIES" },
];

function render(value) {
  const json = JSON.stringify(value, null, 2);
  const lines = json.split("\n");
  const indented = [lines[0], ...lines.slice(1).map((line) => `  ${line}`)].join("\n");
  return `\n  ${name}: ${indented},`;
}

for (const locale of locales) {
  const value = data[locale.key];
  if (!value) {
    console.error(`missing locale ${locale.key}`);
    process.exit(1);
  }

  const objectStart = source.indexOf(locale.start);
  const end = source.indexOf(locale.end, objectStart);
  if (objectStart < 0 || end < 0) {
    console.error(`markers not found for ${locale.key}`);
    process.exit(1);
  }

  if (source.slice(objectStart, end).includes(`\n  ${name}: {`)) {
    console.error(`section "${name}" already exists in ${locale.key}`);
    process.exit(1);
  }

  source = source.slice(0, end) + render(value) + source.slice(end);
}

fs.writeFileSync(dictPath, source);
console.log(`section "${name}" written`);
