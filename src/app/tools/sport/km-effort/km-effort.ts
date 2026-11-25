import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { estimateTrail, formatDuration, parsePace } from './trail-estimate';

@Component({
  selector: 'app-km-effort',
  templateUrl: './km-effort.html',
  styleUrl: './km-effort.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KmEffort {
  // Valeurs d'exemple génériques.
  protected readonly distance = signal('32');
  protected readonly elevation = signal('1800');
  protected readonly pace = signal('6:30');

  private readonly estimate = computed(() =>
    estimateTrail(
      parseDecimal(this.distance()),
      parseDecimal(this.elevation()),
      parsePace(this.pace()),
    ),
  );

  protected readonly kmEffort = computed(() => {
    const value = this.estimate().kmEffort;
    return Number.isFinite(value) ? formatDecimal(value, 1) : '—';
  });
  protected readonly duration = computed(() => formatDuration(this.estimate().durationSeconds));
  protected readonly water = computed(() => this.orDash(this.estimate().waterLiters, 1, ' L'));
  protected readonly carbs = computed(() => this.orDash(this.estimate().carbsGrams, 0, ' g'));

  private orDash(value: number, digits: number, unit: string): string {
    return Number.isFinite(value) && value > 0 ? formatDecimal(value, digits) + unit : '—';
  }
}
