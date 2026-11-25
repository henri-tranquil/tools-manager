import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { UNIT_PAIRS, UnitPairId } from './unit-pairs';

/** Deux champs bidirectionnels : on tape dans l'un, l'autre suit. */
@Component({
  selector: 'app-convertisseur',
  templateUrl: './convertisseur.html',
  styleUrl: './convertisseur.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Convertisseur {
  readonly pairId = input.required<UnitPairId>();

  protected readonly pair = computed(() => UNIT_PAIRS[this.pairId()]);
  protected readonly valueA = linkedSignal(() => formatDecimal(this.pair().defaultValue));
  protected readonly valueB = linkedSignal(() =>
    formatDecimal(this.pair().toB(this.pair().defaultValue)),
  );

  protected onA(raw: string): void {
    this.valueA.set(raw);
    const value = parseDecimal(raw);
    this.valueB.set(Number.isNaN(value) ? '' : formatDecimal(this.pair().toB(value)));
  }

  protected onB(raw: string): void {
    this.valueB.set(raw);
    const value = parseDecimal(raw);
    this.valueA.set(Number.isNaN(value) ? '' : formatDecimal(this.pair().toA(value)));
  }
}
