/** Jeu de lecture : préparation des phrases et vérification de la transcription. */
import type { PhraseLevel, PhraseSource } from './data/phrases';
import { furigana, RubySegment } from './dictionary';
import { kanaToRomaji, looseRomaji, romajiToKana, soundKey } from './kana';

export interface PhraseWord {
  readonly surface: string;
  readonly ruby: readonly RubySegment[];
  /** Lecture prononcée, en kana (la particule は donne わ). */
  readonly spoken: string;
  /** Lecture écrite (は reste は) : pour reconnaître l'erreur classique « ha ». */
  readonly written: string;
  readonly punctuation: boolean;
}

export interface Phrase {
  readonly id: string;
  readonly level: PhraseLevel;
  readonly fr: string;
  readonly text: string;
  readonly words: readonly PhraseWord[];
  /** La phrase écrite uniquement en kana (pour le mode sans kanji). */
  readonly kana: string;
  readonly romaji: string;
}

const PARTICLES: Readonly<Record<string, string>> = { は: 'わ', へ: 'え', を: 'お' };
const PUNCTUATION = /^[。、？！]$/;

export function parsePhrase(source: PhraseSource, index: number): Phrase {
  const words = source.text.split(/\s+/).map((token): PhraseWord => {
    const particle = token.startsWith('_');
    const raw = particle ? token.slice(1) : token;
    const match = /^([^[]+)\[([^\]]+)](.*)$/.exec(raw);
    const surface = match ? match[1] + match[3] : raw;
    const reading = match ? match[2] + match[3] : raw;
    const punctuation = PUNCTUATION.test(surface);
    return {
      surface,
      ruby: furigana(surface, reading),
      spoken: punctuation ? '' : particle ? (PARTICLES[surface] ?? surface) : reading,
      written: punctuation ? '' : reading,
      punctuation,
    };
  });
  return {
    id: `p${index}`,
    level: source.level,
    fr: source.fr,
    text: words.map((w) => w.surface).join(''),
    words,
    kana: words.map((w) => (w.punctuation ? w.surface : w.written)).join(''),
    romaji: words
      .map((w) => (w.punctuation ? kanaToRomaji(w.surface) : ` ${kanaToRomaji(w.spoken)}`))
      .join('')
      .trim()
      .replace(/\s+([.,?!])/g, '$1'),
  };
}

export type Verdict = 'exact' | 'long-vowels' | 'particle' | 'wrong';

/**
 * Compare une transcription à la lecture de la phrase :
 * - `exact` : même son (toutes les orthographes Hepburn et Kunrei sont acceptées) ;
 * - `long-vowels` : juste, aux voyelles longues près ;
 * - `particle` : juste si on lit les particules comme elles s'écrivent (« ha » au lieu de « wa ») ;
 * - `wrong`.
 */
export function checkTranscription(answer: string, phrase: Phrase): Verdict {
  const typed = answer.trim();
  if (!typed) {
    return 'wrong';
  }
  // Les espaces restent jusqu'à la conversion : « pan o » donne ぱんお, pas ぱの.
  const typedKana = soundKey(romajiToKana(typed));
  const spoken = soundKey(phrase.words.map((w) => w.spoken).join(''));
  if (typedKana === spoken) {
    return 'exact';
  }
  if (looseRomaji(kanaToRomaji(typedKana)) === looseRomaji(kanaToRomaji(spoken))) {
    return 'long-vowels';
  }
  const written = soundKey(phrase.words.map((w) => w.written).join(''));
  if (
    typedKana === written ||
    looseRomaji(kanaToRomaji(typedKana)) === looseRomaji(kanaToRomaji(written))
  ) {
    return 'particle';
  }
  return 'wrong';
}
