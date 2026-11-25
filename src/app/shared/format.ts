/**
 * Lit un nombre saisi à la française : virgule ou point décimal, espaces ignorés.
 * Renvoie NaN si la saisie est vide ou invalide.
 */
export function parseDecimal(raw: string): number {
  const cleaned = raw.replace(/[\s  ]/g, '').replace(',', '.');
  if (cleaned === '') {
    return Number.NaN;
  }
  return Number(cleaned);
}

/** Formate un nombre en français (virgule décimale), sans « -0 ». Renvoie '' si non fini. */
export function formatDecimal(value: number, maximumFractionDigits = 3): string {
  if (!Number.isFinite(value)) {
    return '';
  }
  const epsilon = 0.5 * 10 ** -maximumFractionDigits;
  const safe = Math.abs(value) < epsilon ? 0 : value;
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits }).format(safe);
}

/** Complète à deux chiffres : 7 → « 07 ». */
export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
