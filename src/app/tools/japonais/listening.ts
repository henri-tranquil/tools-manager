/** Compréhension orale : préparation des pistes à lire et des propositions. Fonctions pures. */
import type { RandomInt } from '../../shared/random';
import type { Dialogue, Reply } from './data/listening';
import { VOCAB } from './data/vocab';
import type { Line } from './japanese';
import { kanaEntries, soundKey, toKatakana } from './kana';
import { shuffle } from './quiz';

/** Chiffres annoncés avant chaque proposition, comme au JLPT. */
export const CHOICE_NUMBERS = ['いち', 'に', 'さん', 'よん'];

export interface Question {
  /** Propositions mélangées. */
  readonly options: readonly string[];
  /** Index de la bonne proposition dans `options`. */
  readonly answer: number;
}

/** Mélange les propositions (la bonne est la première des données). */
export function shuffleChoices(choices: readonly string[], random: RandomInt): Question {
  const options = shuffle(choices, random);
  return { options, answer: options.indexOf(choices[0]) };
}

export function dialogueLines(dialogue: Dialogue): Line[] {
  return dialogue.lines.map((l) => ({ text: l.ja, speaker: l.s }));
}

/** La réplique, puis chaque réponse précédée de son numéro (いち、…), lue par l'autre voix. */
export function replyLines(reply: Reply, options: readonly string[]): Line[] {
  return [
    { text: reply.prompt, speaker: 1 },
    ...options.map((o, i): Line => ({ text: `${CHOICE_NUMBERS[i]}。${o}`, speaker: 0 })),
  ];
}

/* ---------- Son → caractère ---------- */

export type SoundTarget = 'kana' | 'kanji';

export interface SoundQuestion {
  readonly key: string;
  /** Ce que lit la voix (toujours en kana : la synthèse ne se trompe pas de lecture). */
  readonly spoken: string;
  readonly options: readonly string[];
  readonly answer: number;
  readonly explanation: string;
}

/** Kana qui se prononcent comme un autre (を = お, ぢ = じ, づ = ず) et ん isolé : exclus. */
const AMBIGUOUS = new Set(['を', 'ぢ', 'づ', 'ん']);
const SOUND_KANA = kanaEntries(['base', 'dakuten', 'combo']).filter((e) => !AMBIGUOUS.has(e.kana));

const consonant = (romaji: string) => romaji.replace(/[aeiou]$/, '');
const vowel = (romaji: string) => romaji.at(-1) ?? '';

/**
 * Trois intrus qui se prononcent différemment, en privilégiant les sons proches
 * (même consonne ou même voyelle) pour que l'oreille travaille vraiment.
 */
function soundDistractors<T>(
  target: T,
  pool: readonly T[],
  sound: (x: T) => string,
  closeness: (x: T) => number,
  random: RandomInt,
): T[] {
  const taken = new Set([soundKey(sound(target))]);
  const out: T[] = [];
  const ranked = shuffle(pool, random).sort((a, b) => closeness(b) - closeness(a));
  for (const x of ranked) {
    const key = soundKey(sound(x));
    if (!taken.has(key)) {
      taken.add(key);
      out.push(x);
    }
    if (out.length === 3) {
      break;
    }
  }
  return out;
}

export function soundQuestion(target: SoundTarget, random: RandomInt): SoundQuestion {
  if (target === 'kana') {
    const entry = SOUND_KANA[random(SOUND_KANA.length)];
    // Hiragana ou katakana au hasard, le même pour les quatre propositions.
    const write = random(2) === 0 ? (k: string) => k : toKatakana;
    const others = soundDistractors(
      entry,
      SOUND_KANA,
      (e) => e.kana,
      (e) =>
        (consonant(e.romaji) === consonant(entry.romaji) ? 2 : 0) +
        (vowel(e.romaji) === vowel(entry.romaji) ? 1 : 0) +
        (e.group === entry.group ? 1 : 0),
      random,
    );
    const options = shuffle([entry, ...others], random);
    return {
      key: `son:kana:${entry.kana}`,
      spoken: entry.kana,
      options: options.map((e) => write(e.kana)),
      answer: options.indexOf(entry),
      explanation: `${write(entry.kana)} se lit « ${entry.romaji} ». Les autres : ${others
        .map((e) => `${write(e.kana)} ${e.romaji}`)
        .join(', ')}.`,
    };
  }
  const word = VOCAB[random(VOCAB.length)];
  const others = soundDistractors(
    word,
    VOCAB,
    (w) => w.r,
    (w) =>
      (w.r[0] === word.r[0] ? 2 : 0) +
      ([...w.r].length === [...word.r].length ? 1 : 0) +
      ([...w.w].some((c) => word.w.includes(c)) ? 2 : 0),
    random,
  );
  const options = shuffle([word, ...others], random);
  return {
    key: `son:kanji:${word.w}`,
    spoken: word.r,
    options: options.map((w) => w.w),
    answer: options.indexOf(word),
    explanation: `${word.w} se lit ${word.r} (${word.fr}). Les autres : ${others
      .map((w) => `${w.w} ${w.r}`)
      .join(', ')}.`,
  };
}
