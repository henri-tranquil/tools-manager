import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { bakersDough, flourForDough } from '../kitchen-math';

type Mode = 'farine' | 'pate';

@Component({
  selector: 'app-pourcentage-boulanger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <div class="seg" role="group" aria-label="Je pars de">
          <button
            type="button"
            [attr.aria-pressed]="mode() === 'farine'"
            (click)="mode.set('farine')"
          >
            Je pars de la farine
          </button>
          <button type="button" [attr.aria-pressed]="mode() === 'pate'" (click)="mode.set('pate')">
            Je veux un poids de pâte
          </button>
        </div>
        <label class="label">
          {{ mode() === 'farine' ? 'Farine (g)' : 'Poids de pâte voulu (g)' }}
          <input
            #w
            class="field"
            type="text"
            inputmode="decimal"
            [value]="weight()"
            (input)="weight.set(w.value)"
          />
        </label>
        <div class="row">
          <label class="label">
            Hydratation (%)
            <input
              #h
              class="field field--compact"
              type="text"
              inputmode="decimal"
              [value]="hydration()"
              (input)="hydration.set(h.value)"
            />
          </label>
          <label class="label">
            Sel (%)
            <input
              #s
              class="field field--compact"
              type="text"
              inputmode="decimal"
              [value]="salt()"
              (input)="salt.set(s.value)"
            />
          </label>
        </div>
        <div class="row">
          <label class="label">
            Levain (%)
            <input
              #l
              class="field field--compact"
              type="text"
              inputmode="decimal"
              [value]="starter()"
              (input)="starter.set(l.value)"
            />
          </label>
          <label class="label">
            Levure (%)
            <input
              #y
              class="field field--compact"
              type="text"
              inputmode="decimal"
              [value]="yeast()"
              (input)="yeast.set(y.value)"
            />
          </label>
        </div>
        <p class="note">
          Chaque ingrédient est exprimé en % du poids de farine. Le levain est compté à part (sa
          farine et son eau ne sont pas réintégrées).
        </p>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        @if (dough(); as d) {
          <div class="table-wrap">
            <table class="table">
              <tbody>
                @for (row of d.rows; track row.label) {
                  <tr>
                    <th scope="row">{{ row.label }}</th>
                    <td class="num">{{ row.value }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="tile tile--wide tile--yellow">
            <span class="kicker">Pâte totale</span>
            <span class="tile__value tile__value--big">{{ d.total }}</span>
          </div>
        } @else {
          <p class="tile tile--wide tile--coral">Vérifiez les valeurs saisies.</p>
        }
      </div>
    </div>
  `,
})
export class PourcentageBoulanger {
  protected readonly mode = signal<Mode>('farine');
  protected readonly weight = signal('500');
  protected readonly hydration = signal('70');
  protected readonly salt = signal('2');
  protected readonly starter = signal('20');
  protected readonly yeast = signal('0');

  protected readonly dough = computed(() => {
    const pct = {
      hydrationPct: parseDecimal(this.hydration()),
      saltPct: parseDecimal(this.salt()),
      starterPct: parseDecimal(this.starter()),
      yeastPct: parseDecimal(this.yeast()),
    };
    const weight = parseDecimal(this.weight());
    if (!(weight > 0) || Object.values(pct).some((v) => !(v >= 0))) {
      return null;
    }
    const flourG = this.mode() === 'farine' ? weight : flourForDough(weight, pct);
    const d = bakersDough({ flourG, ...pct });
    const g = (v: number) => `${formatDecimal(v, 0)} g`;
    return {
      rows: [
        { label: 'Farine', value: g(flourG) },
        { label: 'Eau', value: g(d.waterG) },
        { label: 'Sel', value: `${formatDecimal(d.saltG, 1)} g` },
        { label: 'Levain', value: g(d.starterG) },
        { label: 'Levure', value: `${formatDecimal(d.yeastG, 1)} g` },
      ],
      total: g(d.totalG),
    };
  });
}
