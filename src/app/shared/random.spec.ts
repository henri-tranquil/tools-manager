import { cryptoRandomInt } from './random';

describe('cryptoRandomInt', () => {
  it('reste dans les bornes', () => {
    for (let i = 0; i < 500; i += 1) {
      const value = cryptoRandomInt(6);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('rejette une borne invalide', () => {
    expect(() => cryptoRandomInt(0)).toThrow(RangeError);
    expect(() => cryptoRandomInt(2.5)).toThrow(RangeError);
  });
});
