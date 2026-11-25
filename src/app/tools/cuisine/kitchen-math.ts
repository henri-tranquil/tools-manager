import { formatDecimal, parseDecimal } from '../../shared/format';

// ---------------------------------------------------------------- Mesures américaines

/** Grammes pour une tasse américaine (cup ≈ 236,6 ml), valeurs usuelles. */
export const INGREDIENTS: readonly { id: string; label: string; gramsPerCup: number }[] = [
  { id: 'farine', label: 'Farine de blé', gramsPerCup: 120 },
  { id: 'sucre', label: 'Sucre en poudre', gramsPerCup: 200 },
  { id: 'cassonade', label: 'Cassonade (tassée)', gramsPerCup: 220 },
  { id: 'sucre-glace', label: 'Sucre glace', gramsPerCup: 120 },
  { id: 'beurre', label: 'Beurre', gramsPerCup: 227 },
  { id: 'eau', label: 'Eau', gramsPerCup: 237 },
  { id: 'lait', label: 'Lait', gramsPerCup: 245 },
  { id: 'huile', label: 'Huile', gramsPerCup: 218 },
  { id: 'miel', label: 'Miel', gramsPerCup: 340 },
  { id: 'riz', label: 'Riz cru', gramsPerCup: 185 },
  { id: 'avoine', label: "Flocons d'avoine", gramsPerCup: 90 },
  { id: 'cacao', label: 'Cacao en poudre', gramsPerCup: 85 },
  { id: 'amande', label: "Poudre d'amande", gramsPerCup: 96 },
  { id: 'chocolat', label: 'Pépites de chocolat', gramsPerCup: 170 },
];

export const CUP_ML = 236.6;

export const MEASURES: readonly { id: string; label: string; cups: number }[] = [
  { id: 'cup', label: 'tasse (cup)', cups: 1 },
  { id: 'half', label: '1/2 tasse', cups: 1 / 2 },
  { id: 'third', label: '1/3 tasse', cups: 1 / 3 },
  { id: 'quarter', label: '1/4 tasse', cups: 1 / 4 },
  { id: 'tbsp', label: 'cuillère à soupe (tbsp)', cups: 1 / 16 },
  { id: 'tsp', label: 'cuillère à café (tsp)', cups: 1 / 48 },
];

export function measureToGrams(quantity: number, cups: number, gramsPerCup: number): number {
  return quantity * cups * gramsPerCup;
}

// ---------------------------------------------------------------- Portions

const UNICODE_FRACTIONS: Readonly<Record<string, number>> = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅛': 1 / 8,
};

/** Quantité en tête de ligne : « 200 », « 1,5 », « 1/2 », « 1 1/2 », « ½ ». */
const LEADING_QUANTITY = /^(\s*)(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?|[½⅓⅔¼¾⅛])/;

export function parseQuantity(token: string): number {
  const text = token.trim();
  if (text in UNICODE_FRACTIONS) {
    return UNICODE_FRACTIONS[text];
  }
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(text);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2]);
  }
  return parseDecimal(text);
}

/** Multiplie la quantité en tête de ligne ; les lignes sans quantité sont gardées telles quelles. */
export function scaleLine(line: string, factor: number): string {
  return line.replace(LEADING_QUANTITY, (_, space: string, quantity: string) => {
    const value = parseQuantity(quantity) * factor;
    return Number.isFinite(value) ? space + formatDecimal(value, 2) : space + quantity;
  });
}

export function scaleRecipe(text: string, factor: number): string[] {
  return text.split('\n').map((line) => scaleLine(line, factor));
}

// ---------------------------------------------------------------- Taille du moule

export type PanShape = 'rond' | 'carre' | 'rectangle';

export interface Pan {
  readonly shape: PanShape;
  /** Diamètre (rond), côté (carré) ou longueur (rectangle), en cm. */
  readonly a: number;
  /** Largeur du rectangle, en cm. */
  readonly b: number;
}

export function panArea(pan: Pan): number {
  switch (pan.shape) {
    case 'rond':
      return Math.PI * (pan.a / 2) ** 2;
    case 'carre':
      return pan.a ** 2;
    case 'rectangle':
      return pan.a * pan.b;
  }
}

/** Coefficient à appliquer aux quantités pour passer d'un moule à l'autre (même hauteur). */
export function panFactor(from: Pan, to: Pan): number {
  return panArea(to) / panArea(from);
}

// ---------------------------------------------------------------- Pourcentage du boulanger

export interface DoughInput {
  readonly flourG: number;
  readonly hydrationPct: number;
  readonly saltPct: number;
  readonly starterPct: number;
  readonly yeastPct: number;
}

export interface Dough {
  readonly waterG: number;
  readonly saltG: number;
  readonly starterG: number;
  readonly yeastG: number;
  readonly totalG: number;
}

/** Chaque ingrédient est exprimé en pourcentage du poids de farine. */
export function bakersDough(input: DoughInput): Dough {
  const pct = (p: number) => (input.flourG * p) / 100;
  const waterG = pct(input.hydrationPct);
  const saltG = pct(input.saltPct);
  const starterG = pct(input.starterPct);
  const yeastG = pct(input.yeastPct);
  return {
    waterG,
    saltG,
    starterG,
    yeastG,
    totalG: input.flourG + waterG + saltG + starterG + yeastG,
  };
}

/** Farine nécessaire pour obtenir un poids de pâte donné. */
export function flourForDough(totalG: number, input: Omit<DoughInput, 'flourG'>): number {
  const sumPct = 100 + input.hydrationPct + input.saltPct + input.starterPct + input.yeastPct;
  return (totalG * 100) / sumPct;
}
