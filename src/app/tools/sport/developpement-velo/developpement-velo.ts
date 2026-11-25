import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { development, speedAtCadence, WHEELS } from '../sport-math';

const CADENCES = [60, 70, 80, 90, 100, 110];

@Component({
  selector: 'app-developpement-velo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <div class="row">
          <label class="label">
            Plateau (dents)
            <input
              #c
              class="field"
              type="text"
              inputmode="numeric"
              [value]="chainring()"
              (input)="chainring.set(c.value)"
            />
          </label>
          <label class="label">
            Pignon (dents)
            <input
              #s
              class="field"
              type="text"
              inputmode="numeric"
              [value]="sprocket()"
              (input)="sprocket.set(s.value)"
            />
          </label>
        </div>
        <label class="label">
          Roue
          <select #w class="field" (change)="wheel.set(w.value)">
            @for (option of wheels; track option.id) {
              <option [value]="option.id" [selected]="option.id === wheel()">
                {{ option.label }} ({{ option.circumferenceMm }} mm)
              </option>
            }
          </select>
        </label>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        <div class="tile tile--wide tile--sky">
          <span class="kicker">Développement</span>
          <span class="tile__value tile__value--big"
            >{{ result().dev }} <small>m / tour</small></span
          >
        </div>
        <div class="tile">
          <span class="kicker">Braquet</span>
          <span class="tile__value">{{ result().ratio }}</span>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Cadence</th>
                <th scope="col" class="num">Vitesse</th>
              </tr>
            </thead>
            <tbody>
              @for (row of result().speeds; track row.cadence) {
                <tr>
                  <th scope="row">{{ row.cadence }} tr/min</th>
                  <td class="num">{{ row.speed }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class DeveloppementVelo {
  protected readonly wheels = WHEELS;
  protected readonly chainring = signal('50');
  protected readonly sprocket = signal('17');
  protected readonly wheel = signal(WHEELS[1].id);

  protected readonly result = computed(() => {
    const chainring = parseDecimal(this.chainring());
    const sprocket = parseDecimal(this.sprocket());
    const wheel = WHEELS.find((w) => w.id === this.wheel()) ?? WHEELS[0];
    const valid = chainring > 0 && sprocket > 0;
    const dev = valid ? development(chainring, sprocket, wheel.circumferenceMm) : Number.NaN;
    return {
      dev: valid ? formatDecimal(dev, 2) : '—',
      ratio: valid ? formatDecimal(chainring / sprocket, 2) : '—',
      speeds: CADENCES.map((cadence) => ({
        cadence,
        speed: valid ? `${formatDecimal(speedAtCadence(dev, cadence), 1)} km/h` : '—',
      })),
    };
  });
}
