// Génère public/japonais/dico.json : mini-dictionnaire japonais → français (anglais à défaut)
// à partir de JMdict (jmdict-simplified, fichiers « jmdict-fre » et « jmdict-eng-common »).
// Usage : node scripts/japonais/build-dictionary.mjs <jmdict-fre.json> <jmdict-eng-common.json>
// JMdict © Electronic Dictionary Research and Development Group, CC BY-SA 4.0.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [frFile, enFile] = process.argv.slice(2);
if (!frFile || !enFile) throw new Error('Fichiers JMdict manquants');
const fr = JSON.parse(readFileSync(frFile, 'utf8')).words;
const en = JSON.parse(readFileSync(enFile, 'utf8')).words;

const isCommon = (w) => [...w.kanji, ...w.kana].some((f) => f.common);

function gloss(word) {
  return word.sense
    .slice(0, 3)
    .map((s) =>
      s.gloss
        .slice(0, 3)
        .map((g) => g.text)
        .join(', '),
    )
    .filter(Boolean)
    .join(' ; ')
    .slice(0, 120);
}

const byId = new Map();
for (const w of en) byId.set(w.id, { word: w, lang: 'en' });
for (const w of fr) byId.set(w.id, { word: w, lang: 'fr' }); // le français remplace l'anglais

// Ordre = priorité à la recherche : courants d'abord, puis français avant anglais.
const entries = [...byId.values()]
  .map(({ word, lang }) => ({
    kanji: word.kanji.map((k) => k.text),
    kana: word.kana.map((k) => k.text),
    gloss: gloss(word),
    lang,
    common: isCommon(word),
  }))
  .filter((e) => e.gloss)
  .sort(
    (a, b) =>
      Number(b.common) - Number(a.common) ||
      (a.lang === 'fr' ? -1 : 1) - (b.lang === 'fr' ? -1 : 1),
  );

// Format compact : [kanji séparés par « | », kana séparés par « | », sens, 1 si anglais].
const out = {
  source: 'JMdict © EDRDG, CC BY-SA 4.0 — https://www.edrdg.org/jmdict/j_jmdict.html',
  entries: entries.map((e) => [
    e.kanji.join('|'),
    e.kana.join('|'),
    e.gloss,
    e.lang === 'en' ? 1 : 0,
  ]),
};
mkdirSync(new URL('../../public/japonais/', import.meta.url), { recursive: true });
writeFileSync(new URL('../../public/japonais/dico.json', import.meta.url), JSON.stringify(out));
console.log(
  `${entries.length} entrées, dont ${entries.filter((e) => e.lang === 'fr').length} en français`,
);
