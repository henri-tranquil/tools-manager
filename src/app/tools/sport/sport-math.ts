/** Calculs des outils de la section Sport. Valeurs par défaut génériques, aucune donnée réelle. */

// ---------------------------------------------------------------- Allure ↔ vitesse

export const paceToSpeed = (secondsPerKm: number): number => 3600 / secondsPerKm;
export const speedToPace = (kmh: number): number => 3600 / kmh;

export const RACE_DISTANCES: readonly { label: string; km: number }[] = [
  { label: '1 km', km: 1 },
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: 'Semi-marathon', km: 21.0975 },
  { label: 'Marathon', km: 42.195 },
];

// ---------------------------------------------------------------- Temps de rando (DIN 33466)

export interface HikingTime {
  readonly horizontalHours: number;
  readonly verticalHours: number;
  readonly totalHours: number;
}

/**
 * Norme DIN 33466 : 4 km/h à plat, 300 m/h en montée, 500 m/h en descente.
 * Durée = la plus grande des deux composantes + la moitié de la plus petite.
 */
export function hikingTime(distanceKm: number, ascentM: number, descentM: number): HikingTime {
  const horizontalHours = distanceKm / 4;
  const verticalHours = ascentM / 300 + descentM / 500;
  const totalHours =
    Math.max(horizontalHours, verticalHours) + Math.min(horizontalHours, verticalHours) / 2;
  return { horizontalHours, verticalHours, totalHours };
}

// ---------------------------------------------------------------- Développement vélo

export interface Wheel {
  readonly id: string;
  readonly label: string;
  /** Circonférence de roulement en millimètres. */
  readonly circumferenceMm: number;
}

export const WHEELS: readonly Wheel[] = [
  { id: '700x25', label: 'Route 700 × 25c', circumferenceMm: 2105 },
  { id: '700x28', label: 'Route 700 × 28c', circumferenceMm: 2136 },
  { id: '700x32', label: 'Route 700 × 32c', circumferenceMm: 2155 },
  { id: '700x40', label: 'Gravel 700 × 40c', circumferenceMm: 2200 },
  { id: '650bx47', label: 'Gravel 650b × 47', circumferenceMm: 2089 },
  { id: '29x2.2', label: 'VTT 29 × 2,2', circumferenceMm: 2326 },
  { id: '27.5x2.2', label: 'VTT 27,5 × 2,2', circumferenceMm: 2170 },
  { id: '26x2.1', label: 'VTT 26 × 2,1', circumferenceMm: 2068 },
];

/** Distance parcourue par tour de pédalier, en mètres. */
export function development(chainring: number, sprocket: number, circumferenceMm: number): number {
  return (chainring / sprocket) * (circumferenceMm / 1000);
}

/** Vitesse en km/h pour un développement (m) et une cadence (tours/min). */
export function speedAtCadence(developmentM: number, cadenceRpm: number): number {
  return (developmentM * cadenceRpm * 60) / 1000;
}

// ---------------------------------------------------------------- Zones cardio (Karvonen)

export const HEART_ZONES: readonly { zone: number; label: string; from: number; to: number }[] = [
  { zone: 1, label: 'Récupération', from: 0.5, to: 0.6 },
  { zone: 2, label: 'Endurance fondamentale', from: 0.6, to: 0.7 },
  { zone: 3, label: 'Tempo', from: 0.7, to: 0.8 },
  { zone: 4, label: 'Seuil', from: 0.8, to: 0.9 },
  { zone: 5, label: 'VMA', from: 0.9, to: 1 },
];

export interface HeartZone {
  readonly zone: number;
  readonly label: string;
  readonly fromBpm: number;
  readonly toBpm: number;
}

/** Méthode de Karvonen : FC cible = FC repos + % × (FC max − FC repos). */
export function karvonenZones(maxHr: number, restHr: number): HeartZone[] {
  const reserve = maxHr - restHr;
  return HEART_ZONES.map((z) => ({
    zone: z.zone,
    label: z.label,
    fromBpm: Math.round(restHr + z.from * reserve),
    toBpm: Math.round(restHr + z.to * reserve),
  }));
}

/** Estimation de Tanaka : FC max ≈ 208 − 0,7 × âge. */
export const tanakaMaxHr = (age: number): number => Math.round(208 - 0.7 * age);

// ---------------------------------------------------------------- Ravitaillement

export type Heat = 'frais' | 'tempere' | 'chaud';

export const HEAT_LABELS: Readonly<Record<Heat, string>> = {
  frais: 'Frais (< 15 °C)',
  tempere: 'Tempéré (15–25 °C)',
  chaud: 'Chaud (> 25 °C)',
};

const WATER_ML_PER_HOUR: Readonly<Record<Heat, number>> = { frais: 450, tempere: 600, chaud: 800 };
const SODIUM_MG_PER_HOUR: Readonly<Record<Heat, number>> = { frais: 300, tempere: 500, chaud: 800 };

/** Glucides par heure selon la durée : rien sous 1 h, 30–60 g jusqu'à 2 h 30, 60–90 g au-delà. */
export function carbsPerHour(hours: number): readonly [number, number] {
  if (hours < 1) {
    return [0, 30];
  }
  return hours <= 2.5 ? [30, 60] : [60, 90];
}

export interface FuelingPlan {
  readonly waterLiters: number;
  readonly sodiumMg: number;
  readonly carbsMinG: number;
  readonly carbsMaxG: number;
  readonly perHour: {
    readonly waterMl: number;
    readonly sodiumMg: number;
    readonly carbs: readonly [number, number];
  };
}

export function fuelingPlan(hours: number, heat: Heat): FuelingPlan {
  const carbs = carbsPerHour(hours);
  return {
    waterLiters: (hours * WATER_ML_PER_HOUR[heat]) / 1000,
    sodiumMg: hours * SODIUM_MG_PER_HOUR[heat],
    carbsMinG: hours * carbs[0],
    carbsMaxG: hours * carbs[1],
    perHour: { waterMl: WATER_ML_PER_HOUR[heat], sodiumMg: SODIUM_MG_PER_HOUR[heat], carbs },
  };
}
