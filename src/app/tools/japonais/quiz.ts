/**
 * Mécanique commune des jeux (kana, kanji, phrases) : tirage pondéré qui fait revenir plus
 * souvent ce qu'on rate, choix multiples, statistiques. Fonctions pures.
 */
import type { RandomInt } from '../../shared/random';

export interface CardStats {
  readonly ok: number;
  readonly ko: number;
}

export type StatsMap = Readonly<Record<string, CardStats>>;

/** Poids de tirage : une carte jamais vue vaut 3, une carte souvent ratée jusqu'à 12, une carte sue 1. */
export function weightOf(stats: CardStats | undefined): number {
  if (!stats) {
    return 3;
  }
  return Math.min(12, Math.max(1, 2 + 3 * stats.ko - stats.ok));
}

/** Tire une carte en favorisant les plus ratées, sans répéter la précédente. */
export function pickWeighted<T>(
  items: readonly T[],
  key: (item: T) => string,
  stats: StatsMap,
  random: RandomInt,
  previous?: string,
): T | undefined {
  const pool = items.length > 1 ? items.filter((i) => key(i) !== previous) : items;
  if (!pool.length) {
    return undefined;
  }
  const weights = pool.map((i) => weightOf(stats[key(i)]));
  let ticket = random(weights.reduce((a, b) => a + b, 0));
  for (let i = 0; i < pool.length; i++) {
    ticket -= weights[i];
    if (ticket < 0) {
      return pool[i];
    }
  }
  return pool[pool.length - 1];
}

export function recordAnswer(stats: StatsMap, key: string, correct: boolean): StatsMap {
  const current = stats[key] ?? { ok: 0, ko: 0 };
  return {
    ...stats,
    [key]: correct
      ? { ok: current.ok + 1, ko: current.ko }
      : { ok: current.ok, ko: current.ko + 1 },
  };
}

/** Mélange de Fisher-Yates (copie). */
export function shuffle<T>(items: readonly T[], random: RandomInt): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `count` propositions distinctes, dont la bonne réponse, dans un ordre aléatoire. */
export function choices(
  correct: string,
  pool: readonly string[],
  count: number,
  random: RandomInt,
): string[] {
  const others = shuffle([...new Set(pool.filter((p) => p !== correct))], random).slice(
    0,
    count - 1,
  );
  return shuffle([correct, ...others], random);
}

/** Les cartes les plus ratées, pour la liste « À revoir ». */
export function toReview(stats: StatsMap, limit = 8): { key: string; ko: number }[] {
  return Object.entries(stats)
    .filter(([, s]) => s.ko > s.ok / 2 && s.ko > 0)
    .sort(([, a], [, b]) => b.ko - b.ok / 2 - (a.ko - a.ok / 2))
    .slice(0, limit)
    .map(([key, s]) => ({ key, ko: s.ko }));
}

export interface Score {
  readonly good: number;
  readonly total: number;
  readonly streak: number;
  readonly best: number;
}

export const EMPTY_SCORE: Score = { good: 0, total: 0, streak: 0, best: 0 };

export function nextScore(score: Score, correct: boolean): Score {
  const streak = correct ? score.streak + 1 : 0;
  return {
    good: score.good + (correct ? 1 : 0),
    total: score.total + 1,
    streak,
    best: Math.max(score.best, streak),
  };
}

export function accuracy(score: Score): number | null {
  return score.total ? Math.round((100 * score.good) / score.total) : null;
}
