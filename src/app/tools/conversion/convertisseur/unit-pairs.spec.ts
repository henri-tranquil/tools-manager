import { UNIT_PAIRS, UnitPairId } from './unit-pairs';

describe('UNIT_PAIRS', () => {
  it('convertit les pouces en centimètres', () => {
    expect(UNIT_PAIRS['pouces-cm'].toB(12)).toBeCloseTo(30.48, 6);
  });

  it('convertit les Fahrenheit en Celsius', () => {
    expect(UNIT_PAIRS['fahrenheit-celsius'].toB(350)).toBeCloseTo(176.667, 3);
    expect(UNIT_PAIRS['fahrenheit-celsius'].toB(32)).toBeCloseTo(0, 9);
  });

  it('toA est l’inverse de toB pour chaque paire', () => {
    for (const id of Object.keys(UNIT_PAIRS) as UnitPairId[]) {
      const pair = UNIT_PAIRS[id];
      expect(pair.toA(pair.toB(42))).toBeCloseTo(42, 9);
    }
  });
});
