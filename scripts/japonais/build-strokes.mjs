// Génère un fichier de tracés (src/app/tools/japonais/data/<sortie>.ts) à partir des SVG de KanjiVG.
// Usage :
//   node scripts/japonais/build-strokes.mjs <dossier des SVG des kana> kana-strokes KANA_STROKES
//   node scripts/japonais/build-strokes.mjs <dossier des SVG des kanji N5> kanji-strokes KANJI_STROKES
// Les SVG se récupèrent sur https://github.com/KanjiVG/kanjivg (dossier kanji/, nommés par code
// Unicode sur 5 chiffres hexadécimaux, ex. 03042.svg).
// Données KanjiVG © Ulrich Apel, CC BY-SA 3.0 — https://kanjivg.tagaini.net
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, output, exportName] = process.argv.slice(2);
if (!dir || !output || !exportName) {
  throw new Error('Usage : build-strokes.mjs <dossier SVG> <fichier de sortie> <nom exporté>');
}

const strokes = {};
for (const file of readdirSync(dir)
  .filter((f) => /^[0-9a-f]{5}\.svg$/.test(f))
  .sort()) {
  const char = String.fromCodePoint(parseInt(file.slice(0, 5), 16));
  const svg = readFileSync(join(dir, file), 'utf8');
  // Les chemins apparaissent dans l'ordre des traits.
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  if (!paths.length) throw new Error(`Aucun tracé dans ${file}`);
  strokes[char] = paths;
}

const body = Object.entries(strokes)
  .map(([k, paths]) => `  '${k}': [\n${paths.map((p) => `    '${p}',`).join('\n')}\n  ],`)
  .join('\n');

writeFileSync(
  new URL(`../../src/app/tools/japonais/data/${output}.ts`, import.meta.url),
  `// Fichier généré par scripts/japonais/build-strokes.mjs : ne pas modifier à la main.
// Tracés issus de KanjiVG, © Ulrich Apel, sous licence CC BY-SA 3.0
// (https://kanjivg.tagaini.net). Repère : carré de 109 × 109, un chemin SVG par trait, dans l'ordre.

export const ${exportName}: Readonly<Record<string, readonly string[]>> = {
${body}
};
`,
);
console.log(`${Object.keys(strokes).length} caractères écrits dans ${output}.ts`);
