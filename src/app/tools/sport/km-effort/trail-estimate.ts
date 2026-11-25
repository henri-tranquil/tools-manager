/** Repères génériques de ravitaillement par heure d'effort. */
export const WATER_LITERS_PER_HOUR = 0.5;
export const CARBS_GRAMS_PER_HOUR = 60;

/** 100 m de D+ comptent comme 1 km à plat. */
const METERS_DPLUS_PER_KM_EFFORT = 100;

export interface TrailEstimate {
  readonly kmEffort: number;
  readonly durationSeconds: number;
  readonly waterLiters: number;
  readonly carbsGrams: number;
}

export function estimateTrail(
  distanceKm: number,
  elevationGainM: number,
  paceSecondsPerKm: number,
): TrailEstimate {
  const kmEffort = distanceKm + elevationGainM / METERS_DPLUS_PER_KM_EFFORT;
  const durationSeconds = kmEffort * paceSecondsPerKm;
  const hours = durationSeconds / 3600;
  return {
    kmEffort,
    durationSeconds,
    waterLiters: hours * WATER_LITERS_PER_HOUR,
    carbsGrams: hours * CARBS_GRAMS_PER_HOUR,
  };
}
