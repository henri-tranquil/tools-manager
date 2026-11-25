import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { ruleOfThree } from '../daily-math';

@Component({
  selector: 'app-regle-de-trois',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      gap: 12px 16px;
      align-items: end;
    }
    .arrow {
      font-family: var(--font-display);
      font-size: 28px;
      padding-bottom: 12px;
    }
    .x {
      display: flex;
      align-items: center;
      min-height: 58px;
      padding: 10px 14px;
      border: var(--bw) solid var(--ink);
      border-radius: 10px;
      background: var(--mint);
      font-family: var(--font-display);
      font-size: 28px;
      overflow-wrap: anywhere;
    }
  `,
  template: `
    <div class="stack">
      <div class="grid">
        <label class="label">
          Si
          <input
            #ia
            class="field"
            type="text"
            inputmode="decimal"
            [value]="a()"
            (input)="a.set(ia.value)"
          />
        </label>
        <span class="arrow" aria-hidden="true">→</span>
        <label class="label">
          donne
          <input
            #ib
            class="field"
            type="text"
            inputmode="decimal"
            [value]="b()"
            (input)="b.set(ib.value)"
          />
        </label>
        <label class="label">
          alors
          <input
            #ic
            class="field"
            type="text"
            inputmode="decimal"
            [value]="c()"
            (input)="c.set(ic.value)"
          />
        </label>
        <span class="arrow" aria-hidden="true">→</span>
        <div class="label">
          <span>donne</span>
          <output class="x" aria-live="polite">{{ x() }}</output>
        </div>
      </div>
      <p class="note">
        Exemple : si 4 personnes mangent 300 g, alors 6 personnes mangent 450 g. Calcul : x = donne
        × alors ÷ si.
      </p>
    </div>
  `,
})
export class RegleDeTrois {
  protected readonly a = signal('4');
  protected readonly b = signal('300');
  protected readonly c = signal('6');

  protected readonly x = computed(() => {
    const [a, b, c] = [this.a(), this.b(), this.c()].map(parseDecimal);
    const value = ruleOfThree(a, b, c);
    return a !== 0 && Number.isFinite(value) ? formatDecimal(value, 4) : '—';
  });
}
