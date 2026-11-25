import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { scaleRecipe } from '../kitchen-math';

const EXAMPLE = `250 g de farine
3 œufs
1/2 litre de lait
50 g de beurre fondu
1 pincée de sel`;

@Component({
  selector: 'app-portions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .lines {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .lines li {
      padding: 6px 0;
      border-bottom: 2px dashed var(--ink);
      font-weight: 500;
    }
    .lines li:last-child {
      border-bottom: 0;
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <div class="row">
          <label class="label">
            Recette pour
            <input
              #f
              class="field"
              type="text"
              inputmode="decimal"
              [value]="from()"
              (input)="from.set(f.value)"
            />
          </label>
          <label class="label">
            Je veux pour
            <input
              #t
              class="field field--mint"
              type="text"
              inputmode="decimal"
              [value]="to()"
              (input)="to.set(t.value)"
            />
          </label>
        </div>
        <label class="label">
          Ingrédients (un par ligne, quantité en premier)
          <textarea
            #r
            class="field field--text"
            rows="7"
            [value]="recipe()"
            (input)="recipe.set(r.value)"
          ></textarea>
        </label>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        <div class="tile tile--yellow">
          <span class="kicker">Coefficient</span>
          <span class="tile__value">× {{ factorText() }}</span>
        </div>
        <div class="tile tile--wide">
          <span class="kicker">Pour {{ to() || '—' }} personne(s)</span>
          <ul class="lines">
            @for (line of scaled(); track $index) {
              @if (line.trim()) {
                <li>{{ line }}</li>
              }
            }
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class Portions {
  protected readonly from = signal('4');
  protected readonly to = signal('6');
  protected readonly recipe = signal(EXAMPLE);

  private readonly factor = computed(() => parseDecimal(this.to()) / parseDecimal(this.from()));
  protected readonly factorText = computed(() => {
    const f = this.factor();
    return Number.isFinite(f) && f > 0 ? formatDecimal(f, 2) : '—';
  });
  protected readonly scaled = computed(() => {
    const f = this.factor();
    return Number.isFinite(f) && f > 0 ? scaleRecipe(this.recipe(), f) : this.recipe().split('\n');
  });
}
