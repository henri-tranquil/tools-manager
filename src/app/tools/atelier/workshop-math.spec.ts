import {
  cyanotypeMix,
  fabricLength,
  goldenSplit,
  interiorAngle,
  miterAngle,
  parseCutList,
  parseFabricPieces,
  PHI,
  planCuts,
  rectangleFrame,
} from './workshop-math';

describe('angle d’onglet', () => {
  it('donne 45° pour un cadre carré et 30° pour un hexagone', () => {
    expect(miterAngle(4)).toBe(45);
    expect(miterAngle(6)).toBe(30);
    expect(interiorAngle(6)).toBe(120);
  });

  it('calcule les montants d’un cadre rectangulaire', () => {
    expect(rectangleFrame(30, 40, 3)).toEqual({ long: 46, short: 36, total: 176 });
  });
});

describe('débit de planches', () => {
  it('lit la liste de coupes', () => {
    expect(parseCutList('800 x 4\n450×2\n300\nblabla')).toEqual([
      { length: 800, qty: 4 },
      { length: 450, qty: 2 },
      { length: 300, qty: 1 },
    ]);
  });

  it('range les pièces en comptant le trait de scie', () => {
    const plan = planCuts(2000, 3, [
      { length: 900, qty: 2 },
      { length: 150, qty: 1 },
    ]);
    // 900 + 3 + 900 = 1803, + 3 + 150 = 1956 ≤ 2000 : tout tient sur une planche.
    expect(plan.boards).toHaveLength(1);
    expect(plan.boards[0].cuts).toEqual([900, 900, 150]);
    expect(plan.boards[0].waste).toBe(44);
  });

  it('ouvre une nouvelle planche si besoin et signale les pièces trop longues', () => {
    const plan = planCuts(1000, 3, [
      { length: 600, qty: 2 },
      { length: 1200, qty: 1 },
    ]);
    expect(plan.boards).toHaveLength(2);
    expect(plan.tooLong).toEqual([1200]);
  });
});

describe('métrage de tissu', () => {
  it('lit les pièces', () => {
    expect(parseFabricPieces('40 x 60 x 2\n30×30')).toEqual([
      { width: 40, height: 60, qty: 2 },
      { width: 30, height: 30, qty: 1 },
    ]);
  });

  it('place les pièces en rangées sur la laize', () => {
    // Laize 140 : deux pièces 60 × 40 (tournées) par rangée → 2 rangées de 40 cm.
    const plan = fabricLength(140, [{ width: 40, height: 60, qty: 4 }]);
    expect(plan).toEqual({ lengthCm: 80, rows: 2, unfit: 0 });
  });

  it('respecte le droit-fil quand la rotation est interdite', () => {
    const plan = fabricLength(140, [{ width: 40, height: 60, qty: 4 }], false);
    expect(plan.lengthCm).toBe(120); // 3 pièces de 40 par rangée → 2 rangées de 60 cm.
  });

  it('signale les pièces trop larges', () => {
    expect(fabricLength(100, [{ width: 150, height: 120, qty: 1 }]).unfit).toBe(1);
  });
});

describe('cyanotype', () => {
  it('dose 2 ml de mélange par A4, moitié A, moitié B', () => {
    const mix = cyanotypeMix(21 * 29.7 * 5);
    expect(mix.mixMl).toBeCloseTo(10, 9);
    expect(mix.gramsA).toBeCloseTo(1.25, 9);
    expect(mix.gramsB).toBeCloseTo(0.5, 9);
  });
});

describe('nombre d’or', () => {
  it('découpe une longueur selon φ', () => {
    const split = goldenSplit(100);
    expect(split.major).toBeCloseTo(61.803, 3);
    expect(split.major / split.minor).toBeCloseTo(PHI, 9);
  });
});
