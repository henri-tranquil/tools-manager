import { estimateLoadSeconds, maxWeightKb, NETWORKS } from './load-time';

const fibre = NETWORKS.find((n) => n.id === 'fibre')!;
const slow3g = NETWORKS.find((n) => n.id === '3g-lente')!;

describe('estimateLoadSeconds', () => {
  it('additionne latence et transfert', () => {
    // 4 allers-retours × 400 ms + 500 Ko × 8 / 400 kbps = 1,6 + 10 s
    expect(estimateLoadSeconds(500, 6, slow3g)).toBeCloseTo(11.6, 6);
  });

  it('est plus rapide sur fibre qu’en 3G lente', () => {
    expect(estimateLoadSeconds(1000, 30, fibre)).toBeLessThan(
      estimateLoadSeconds(1000, 30, slow3g),
    );
  });
});

describe('maxWeightKb', () => {
  it('est l’inverse de estimateLoadSeconds', () => {
    const budget = maxWeightKb(3, 20, slow3g);
    expect(estimateLoadSeconds(budget, 20, slow3g)).toBeCloseTo(3, 6);
  });

  it('vaut 0 si la latence dépasse déjà la cible', () => {
    expect(maxWeightKb(0.5, 60, slow3g)).toBe(0);
  });
});
