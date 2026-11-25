import { RandomInt } from '../../shared/random';

// ---------------------------------------------------------------- Pomodoro

export type Phase = 'travail' | 'pause' | 'pause-longue';

export const PHASE_LABELS: Readonly<Record<Phase, string>> = {
  travail: 'Travail',
  pause: 'Pause courte',
  'pause-longue': 'Pause longue',
};

/** Après chaque séance de travail : pause courte, ou pause longue toutes les `longEvery` séances. */
export function nextPhase(
  current: Phase,
  completedWork: number,
  longEvery: number,
): { phase: Phase; completedWork: number } {
  if (current !== 'travail') {
    return { phase: 'travail', completedWork };
  }
  const done = completedWork + 1;
  return { phase: done % longEvery === 0 ? 'pause-longue' : 'pause', completedWork: done };
}

// ---------------------------------------------------------------- Mot de passe

export interface PasswordOptions {
  readonly length: number;
  readonly lower: boolean;
  readonly upper: boolean;
  readonly digits: boolean;
  readonly symbols: boolean;
  /** Retire les caractères faciles à confondre : 0 O o 1 l I |. */
  readonly avoidAmbiguous: boolean;
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!#$%&*+-=?@_~.,:;()[]{}',
} as const;
const AMBIGUOUS = /[0Oo1lI|]/g;

export function characterSets(options: PasswordOptions): string[] {
  return (Object.keys(SETS) as (keyof typeof SETS)[])
    .filter((key) => options[key])
    .map((key) => (options.avoidAmbiguous ? SETS[key].replace(AMBIGUOUS, '') : SETS[key]));
}

/** Au moins un caractère de chaque famille choisie, puis mélange de Fisher-Yates. */
export function generatePassword(options: PasswordOptions, random: RandomInt): string {
  const sets = characterSets(options);
  if (sets.length === 0 || options.length < sets.length) {
    return '';
  }
  const alphabet = sets.join('');
  const chars = sets.map((set) => set[random(set.length)]);
  while (chars.length < options.length) {
    chars.push(alphabet[random(alphabet.length)]);
  }
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function entropyBits(length: number, alphabetSize: number): number {
  return alphabetSize > 1 ? length * Math.log2(alphabetSize) : 0;
}

export function strengthLabel(bits: number): string {
  if (bits < 45) {
    return 'Faible';
  }
  if (bits < 65) {
    return 'Moyen';
  }
  return bits < 90 ? 'Fort' : 'Très fort';
}

// ---------------------------------------------------------------- Tirage au sort

export function rollDice(count: number, faces: number, random: RandomInt): number[] {
  return Array.from({ length: count }, () => random(faces) + 1);
}

export function flipCoin(random: RandomInt): 'Pile' | 'Face' {
  return random(2) === 0 ? 'Pile' : 'Face';
}

export function randomBetween(min: number, max: number, random: RandomInt): number {
  return min + random(max - min + 1);
}

/** Tire `count` éléments distincts (sans remise). */
export function draw<T>(items: readonly T[], count: number, random: RandomInt): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(random(pool.length), 1)[0]);
  }
  return picked;
}

// ---------------------------------------------------------------- Règle de trois

/** a est à b ce que c est à x : x = b × c / a. */
export const ruleOfThree = (a: number, b: number, c: number): number => (b * c) / a;
