import {
  computeLighthouse,
  LIGHTHOUSE_EXAMPLE,
  LIGHTHOUSE_METRICS,
  metricScore,
  scoreBand,
} from './lighthouse-score';

describe('metricScore', () => {
  it('vaut 0,5 à la médiane et 0,9 au p10', () => {
    expect(metricScore(3000, 1800, 3000)).toBeCloseTo(0.5, 4);
    expect(metricScore(1800, 1800, 3000)).toBeCloseTo(0.9, 4);
  });

  it('décroît quand la métrique augmente', () => {
    expect(metricScore(1000, 200, 600)).toBeLessThan(metricScore(500, 200, 600));
  });

  it('gère les cas limites', () => {
    expect(metricScore(0, 0.1, 0.25)).toBe(1);
    expect(metricScore(Number.NaN, 0.1, 0.25)).toBe(0);
  });
});

describe('computeLighthouse', () => {
  it('les poids totalisent 100', () => {
    expect(LIGHTHOUSE_METRICS.reduce((sum, m) => sum + m.weight, 0)).toBe(100);
  });

  it('donne un score rapide pour les valeurs d’exemple', () => {
    expect(computeLighthouse(LIGHTHOUSE_EXAMPLE).score).toBeGreaterThanOrEqual(90);
  });

  it('donne 50 quand toutes les métriques sont à la médiane', () => {
    const result = computeLighthouse({ fcp: 3, si: 5.8, lcp: 4, tbt: 600, cls: 0.25 });
    expect(result.score).toBe(50);
    expect(result.metrics.tbt).toBe(50);
  });
});

describe('scoreBand', () => {
  it('suit les seuils Lighthouse', () => {
    expect(scoreBand(90)).toBe('good');
    expect(scoreBand(89)).toBe('average');
    expect(scoreBand(50)).toBe('average');
    expect(scoreBand(49)).toBe('poor');
  });
});
