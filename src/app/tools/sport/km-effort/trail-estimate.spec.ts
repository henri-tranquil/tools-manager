import { estimateTrail, formatDuration, parsePace } from './trail-estimate';

describe('parsePace', () => {
  it('lit les formats min:s et min’s', () => {
    expect(parsePace('6:30')).toBe(390);
    expect(parsePace("5'05")).toBe(305);
    expect(parsePace('7:')).toBe(420);
  });

  it('lit les minutes décimales', () => {
    expect(parsePace('6,5')).toBe(390);
  });

  it('rejette les saisies invalides', () => {
    expect(parsePace('6:75')).toBeNaN();
    expect(parsePace('abc')).toBeNaN();
    expect(parsePace('1:2:3')).toBeNaN();
  });
});

describe('estimateTrail', () => {
  it('calcule km-effort, durée et ravitaillement', () => {
    const estimate = estimateTrail(32, 1800, 390);
    expect(estimate.kmEffort).toBe(50);
    expect(estimate.durationSeconds).toBe(19500);
    expect(estimate.waterLiters).toBeCloseTo(2.708, 3);
    expect(estimate.carbsGrams).toBeCloseTo(325, 6);
  });
});

describe('formatDuration', () => {
  it('formate en heures et minutes', () => {
    expect(formatDuration(19500)).toBe('5 h 25');
    expect(formatDuration(3600)).toBe('1 h 00');
    expect(formatDuration(2700)).toBe('45 min');
  });

  it('affiche un tiret pour une durée invalide', () => {
    expect(formatDuration(Number.NaN)).toBe('—');
    expect(formatDuration(0)).toBe('—');
  });
});
