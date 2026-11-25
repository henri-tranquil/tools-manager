import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { formatHms, formatMinSec, parseMinSec } from '../../../shared/time';
import { paceToSpeed, RACE_DISTANCES, speedToPace } from '../sport-math';

@Component({
  selector: 'app-allure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Allure (min:s / km)
          <input
            #p
            class="field"
            type="text"
            autocomplete="off"
            [value]="pace()"
            (input)="onPace(p.value)"
          />
        </label>
        <label class="label">
          Vitesse (km/h)
          <input
            #s
            class="field field--mint"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            [value]="speed()"
            (input)="onSpeed(s.value)"
          />
        </label>
        <p class="note">
          Tapez dans l'un des deux champs, l'autre suit. Allure au format 5:30 ou 5'30.
        </p>
      </div>
      <div class="tool-layout__results">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Distance</th>
                <th scope="col" class="num">Temps de passage</th>
              </tr>
            </thead>
            <tbody>
              @for (row of splits(); track row.label) {
                <tr>
                  <th scope="row">{{ row.label }}</th>
                  <td class="num">{{ row.time }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class Allure {
  protected readonly pace = signal('5:30');
  protected readonly speed = signal(formatDecimal(paceToSpeed(330), 2));

  protected readonly splits = computed(() => {
    const seconds = parseMinSec(this.pace());
    return RACE_DISTANCES.map((d) => ({ label: d.label, time: formatHms(seconds * d.km) }));
  });

  protected onPace(raw: string): void {
    this.pace.set(raw);
    const seconds = parseMinSec(raw);
    this.speed.set(seconds > 0 ? formatDecimal(paceToSpeed(seconds), 2) : '');
  }

  protected onSpeed(raw: string): void {
    this.speed.set(raw);
    const kmh = parseDecimal(raw);
    this.pace.set(kmh > 0 ? formatMinSec(speedToPace(kmh)) : '');
  }
}
