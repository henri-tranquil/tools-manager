import { RandomInt } from '../../shared/random';
import {
  characterSets,
  draw,
  entropyBits,
  flipCoin,
  generatePassword,
  nextPhase,
  randomBetween,
  rollDice,
  ruleOfThree,
  strengthLabel,
} from './daily-math';

/** Générateur déterministe : renvoie toujours 0. */
const zero: RandomInt = () => 0;
/** Générateur déterministe : renvoie toujours la valeur maximale. */
const last: RandomInt = (max) => max - 1;

describe('pomodoro', () => {
  it('alterne travail et pauses, avec une pause longue toutes les 4 séances', () => {
    let state = { phase: 'travail' as const, completedWork: 0 } as ReturnType<typeof nextPhase>;
    const phases: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      state = nextPhase(state.phase, state.completedWork, 4);
      phases.push(state.phase);
    }
    expect(phases).toEqual([
      'pause',
      'travail',
      'pause',
      'travail',
      'pause',
      'travail',
      'pause-longue',
      'travail',
    ]);
  });
});

describe('mot de passe', () => {
  const options = {
    length: 16,
    lower: true,
    upper: true,
    digits: true,
    symbols: false,
    avoidAmbiguous: false,
  };

  it('respecte la longueur et contient chaque famille choisie', () => {
    let seed = 7;
    const pseudo: RandomInt = (max) => (seed = (seed * 1103515245 + 12345) % 2147483648) % max;
    const password = generatePassword(options, pseudo);
    expect(password).toHaveLength(16);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/\d/);
    expect(password).not.toMatch(/[^a-zA-Z\d]/);
  });

  it('retire les caractères ambigus', () => {
    const sets = characterSets({ ...options, avoidAmbiguous: true }).join('');
    expect(sets).not.toMatch(/[0Oo1lI]/);
  });

  it('renvoie une chaîne vide sans famille choisie', () => {
    expect(generatePassword({ ...options, lower: false, upper: false, digits: false }, zero)).toBe(
      '',
    );
  });

  it('estime l’entropie', () => {
    expect(entropyBits(10, 2)).toBe(10);
    expect(strengthLabel(entropyBits(16, 62))).toBe('Très fort');
    expect(strengthLabel(30)).toBe('Faible');
  });
});

describe('tirage au sort', () => {
  it('lance des dés entre 1 et le nombre de faces', () => {
    expect(rollDice(3, 6, zero)).toEqual([1, 1, 1]);
    expect(rollDice(2, 20, last)).toEqual([20, 20]);
  });

  it('pile ou face et nombre entre deux bornes', () => {
    expect(flipCoin(zero)).toBe('Pile');
    expect(randomBetween(5, 10, last)).toBe(10);
  });

  it('tire sans remise', () => {
    expect(draw(['a', 'b', 'c'], 5, zero)).toEqual(['a', 'b', 'c']);
  });
});

describe('règle de trois', () => {
  it('calcule la quatrième proportionnelle', () => {
    expect(ruleOfThree(4, 300, 6)).toBe(450);
  });
});
