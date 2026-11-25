import {
  carbsPerHour,
  development,
  fuelingPlan,
  hikingTime,
  karvonenZones,
  paceToSpeed,
  speedAtCadence,
  speedToPace,
  tanakaMaxHr,
} from './sport-math';

describe('allure ↔ vitesse', () => {
  it('convertit 5:00/km en 12 km/h et inversement', () => {
    expect(paceToSpeed(300)).toBe(12);
    expect(speedToPace(12)).toBe(300);
  });
});

describe('hikingTime (DIN 33466)', () => {
  it('ajoute la moitié de la plus petite composante', () => {
    // 12 km → 3 h ; 600 m D+ et 600 m D- → 2 h + 1,2 h = 3,2 h ; total = 3,2 + 3/2 = 4,7 h
    const t = hikingTime(12, 600, 600);
    expect(t.horizontalHours).toBe(3);
    expect(t.verticalHours).toBeCloseTo(3.2, 9);
    expect(t.totalHours).toBeCloseTo(4.7, 9);
  });

  it('ne compte que l’horizontal sans dénivelé', () => {
    expect(hikingTime(8, 0, 0).totalHours).toBe(2);
  });
});

describe('développement vélo', () => {
  it('calcule les mètres par tour et la vitesse', () => {
    const dev = development(50, 25, 2100);
    expect(dev).toBeCloseTo(4.2, 9);
    expect(speedAtCadence(dev, 90)).toBeCloseTo(22.68, 9);
  });
});

describe('zones cardio', () => {
  it('applique la formule de Karvonen', () => {
    const zones = karvonenZones(190, 50);
    expect(zones[0]).toMatchObject({ zone: 1, fromBpm: 120, toBpm: 134 });
    expect(zones[4].toBpm).toBe(190);
  });

  it('estime la FC max (Tanaka)', () => {
    expect(tanakaMaxHr(40)).toBe(180);
  });
});

describe('ravitaillement', () => {
  it('adapte les glucides à la durée', () => {
    expect(carbsPerHour(0.5)).toEqual([0, 30]);
    expect(carbsPerHour(2)).toEqual([30, 60]);
    expect(carbsPerHour(4)).toEqual([60, 90]);
  });

  it('calcule les totaux', () => {
    const plan = fuelingPlan(3, 'chaud');
    expect(plan.waterLiters).toBeCloseTo(2.4, 9);
    expect(plan.sodiumMg).toBe(2400);
    expect(plan.carbsMaxG).toBe(270);
  });
});
