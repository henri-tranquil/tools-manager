import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { parseDecimal } from '../../../shared/format';
import { karvonenZones, tanakaMaxHr } from '../sport-math';

const ZONE_COLORS = [
  'var(--sky)',
  'var(--mint)',
  'var(--yellow-soft)',
  'var(--peach)',
  'var(--coral)',
];

@Component({
  selector: 'app-zones-cardio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .zone {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) auto;
      gap: 14px;
      align-items: center;
      padding: 12px 16px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 12px;
    }
    .zone__n {
      font-family: var(--font-display);
      font-size: 28px;
    }
    .zone__label {
      font-weight: 700;
    }
    .zone__bpm {
      font-family: var(--font-mono);
      font-weight: 700;
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          FC max (bpm)
          <input
            #m
            class="field"
            type="text"
            inputmode="numeric"
            [value]="maxHr()"
            (input)="maxHr.set(m.value)"
          />
        </label>
        <label class="label">
          FC de repos (bpm)
          <input
            #r
            class="field"
            type="text"
            inputmode="numeric"
            [value]="restHr()"
            (input)="restHr.set(r.value)"
          />
        </label>
        <div class="row">
          <label class="label">
            Âge (pour estimer la FC max)
            <input
              #a
              class="field field--compact"
              type="text"
              inputmode="numeric"
              [value]="age()"
              (input)="age.set(a.value)"
            />
          </label>
          <button type="button" class="btn btn--small lift" (click)="estimate()">Estimer</button>
        </div>
        <p class="note">
          Méthode de Karvonen. Une FC max mesurée sur le terrain est bien plus fiable que
          l'estimation par l'âge. Rien n'est enregistré.
        </p>
      </div>
      <div class="tool-layout__results">
        @for (zone of zones(); track zone.zone) {
          <div class="zone" [style.background]="colors[zone.zone - 1]">
            <span class="zone__n">Z{{ zone.zone }}</span>
            <span class="zone__label">{{ zone.label }}</span>
            <span class="zone__bpm">{{ zone.fromBpm }}–{{ zone.toBpm }} bpm</span>
          </div>
        } @empty {
          <p class="tile tile--wide tile--coral">
            La FC max doit être supérieure à la FC de repos.
          </p>
        }
      </div>
    </div>
  `,
})
export class ZonesCardio {
  protected readonly colors = ZONE_COLORS;
  // Valeurs d'exemple génériques.
  protected readonly maxHr = signal('190');
  protected readonly restHr = signal('55');
  protected readonly age = signal('');

  protected readonly zones = computed(() => {
    const max = parseDecimal(this.maxHr());
    const rest = parseDecimal(this.restHr());
    return max > 0 && rest > 0 && max > rest ? karvonenZones(max, rest) : [];
  });

  protected estimate(): void {
    const age = parseDecimal(this.age());
    if (age > 0 && age < 120) {
      this.maxHr.set(String(tanakaMaxHr(age)));
    }
  }
}
