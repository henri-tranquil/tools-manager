export interface UnitPair {
  readonly labelA: string;
  readonly labelB: string;
  readonly toB: (a: number) => number;
  readonly toA: (b: number) => number;
  /** Valeur affichée à l'ouverture, dans l'unité A. */
  readonly defaultValue: number;
  readonly formula: string;
}

const linear = (factor: number) => ({
  toB: (a: number) => a * factor,
  toA: (b: number) => b / factor,
});

export const UNIT_PAIRS = {
  'pouces-cm': {
    labelA: 'Pouces (in)',
    labelB: 'Centimètres (cm)',
    ...linear(2.54),
    defaultValue: 12,
    formula: '1 in = 2,54 cm',
  },
  'miles-km': {
    labelA: 'Miles (mi)',
    labelB: 'Kilomètres (km)',
    ...linear(1.609344),
    defaultValue: 10,
    formula: '1 mi = 1,609 km',
  },
  'livres-kg': {
    labelA: 'Livres (lb)',
    labelB: 'Kilogrammes (kg)',
    ...linear(0.45359237),
    defaultValue: 1,
    formula: '1 lb = 0,454 kg',
  },
  'onces-g': {
    labelA: 'Onces (oz)',
    labelB: 'Grammes (g)',
    ...linear(28.349523125),
    defaultValue: 8,
    formula: '1 oz = 28,35 g',
  },
  'fahrenheit-celsius': {
    labelA: 'Fahrenheit (°F)',
    labelB: 'Celsius (°C)',
    toB: (f: number) => ((f - 32) * 5) / 9,
    toA: (c: number) => (c * 9) / 5 + 32,
    // 350 °F : la température de four la plus courante dans les recettes américaines.
    defaultValue: 350,
    formula: '°C = (°F − 32) × 5/9',
  },
  'gallons-litres': {
    labelA: 'Gallons US (gal)',
    labelB: 'Litres (L)',
    ...linear(3.785411784),
    defaultValue: 1,
    formula: '1 gal US = 3,785 L',
  },
} as const satisfies Record<string, UnitPair>;

export type UnitPairId = keyof typeof UNIT_PAIRS;
