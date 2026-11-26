/**
 * Jeu de traduction (japonais ↔ français) : correction d'une traduction française libre et
 * assemblage d'une phrase japonaise à partir d'étiquettes. Fonctions pures.
 */
import type { RandomInt } from '../../shared/random';
import type { Phrase } from './phrases';
import { shuffle } from './quiz';

/* ---------- Japonais → français : traduction libre ---------- */

/** Mots trop courants pour peser dans la comparaison. */
const STOP_WORDS = new Set(
  (
    'le la les l un une des du de d a au aux et ou en ce c ca cela ceci est sont es suis etre ' +
    'il elle ils elles on je j tu vous nous me m te t se s y ne n pas plus que qu qui ' +
    'mon ma mes ton ta tes son sa ses votre vos notre nos leur leurs lui leur par pour avec ' +
    'dans sur tres bien hein oui'
  ).split(' '),
);

/** Ramène un mot à une forme simple : sans accents, sans marque du pluriel ni e final. */
function stem(word: string): string {
  return word.length > 3 ? word.replace(/(es|s|x|e)$/, '') : word;
}

function words(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean);
}

/** Mots porteurs de sens d'une phrase française. */
export function keywords(sentence: string): string[] {
  return words(sentence)
    .filter((w) => !STOP_WORDS.has(w))
    .map(stem);
}

/**
 * Part (0 à 1) des mots clés de la référence retrouvés dans la réponse. Une référence faite
 * uniquement de mots courants (« Qu'est-ce que c'est ? ») est comparée mot pour mot.
 */
export function overlap(answer: string, reference: string): number {
  const meaningful = keywords(reference).length > 0;
  const pick = meaningful ? keywords : (s: string) => words(s).map(stem);
  const expected = [...new Set(pick(reference))];
  if (!expected.length) {
    return 0;
  }
  const given = new Set(pick(answer));
  return expected.filter((w) => given.has(w)).length / expected.length;
}

export type FrenchVerdict = 'ok' | 'close' | 'wrong';

/** Compare une traduction libre à la traduction de référence et à ses variantes. */
export function checkFrench(answer: string, references: readonly string[]): FrenchVerdict {
  if (!answer.trim()) {
    return 'wrong';
  }
  const best = Math.max(...references.map((r) => overlap(answer, r)));
  return best >= 0.75 ? 'ok' : best >= 0.4 ? 'close' : 'wrong';
}

/* ---------- Français → japonais : assemblage d'étiquettes ---------- */

/** Particules rattachées au mot qui les précède pour former une étiquette (私は, 東京へ…). */
const PARTICLES = new Set([
  'は',
  'が',
  'を',
  'に',
  'へ',
  'で',
  'と',
  'も',
  'の',
  'か',
  'ね',
  'よ',
  'から',
  'まで',
  'より',
]);

/** Découpe la phrase en groupes « mot + particules », sans la ponctuation. */
export function chunks(phrase: Phrase): string[] {
  const out: string[] = [];
  for (const word of phrase.words) {
    if (word.punctuation) {
      continue;
    }
    if (PARTICLES.has(word.surface) && out.length) {
      out[out.length - 1] += word.surface;
    } else {
      out.push(word.surface);
    }
  }
  return out;
}

/** Étiquettes mélangées : celles de la phrase, plus `extra` intrus pris dans les autres phrases. */
export function tiles(
  phrase: Phrase,
  others: readonly Phrase[],
  extra: number,
  random: RandomInt,
): string[] {
  const own = chunks(phrase);
  const pool = [...new Set(others.filter((p) => p.id !== phrase.id).flatMap(chunks))].filter(
    (c) => !own.includes(c),
  );
  return shuffle([...own, ...shuffle(pool, random).slice(0, extra)], random);
}

export type AssemblyVerdict = 'exact' | 'order' | 'wrong';

/**
 * - `exact` : l'ordre de la phrase modèle ;
 * - `order` : les bons groupes, verbe final au bon endroit, mais un autre ordre (souvent possible
 *   en japonais, où l'ordre des compléments est libre) ;
 * - `wrong`.
 */
export function checkAssembly(answer: readonly string[], phrase: Phrase): AssemblyVerdict {
  const expected = chunks(phrase);
  if (answer.join('|') === expected.join('|')) {
    return 'exact';
  }
  const sorted = (list: readonly string[]) => [...list].sort().join('|');
  if (sorted(answer) === sorted(expected) && answer.at(-1) === expected.at(-1)) {
    return 'order';
  }
  return 'wrong';
}
