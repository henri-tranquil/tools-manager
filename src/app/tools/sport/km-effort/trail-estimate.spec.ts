import { estimateTrail } from './trail-estimate';

describe('estimateTrail', () => {
  it('calcule km-effort, durée et ravitaillement', () => {
    const estimate = estimateTrail(32, 1800, 390);
    expect(estimate.kmEffort).toBe(50);
    expect(estimate.durationSeconds).toBe(19500);
    expect(estimate.waterLiters).toBeCloseTo(2.708, 3);
    expect(estimate.carbsGrams).toBeCloseTo(325, 6);
  });

  it('propage une allure invalide en NaN', () => {
    expect(estimateTrail(10, 0, Number.NaN).durationSeconds).toBeNaN();
  });
});
