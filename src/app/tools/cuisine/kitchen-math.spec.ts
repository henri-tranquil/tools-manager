import {
  bakersDough,
  flourForDough,
  measureToGrams,
  panArea,
  panFactor,
  parseQuantity,
  scaleLine,
  scaleRecipe,
} from './kitchen-math';

describe('mesures', () => {
  it('convertit une demi-tasse de farine', () => {
    expect(measureToGrams(1, 1 / 2, 120)).toBe(60);
  });
});

describe('portions', () => {
  it('lit les fractions et les décimales', () => {
    expect(parseQuantity('1/2')).toBe(0.5);
    expect(parseQuantity('1 1/2')).toBe(1.5);
    expect(parseQuantity('½')).toBe(0.5);
    expect(parseQuantity('1,5')).toBe(1.5);
  });

  it('multiplie la quantité en tête de ligne seulement', () => {
    expect(scaleLine('200 g de farine', 1.5)).toBe('300 g de farine');
    expect(scaleLine('1/2 citron', 2)).toBe('1 citron');
    expect(scaleLine('3 œufs (taille 2)', 2)).toBe('6 œufs (taille 2)');
    expect(scaleLine('Sel, poivre', 2)).toBe('Sel, poivre');
  });

  it('traite une recette ligne à ligne', () => {
    expect(scaleRecipe('100 g sucre\nVanille', 0.5)).toEqual(['50 g sucre', 'Vanille']);
  });
});

describe('taille du moule', () => {
  it('calcule les surfaces', () => {
    expect(panArea({ shape: 'carre', a: 20, b: 0 })).toBe(400);
    expect(panArea({ shape: 'rond', a: 20, b: 0 })).toBeCloseTo(314.159, 3);
  });

  it('donne le coefficient entre deux moules', () => {
    const from = { shape: 'rond' as const, a: 20, b: 0 };
    const to = { shape: 'rond' as const, a: 24, b: 0 };
    expect(panFactor(from, to)).toBeCloseTo(1.44, 9);
  });
});

describe('pourcentage du boulanger', () => {
  const recipe = { hydrationPct: 70, saltPct: 2, starterPct: 20, yeastPct: 0 };

  it('calcule chaque ingrédient à partir de la farine', () => {
    const dough = bakersDough({ flourG: 500, ...recipe });
    expect(dough).toEqual({ waterG: 350, saltG: 10, starterG: 100, yeastG: 0, totalG: 960 });
  });

  it('retrouve la farine à partir du poids de pâte', () => {
    expect(flourForDough(960, recipe)).toBeCloseTo(500, 9);
  });
});
