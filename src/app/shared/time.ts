import { parseDecimal } from './format';

/**
 * Lit une durée « minutes:secondes » : « 6:30 », « 6'30 », « 7: » ou « 6,5 » (minutes décimales).
 * Renvoie un nombre de secondes, ou NaN si la saisie est invalide.
 */
export function parseMinSec(raw: string): number {
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

/** Lit une durée « h:mm » ou un nombre d'heures décimal (« 2,5 »). Renvoie des secondes ou NaN. */
export function parseHoursMinutes(raw: string): number {
  const parts = raw.trim().split(/[:hH]/);
  if (parts.length === 2) {
    const hours = Number(parts[0]);
    const minutes = parts[1] === '' ? 0 : Number(parts[1]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes < 0 || minutes >= 60) {
      return Number.NaN;
    }
    return hours * 3600 + minutes * 60;
  }
  return parts.length === 1 ? parseDecimal(parts[0]) * 3600 : Number.NaN;
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

/** 360 → « 06:00 » (minutes:secondes, minutes sur deux chiffres au moins). */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** 312 → « 5:12 » (allure ou durée courte). « — » si invalide. */
export function formatMinSec(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '—';
  }
  const safe = Math.round(totalSeconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/** 3725 → « 1:02:05 », 725 → « 12:05 ». « — » si invalide. */
export function formatHms(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '—';
  }
  const safe = Math.round(totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mmss = `${String(minutes).padStart(hours ? 2 : 1, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours ? `${hours}:${mmss}` : mmss;
}
