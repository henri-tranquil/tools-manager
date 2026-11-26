// Génère src/app/tools/japonais/data/kanji.ts (kanji des niveaux JLPT N5 et N4) à partir de
// kanjidic2 (jmdict-simplified, fichier « kanjidic2-all »).
// Usage : node scripts/japonais/build-kanji.mjs <kanjidic2-all-x.y.z.json>
// KANJIDIC2 © Electronic Dictionary Research and Development Group, CC BY-SA 4.0.
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) throw new Error('Fichier kanjidic2 manquant');
const { characters } = JSON.parse(readFileSync(file, 'utf8'));

// Ancien JLPT : niveau 4 ≈ N5, niveau 3 ≈ N4.
const LEVELS = { 4: 'N5', 3: 'N4' };
const uniq = (list) => [...new Set(list)];

const rows = characters
  .filter((c) => LEVELS[c.misc.jlptLevel])
  .sort((a, b) => (a.misc.frequency ?? 9999) - (b.misc.frequency ?? 9999))
  .map((c) => {
    const group = c.readingMeaning?.groups?.[0] ?? { readings: [], meanings: [] };
    const on = uniq(
      group.readings.filter((r) => r.type === 'ja_on').map((r) => r.value.replace(/-/g, '')),
    );
    const kun = uniq(
      group.readings.filter((r) => r.type === 'ja_kun').map((r) => r.value.replace(/-/g, '')),
    );
    const fr = group.meanings.filter((m) => m.lang === 'fr').map((m) => m.value);
    const en = group.meanings.filter((m) => m.lang === 'en').map((m) => m.value);
    return {
      k: c.literal,
      level: LEVELS[c.misc.jlptLevel],
      on: on.slice(0, 4),
      kun: kun.slice(0, 5),
      meanings: (fr.length ? fr : en).slice(0, 3),
      strokes: c.misc.strokeCounts[0],
    };
  });

const line = (r) =>
  `  { k: '${r.k}', level: '${r.level}', on: ${JSON.stringify(r.on)}, kun: ${JSON.stringify(r.kun)}, meanings: ${JSON.stringify(r.meanings)}, strokes: ${r.strokes} },`;

writeFileSync(
  new URL('../../src/app/tools/japonais/data/kanji.ts', import.meta.url),
  `// Fichier généré par scripts/japonais/build-kanji.mjs : ne pas modifier à la main.
// Source : KANJIDIC2, © Electronic Dictionary Research and Development Group (EDRDG),
// licence CC BY-SA 4.0 (https://www.edrdg.org/edrdg/licence.html), via jmdict-simplified.

export type KanjiLevel = 'N5' | 'N4';

export interface Kanji {
  readonly k: string;
  readonly level: KanjiLevel;
  /** Lectures on'yomi, en katakana. */
  readonly on: readonly string[];
  /** Lectures kun'yomi, en hiragana ; le point sépare la racine de l'okurigana (た.べる). */
  readonly kun: readonly string[];
  /** Sens en français (en anglais quand KANJIDIC2 n'en donne pas). */
  readonly meanings: readonly string[];
  readonly strokes: number;
}

export const KANJI: readonly Kanji[] = [
${rows.map(line).join('\n')}
];
`,
);
console.log(`${rows.length} kanji écrits`, rows.filter((r) => r.level === 'N5').length, 'N5');
