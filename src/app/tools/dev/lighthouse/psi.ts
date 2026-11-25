import { LIGHTHOUSE_METRICS, LighthouseMetricId } from './lighthouse-score';

/**
 * Analyse Lighthouse d'une URL via l'API PageSpeed Insights de Google.
 * C'est le seul outil du site qui fait un appel réseau : l'URL saisie est envoyée à Google,
 * uniquement quand on clique sur « Analyser ».
 */
export const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/**
 * Clé d'API injectée au build (`ng build --define PSI_API_KEY="'…'"`, secret GitHub
 * `PAGESPEED_API_KEY` dans la CI) : elle n'est jamais écrite dans le code source.
 * Sans clé, l'API utilise un quota anonyme partagé, souvent épuisé (erreur 429).
 * La clé finit dans le JavaScript public : la restreindre à l'API PageSpeed Insights et au
 * référent `henri-tranquil.github.io/*` dans la console Google Cloud.
 */
declare const PSI_API_KEY: string | undefined;
export const PAGESPEED_API_KEY = typeof PSI_API_KEY === 'string' ? PSI_API_KEY : '';

export type Strategy = 'mobile' | 'desktop';

const AUDIT_IDS: Readonly<Record<LighthouseMetricId, string>> = {
  fcp: 'first-contentful-paint',
  si: 'speed-index',
  lcp: 'largest-contentful-paint',
  tbt: 'total-blocking-time',
  cls: 'cumulative-layout-shift',
};

export interface PsiMetric {
  readonly id: LighthouseMetricId;
  readonly label: string;
  readonly weight: number;
  /** Valeur lisible fournie par Lighthouse (« 1,2 s », « 90 ms »…). */
  readonly displayValue: string;
  /** Score de la métrique, sur 100. */
  readonly score: number;
}

export interface PsiResult {
  readonly score: number;
  readonly metrics: readonly PsiMetric[];
  readonly finalUrl: string;
  readonly strategy: Strategy;
}

/** Complète « exemple.fr » en « https://exemple.fr/ ». Renvoie null si l'URL n'est pas analysable. */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    const isWeb = url.protocol === 'http:' || url.protocol === 'https:';
    const isPublicHost = url.hostname.includes('.') && url.hostname !== '127.0.0.1';
    return isWeb && isPublicHost ? url.href : null;
  } catch {
    return null;
  }
}

export function buildPsiRequest(
  url: string,
  strategy: Strategy,
  apiKey = PAGESPEED_API_KEY,
): string {
  const params = new URLSearchParams({ url, strategy, category: 'performance', locale: 'fr' });
  if (apiKey) {
    params.set('key', apiKey);
  }
  return `${PSI_ENDPOINT}?${params}`;
}

/** Lien vers le rapport complet sur pagespeed.web.dev. */
export function reportUrl(url: string, strategy: Strategy): string {
  return `https://pagespeed.web.dev/analysis?${new URLSearchParams({ url, form_factor: strategy })}`;
}

interface PsiAudit {
  readonly score?: number | null;
  readonly displayValue?: string;
}

interface PsiResponse {
  readonly lighthouseResult?: {
    readonly finalUrl?: string;
    readonly finalDisplayedUrl?: string;
    readonly categories?: { readonly performance?: { readonly score?: number | null } };
    readonly audits?: Readonly<Record<string, PsiAudit | undefined>>;
  };
}

/** Extrait le score et les métriques d'une réponse PageSpeed Insights. */
export function parsePsiResponse(json: unknown, strategy: Strategy): PsiResult {
  const result = (json as PsiResponse | null)?.lighthouseResult;
  const score = result?.categories?.performance?.score;
  if (!result || typeof score !== 'number') {
    throw new Error('La réponse de PageSpeed Insights ne contient pas de score de performance.');
  }
  const metrics = LIGHTHOUSE_METRICS.map((metric) => {
    const audit = result.audits?.[AUDIT_IDS[metric.id]];
    return {
      id: metric.id,
      label: metric.label,
      weight: metric.weight,
      displayValue: audit?.displayValue ?? '—',
      score: Math.round((audit?.score ?? 0) * 100),
    };
  });
  return {
    score: Math.round(score * 100),
    metrics,
    finalUrl: result.finalDisplayedUrl ?? result.finalUrl ?? '',
    strategy,
  };
}

/** Message d'erreur compréhensible à partir d'une réponse HTTP en échec. */
export function psiErrorMessage(status: number, body: unknown): string {
  const detail = (body as { error?: { message?: string } } | null)?.error?.message ?? '';
  if (status === 429) {
    return /per day/i.test(detail)
      ? "Le quota gratuit de l'API PageSpeed Insights est épuisé pour aujourd'hui. Lancez l'analyse directement sur PageSpeed Insights, ou utilisez le calcul à la main."
      : "Trop d'analyses d'affilée pour l'API PageSpeed Insights. Réessayez dans une minute.";
  }
  if (/FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS_FAILURE|NO_FCP/.test(detail)) {
    return "Lighthouse n'a pas pu charger cette page. Vérifiez qu'elle est publique et accessible.";
  }
  if (status === 400) {
    return "Cette URL n'a pas pu être analysée. Vérifiez qu'elle est correcte et publique.";
  }
  return `L'analyse a échoué (erreur ${status}). Réessayez dans un instant.`;
}
