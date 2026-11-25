import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import {
  computeLighthouse,
  LIGHTHOUSE_EXAMPLE,
  LIGHTHOUSE_METRICS,
  LighthouseMetricId,
  scoreBand,
} from './lighthouse-score';
import {
  buildPsiRequest,
  normalizeUrl,
  parsePsiResponse,
  psiErrorMessage,
  PsiResult,
  reportUrl,
  Strategy,
} from './psi';

const VERDICTS = { good: 'Rapide', average: 'À améliorer', poor: 'Lent' } as const;
const TIMEOUT_MS = 90_000;

type Mode = 'url' | 'manual';
type Status = 'idle' | 'loading' | 'done' | 'error';

@Component({
  selector: 'app-lighthouse',
  templateUrl: './lighthouse.html',
  styleUrl: './lighthouse.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lighthouse {
  protected readonly mode = signal<Mode>('url');
  protected readonly band = scoreBand;
  protected readonly verdictOf = (score: number) => VERDICTS[scoreBand(score)];

  // ---- Analyse d'une URL (PageSpeed Insights) ----
  protected readonly url = signal('');
  protected readonly strategy = signal<Strategy>('mobile');
  protected readonly status = signal<Status>('idle');
  protected readonly error = signal('');
  protected readonly result = signal<PsiResult | null>(null);
  protected readonly report = computed(() => {
    const r = this.result();
    if (r) {
      return reportUrl(r.finalUrl, r.strategy);
    }
    const target = normalizeUrl(this.url());
    return target ? reportUrl(target, this.strategy()) : '';
  });
  /** L'adresse de ce site, pour le bouton « Tester ce site ». */
  protected readonly ownUrl = new URL(document.baseURI).href;
  private controller: AbortController | null = null;

  // ---- Calcul à la main ----
  protected readonly metrics = LIGHTHOUSE_METRICS;
  protected readonly inputs = signal<Record<LighthouseMetricId, string>>(
    Object.fromEntries(
      LIGHTHOUSE_METRICS.map((m) => [m.id, formatDecimal(LIGHTHOUSE_EXAMPLE[m.id])]),
    ) as Record<LighthouseMetricId, string>,
  );
  protected readonly manual = computed(() => {
    const raw = this.inputs();
    const values = Object.fromEntries(
      LIGHTHOUSE_METRICS.map((m) => [m.id, parseDecimal(raw[m.id])]),
    ) as Record<LighthouseMetricId, number>;
    return computeLighthouse(values);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller?.abort());
  }

  protected update(id: LighthouseMetricId, raw: string): void {
    this.inputs.update((current) => ({ ...current, [id]: raw }));
  }

  protected testThisSite(): void {
    this.url.set(this.ownUrl);
    void this.analyze();
  }

  protected async analyze(): Promise<void> {
    const target = normalizeUrl(this.url());
    if (!target) {
      this.fail("Saisissez l'adresse d'une page publique, par exemple https://exemple.fr");
      return;
    }
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    this.status.set('loading');
    this.error.set('');
    this.result.set(null);
    try {
      const response = await fetch(buildPsiRequest(target, this.strategy()), {
        signal: controller.signal,
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        this.fail(psiErrorMessage(response.status, body));
        return;
      }
      this.result.set(parsePsiResponse(body, this.strategy()));
      this.status.set('done');
    } catch (err) {
      if (this.controller !== controller) {
        return; // Une nouvelle analyse a remplacé celle-ci.
      }
      this.fail(
        err instanceof DOMException && err.name === 'AbortError'
          ? "L'analyse a pris trop de temps. Réessayez."
          : 'Impossible de joindre PageSpeed Insights. Vérifiez votre connexion.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private fail(message: string): void {
    this.error.set(message);
    this.status.set('error');
  }
}
