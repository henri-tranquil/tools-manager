import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { CUP_ML, INGREDIENTS, MEASURES, measureToGrams } from '../kitchen-math';

@Component({
  selector: 'app-mesures',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Ingrédient
          <select #i class="field" (change)="ingredient.set(i.value)">
            @for (option of ingredients; track option.id) {
              <option [value]="option.id" [selected]="option.id === ingredient()">
                {{ option.label }}
              </option>
            }
          </select>
        </label>
        <div class="row">
          <label class="label">
            Quantité
            <input
              #q
              class="field"
              type="text"
              inputmode="decimal"
              [value]="quantity()"
              (input)="quantity.set(q.value)"
            />
          </label>
          <label class="label">
            Mesure
            <select #m class="field" (change)="measure.set(m.value)">
              @for (option of measures; track option.id) {
                <option [value]="option.id" [selected]="option.id === measure()">
                  {{ option.label }}
                </option>
              }
            </select>
          </label>
        </div>
        <p class="note">
          Valeurs usuelles pour une tasse américaine (236,6 ml) remplie à la cuillère et arasée.
          Pour la précision, rien ne vaut la balance.
        </p>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        <div class="tile tile--wide tile--yellow">
          <span class="kicker">Poids</span>
          <span class="tile__value tile__value--big">{{ result().grams }}</span>
        </div>
        <div class="tile">
          <span class="kicker">Volume</span>
          <span class="tile__value">{{ result().ml }}</span>
        </div>
        <div class="tile">
          <span class="kicker">1 tasse de cet ingrédient</span>
          <span class="tile__value">{{ result().perCup }}</span>
        </div>
      </div>
    </div>
  `,
})
export class Mesures {
  protected readonly ingredients = INGREDIENTS;
  protected readonly measures = MEASURES;
  protected readonly ingredient = signal('farine');
  protected readonly measure = signal('cup');
  protected readonly quantity = signal('1');

  protected readonly result = computed(() => {
    const ingredient = INGREDIENTS.find((i) => i.id === this.ingredient()) ?? INGREDIENTS[0];
    const measure = MEASURES.find((m) => m.id === this.measure()) ?? MEASURES[0];
    const quantity = parseDecimal(this.quantity());
    const valid = quantity >= 0;
    return {
      grams: valid
        ? `${formatDecimal(measureToGrams(quantity, measure.cups, ingredient.gramsPerCup), 0)} g`
        : '—',
      ml: valid ? `${formatDecimal(quantity * measure.cups * CUP_ML, 0)} ml` : '—',
      perCup: `${ingredient.gramsPerCup} g`,
    };
  });
}
