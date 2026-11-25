import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { parseDecimal } from '../../../shared/format';
import { formatDuration } from '../../../shared/time';
import { hikingTime } from '../sport-math';

/** Pauses courtes conseillées : environ 15 % du temps de marche. */
const BREAK_RATIO = 0.15;

@Component({
  selector: 'app-temps-rando',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Distance (km)
          <input
            #d
            class="field"
            type="text"
            inputmode="decimal"
            [value]="distance()"
            (input)="distance.set(d.value)"
          />
        </label>
        <div class="row">
          <label class="label">
            Montée (m D+)
            <input
              #u
              class="field"
              type="text"
              inputmode="decimal"
              [value]="ascent()"
              (input)="ascent.set(u.value)"
            />
          </label>
          <label class="label">
            Descente (m D-)
            <input
              #w
              class="field"
              type="text"
              inputmode="decimal"
              [value]="descent()"
              (input)="descent.set(w.value)"
            />
          </label>
        </div>
        <p class="note">
          Norme DIN 33466 : 4 km/h à plat, 300 m/h en montée, 500 m/h en descente. On garde la plus
          longue des deux durées et on ajoute la moitié de l'autre.
        </p>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        <div class="tile tile--wide tile--sky">
          <span class="kicker">Temps de marche</span>
          <span class="tile__value tile__value--big">{{ result().total }}</span>
        </div>
        <div class="tile tile--yellow">
          <span class="kicker">Avec pauses</span>
          <span class="tile__value">{{ result().withBreaks }}</span>
        </div>
        <div class="tile">
          <span class="kicker">Composante horizontale</span>
          <span class="tile__value">{{ result().horizontal }}</span>
        </div>
        <div class="tile">
          <span class="kicker">Composante verticale</span>
          <span class="tile__value">{{ result().vertical }}</span>
        </div>
      </div>
    </div>
  `,
})
export class TempsRando {
  protected readonly distance = signal('14');
  protected readonly ascent = signal('850');
  protected readonly descent = signal('850');

  protected readonly result = computed(() => {
    const t = hikingTime(
      parseDecimal(this.distance()) || 0,
      parseDecimal(this.ascent()) || 0,
      parseDecimal(this.descent()) || 0,
    );
    return {
      total: formatDuration(t.totalHours * 3600),
      withBreaks: formatDuration(t.totalHours * (1 + BREAK_RATIO) * 3600),
      horizontal: formatDuration(t.horizontalHours * 3600),
      vertical: formatDuration(t.verticalHours * 3600),
    };
  });
}
