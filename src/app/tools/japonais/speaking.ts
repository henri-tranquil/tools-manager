/**
 * Expression orale : comparaison de ce que la reconnaissance vocale a entendu avec ce qu'il
 * fallait dire, more par more (unité de rythme du japonais : か, きゃ, っ, ー, ん). Fonctions pures.
 */
import type { Token } from './dictionary';
import { numberReading } from './exercises';
import { soundKey, toHiragana } from './kana';

const SMALL = /^[ぁぃぅぇぉゃゅょゎ]$/;

/** Découpe un texte en kana en mores : きょう → きょ・う, がっこう → が・っ・こ・う. */
export function morae(kana: string): string[] {
  const out: string[] = [];
  for (const c of soundKey(kana)) {
    if (SMALL.test(c) && out.length) {
      out[out.length - 1] += c;
    } else {
      out.push(c);
    }
  }
  return out;
}

export type PartStatus = 'ok' | 'wrong' | 'missing' | 'extra';

export interface DiffPart {
  /** More attendue (ou entendue en trop, pour `extra`). */
  readonly text: string;
  readonly status: PartStatus;
  /** More entendue à la place (pour `wrong`). */
  readonly heard?: string;
}

export interface Comparison {
  /** 0 à 1 : part des mores attendues correctement prononcées. */
  readonly score: number;
  readonly parts: readonly DiffPart[];
}

/** Aligne les mores attendues et entendues (distance d'édition) et note la prononciation. */
export function compareSpeech(expected: string, heard: string): Comparison {
  const a = morae(expected);
  const b = morae(heard);
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  const parts: DiffPart[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      parts.unshift(
        a[i - 1] === b[j - 1]
          ? { text: a[i - 1], status: 'ok' }
          : { text: a[i - 1], status: 'wrong', heard: b[j - 1] },
      );
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      parts.unshift({ text: a[i - 1], status: 'missing' });
      i--;
    } else {
      parts.unshift({ text: b[j - 1], status: 'extra' });
      j--;
    }
  }
  const score = a.length ? Math.max(0, 1 - d[a.length][b.length] / a.length) : 0;
  return { score, parts };
}

/** Meilleure des transcriptions proposées par la reconnaissance (elle en donne plusieurs). */
export function bestComparison(expected: string, candidates: readonly string[]): Comparison {
  return candidates
    .map((c) => compareSpeech(expected, c))
    .reduce<Comparison>((best, c) => (c.score > best.score ? c : best), {
      score: 0,
      parts: morae(expected).map((m) => ({ text: m, status: 'missing' as const })),
    });
}

/** Chiffres arabes (y compris pleine largeur) écrits en kana : 3時 → さん時. */
export function spellNumbers(text: string): string {
  return text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\d{1,5}/g, (n) => {
      const value = Number(n);
      return value === 0 ? 'ぜろ' : numberReading(value);
    });
}

const SPOKEN_PARTICLES: Readonly<Record<string, string>> = { は: 'わ', へ: 'え', を: 'お' };

/**
 * Lecture en hiragana d'un texte découpé par kuromoji, telle qu'on la prononce : les particules
 * は, へ, を se disent わ, え, お. Les mots sans lecture connue gardent leur écriture.
 */
export function spokenReading(tokens: readonly Token[]): string {
  return tokens
    .map((t) => {
      if (t.pos === '助詞' && SPOKEN_PARTICLES[t.surface_form]) {
        return SPOKEN_PARTICLES[t.surface_form];
      }
      return toHiragana(t.reading && t.reading !== '*' ? t.reading : t.surface_form);
    })
    .join('');
}

export type SpeakingVerdict = 'excellent' | 'bien' | 'moyen' | 'rate';

export const VERDICTS: Readonly<Record<SpeakingVerdict, { title: string; text: string }>> = {
  excellent: { title: '完璧 · Parfait', text: 'Prononciation reconnue sans erreur.' },
  bien: { title: 'Bien', text: 'Presque tout a été compris : regardez les sons en rouge.' },
  moyen: {
    title: 'Moyen',
    text: 'Une partie a été comprise : réécoutez le modèle, puis réessayez.',
  },
  rate: {
    title: 'Raté',
    text: 'La phrase n’a pas été reconnue : parlez plus lentement, plus près du micro.',
  },
};

export function speakingVerdict(score: number): SpeakingVerdict {
  return score >= 0.95 ? 'excellent' : score >= 0.75 ? 'bien' : score >= 0.4 ? 'moyen' : 'rate';
}
