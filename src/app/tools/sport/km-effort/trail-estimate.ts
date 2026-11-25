import { parseDecimal } from '../../../shared/format';

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

/**
 * Lit une allure en secondes par km : « 6:30 », « 6'30 » ou « 6,5 » (minutes décimales).
 * Renvoie NaN si la saisie est invalide.
 */
export function parsePace(raw: string): number {
  const parts = raw.trim().split(/[:'’]/);
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = parts[1] === '' ? 0 : Number(parts[1]);
    if (!Number.isInteger(minutes) || !Number.isInteger(seconds) || seconds < 0 || seconds >= 60) {
      return Number.NaN;
    }
    return minutes * 60 + seconds;
  }
  if (parts.length === 1) {
    return parseDecimal(parts[0]) * 60;
  }
  return Number.NaN;
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

/** « 5 h 25 », « 45 min », ou « — » si la durée est invalide. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '—';
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours} h ${String(minutes).padStart(2, '0')}`;
}
