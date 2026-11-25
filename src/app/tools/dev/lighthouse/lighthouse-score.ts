/**
 * Score de performance Lighthouse (v10+, profil mobile).
 *
 * Chaque métrique est notée par une courbe log-normale définie par deux points de
 * contrôle : `p10` (valeur qui donne 0,90) et `median` (valeur qui donne 0,50).
 * Le score final est la moyenne pondérée des scores de métriques.
 */

export type LighthouseMetricId = 'fcp' | 'si' | 'lcp' | 'tbt' | 'cls';

export interface LighthouseMetric {
  readonly id: LighthouseMetricId;
  readonly label: string;
  /** Unité de saisie affichée à l'utilisateur. */
  readonly unit: 's' | 'ms' | '';
  /** Multiplicateur pour passer de l'unité de saisie à l'unité de la courbe (ms ou sans unité). */
  readonly inputToCurve: number;
  readonly p10: number;
  readonly median: number;
  /** Poids dans le score final, en pourcentage. */
  readonly weight: number;
}

export const LIGHTHOUSE_METRICS: readonly LighthouseMetric[] = [
  {
    id: 'fcp',
    label: 'First Contentful Paint',
    unit: 's',
    inputToCurve: 1000,
    p10: 1800,
    median: 3000,
    weight: 10,
  },
  {
    id: 'si',
    label: 'Speed Index',
    unit: 's',
    inputToCurve: 1000,
    p10: 3387,
    median: 5800,
    weight: 10,
  },
  {
    id: 'lcp',
    label: 'Largest Contentful Paint',
    unit: 's',
    inputToCurve: 1000,
    p10: 2500,
    median: 4000,
    weight: 25,
  },
  {
    id: 'tbt',
    label: 'Total Blocking Time',
    unit: 'ms',
    inputToCurve: 1,
    p10: 200,
    median: 600,
    weight: 30,
  },
  {
    id: 'cls',
    label: 'Cumulative Layout Shift',
    unit: '',
    inputToCurve: 1,
    p10: 0.1,
    median: 0.25,
    weight: 25,
  },
];

/** Valeurs d'exemple génériques affichées à l'ouverture de l'outil. */
export const LIGHTHOUSE_EXAMPLE: Readonly<Record<LighthouseMetricId, number>> = {
  fcp: 1.2,
  si: 2.1,
  lcp: 1.9,
  tbt: 90,
  cls: 0.02,
};

/** z tel que la loi normale vaut 0,90 : Φ⁻¹(0,9). */
const Z_P10 = 1.2815515655446004;

/** Approximation d'Abramowitz & Stegun (7.1.26), erreur < 1,5e-7. */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const poly =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - poly * Math.exp(-ax * ax));
}

/** Score d'une métrique, entre 0 et 1. Une valeur invalide vaut 0, une valeur nulle ou négative vaut 1. */
export function metricScore(value: number, p10: number, median: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value <= 0) {
    return 1;
  }
  const mu = Math.log(median);
  const sigma = (mu - Math.log(p10)) / Z_P10;
  const score = 0.5 * (1 - erf((Math.log(value) - mu) / (sigma * Math.SQRT2)));
  return Math.min(1, Math.max(0, score));
}

export type ScoreBand = 'good' | 'average' | 'poor';

/** Couleur Lighthouse : 90 et plus = bon, 50 à 89 = moyen, sinon mauvais. */
export function scoreBand(score100: number): ScoreBand {
  if (score100 >= 90) {
    return 'good';
  }
  return score100 >= 50 ? 'average' : 'poor';
}

export interface LighthouseResult {
  /** Score global sur 100. */
  readonly score: number;
  /** Score de chaque métrique, sur 100. */
  readonly metrics: Readonly<Record<LighthouseMetricId, number>>;
}

/** Calcule le score à partir des valeurs saisies (dans l'unité affichée de chaque métrique). */
export function computeLighthouse(
  values: Readonly<Record<LighthouseMetricId, number>>,
): LighthouseResult {
  let weighted = 0;
  const metrics = {} as Record<LighthouseMetricId, number>;
  for (const metric of LIGHTHOUSE_METRICS) {
    const score = metricScore(values[metric.id] * metric.inputToCurve, metric.p10, metric.median);
    metrics[metric.id] = Math.round(score * 100);
    weighted += score * metric.weight;
  }
  return { score: Math.round(weighted), metrics };
}
