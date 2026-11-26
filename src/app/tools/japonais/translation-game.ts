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

/**
 * Familles de mots équivalents pour la correction : chaque forme est ramenée à la première.
 * Les formes sont déjà simplifiées par `stem`.
 */
const SYNONYMS: readonly (readonly string[])[] = [
  ['etudi', 'apprend', 'appren'],
  ['aim', 'ador'],
  ['bon', 'delicieu', 'excellent'],
  ['content', 'heureu'],
  ['magasin', 'boutiqu'],
  ['voitur', 'auto'],
  ['rapidement', 'vite'],
  ['lentement', 'doucement'],
  ['beaucoup', 'enormement'],
  ['salut', 'bonjour'],
  ['merci', 'remerci'],
  ['pardon', 'desol', 'excus'],
];

const CANONICAL: ReadonlyMap<string, string> = new Map(
  SYNONYMS.flatMap((family) => family.map((w) => [w, family[0]] as const)),
);

/**
 * Ramène un mot à une forme simple : sans accents, sans terminaison verbale courante
 * (mange, mangé, manger, mangez donnent « mang »), sans marque du pluriel ni e final.
 */
function stem(word: string): string {
  const verb = word.length > 5 ? word.replace(/(ons|ez|er)$/, '') : word;
  const simple = verb.length > 3 ? verb.replace(/(es|s|x|e)$/, '') : verb;
  return CANONICAL.get(simple) ?? simple;
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
 * La phrase est-elle négative ? « n'est-ce pas » (question de confirmation) ne compte pas.
 * En japonais, la négation (〜ない, 〜ません) change tout le sens : la correction en tient compte.
 */
export function isNegative(sentence: string): boolean {
  const text = ` ${words(sentence).join(' ')} `.replace(/ n est ce pas /g, ' ');
  return / (pas|jamais|rien|aucun|aucune|personne) /.test(text) || / (ne|n) .*plus /.test(text);
}

/**
 * Part (0 à 1) des mots clés de la référence retrouvés dans la réponse. Une référence faite
 * uniquement de mots courants (« Qu'est-ce que c'est ? ») est comparée mot pour mot.
 */
export function overlap(answer: string, reference: string): number {
  return compare(answer, reference).score;
}

interface Comparison {
  readonly score: number;
  /** Mots de la référence (tels qu'écrits) retrouvés ou absents dans la réponse. */
  readonly found: readonly string[];
  readonly missing: readonly string[];
}

function compare(answer: string, reference: string): Comparison {
  const meaningful = keywords(reference).length > 0;
  const refWords = words(reference).filter((w) => !meaningful || !STOP_WORDS.has(w));
  const byStem = new Map<string, string>();
  for (const w of refWords) {
    if (!byStem.has(stem(w))) {
      byStem.set(stem(w), w);
    }
  }
  if (!byStem.size) {
    return { score: 0, found: [], missing: [] };
  }
  const given = new Set(words(answer).map(stem));
  const found: string[] = [];
  const missing: string[] = [];
  for (const [s, w] of byStem) {
    (given.has(s) ? found : missing).push(w);
  }
  return { score: found.length / byStem.size, found, missing };
}

export type FrenchVerdict = 'ok' | 'close' | 'wrong';

export interface FrenchCheck {
  readonly verdict: FrenchVerdict;
  /** Mots importants de la traduction la plus proche, retrouvés ou manquants. */
  readonly found: readonly string[];
  readonly missing: readonly string[];
  /** La réponse est négative et pas l'original (`added`), ou l'inverse (`missing`). */
  readonly negation: 'added' | 'missing' | null;
}

const verdictOf = (score: number): FrenchVerdict =>
  score >= 0.75 ? 'ok' : score >= 0.4 ? 'close' : 'wrong';

/**
 * Corrige une traduction libre : compare aux références de même polarité (affirmative ou
 * négative). Une réponse qui retrouve les mots mais inverse la négation est fausse.
 */
export function analyzeFrench(answer: string, references: readonly string[]): FrenchCheck {
  if (!answer.trim() || !references.length) {
    return { verdict: 'wrong', found: [], missing: [], negation: null };
  }
  const negative = isNegative(answer);
  const ranked = references
    .map((r) => ({ ...compare(answer, r), sameSign: isNegative(r) === negative }))
    .sort((a, b) => b.score - a.score);
  const best = ranked.find((r) => r.sameSign);
  const any = ranked[0];
  if (!best || (verdictOf(best.score) !== 'ok' && verdictOf(any.score) === 'ok' && !any.sameSign)) {
    return {
      verdict: 'wrong',
      found: any.found,
      missing: any.missing,
      negation: negative ? 'added' : 'missing',
    };
  }
  return {
    verdict: verdictOf(best.score),
    found: best.found,
    missing: best.missing,
    negation: null,
  };
}

/** Compare une traduction libre à la traduction de référence et à ses variantes. */
export function checkFrench(answer: string, references: readonly string[]): FrenchVerdict {
  return analyzeFrench(answer, references).verdict;
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
