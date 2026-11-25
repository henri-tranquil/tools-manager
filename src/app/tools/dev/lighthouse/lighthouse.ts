import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import {
  computeLighthouse,
  LIGHTHOUSE_EXAMPLE,
  LIGHTHOUSE_METRICS,
  LighthouseMetric,
  LighthouseMetricId,
  scoreBand,
} from './lighthouse-score';

const VERDICTS = { good: 'Rapide', average: 'À améliorer', poor: 'Lent' } as const;

@Component({
  selector: 'app-lighthouse',
  templateUrl: './lighthouse.html',
  styleUrl: './lighthouse.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lighthouse {
  protected readonly metrics = LIGHTHOUSE_METRICS;

  protected readonly inputs = signal<Record<LighthouseMetricId, string>>(
    Object.fromEntries(
      LIGHTHOUSE_METRICS.map((m) => [m.id, formatDecimal(LIGHTHOUSE_EXAMPLE[m.id])]),
    ) as Record<LighthouseMetricId, string>,
  );

  protected readonly result = computed(() => {
    const raw = this.inputs();
    const values = Object.fromEntries(
      LIGHTHOUSE_METRICS.map((m) => [m.id, parseDecimal(raw[m.id])]),
    ) as Record<LighthouseMetricId, number>;
    return computeLighthouse(values);
  });

  protected readonly band = computed(() => scoreBand(this.result().score));
  protected readonly verdict = computed(() => VERDICTS[this.band()]);

  protected bandOf(metric: LighthouseMetric): string {
    return scoreBand(this.result().metrics[metric.id]);
  }

  protected update(id: LighthouseMetricId, raw: string): void {
    this.inputs.update((current) => ({ ...current, [id]: raw }));
  }
}
