import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal } from '../../../shared/format';
import { parseHoursMinutes } from '../../../shared/time';
import { fuelingPlan, Heat, HEAT_LABELS } from '../sport-math';

@Component({
  selector: 'app-ravitaillement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Durée de l'effort (h:mm)
          <input
            #d
            class="field"
            type="text"
            autocomplete="off"
            [value]="duration()"
            (input)="duration.set(d.value)"
          />
        </label>
        <div class="label">
          <span id="ravito-chaleur">Conditions</span>
          <div class="seg" role="group" aria-labelledby="ravito-chaleur">
            @for (h of heats; track h.id) {
              <button type="button" [attr.aria-pressed]="heat() === h.id" (click)="heat.set(h.id)">
                {{ h.label }}
              </button>
            }
          </div>
        </div>
        <p class="note">
          Repères généraux pour un effort d'endurance. Les besoins varient beaucoup d'une personne à
          l'autre : testez à l'entraînement.
        </p>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        @if (plan(); as p) {
          <div class="tile tile--sky">
            <span class="kicker">Eau</span>
            <span class="tile__value">{{ p.water }}</span>
            <span class="note">{{ p.waterPerHour }}</span>
          </div>
          <div class="tile tile--yellow">
            <span class="kicker">Glucides</span>
            <span class="tile__value">{{ p.carbs }}</span>
            <span class="note">{{ p.carbsPerHour }}</span>
          </div>
          <div class="tile tile--peach">
            <span class="kicker">Sodium</span>
            <span class="tile__value">{{ p.sodium }}</span>
            <span class="note">{{ p.sodiumPerHour }}</span>
          </div>
          <div class="tile tile--wide tile--mint">
            <span class="kicker">En pratique</span>
            <span>{{ p.practical }}</span>
          </div>
        } @else {
          <p class="tile tile--wide tile--coral">Durée invalide. Exemples : 2:30, 2h30 ou 2,5.</p>
        }
      </div>
    </div>
  `,
})
export class Ravitaillement {
  protected readonly heats = (Object.keys(HEAT_LABELS) as Heat[]).map((id) => ({
    id,
    label: HEAT_LABELS[id],
  }));
  protected readonly duration = signal('3:00');
  protected readonly heat = signal<Heat>('tempere');

  protected readonly plan = computed(() => {
    const hours = parseHoursMinutes(this.duration()) / 3600;
    if (!(hours > 0)) {
      return null;
    }
    const plan = fuelingPlan(hours, this.heat());
    const gels = Math.ceil(plan.carbsMinG / 25);
    const flasks = Math.ceil(plan.waterLiters / 0.5);
    return {
      water: `${formatDecimal(plan.waterLiters, 1)} L`,
      waterPerHour: `${plan.perHour.waterMl} ml/h`,
      carbs:
        plan.carbsMaxG === 0
          ? '0 g'
          : `${Math.round(plan.carbsMinG)}–${Math.round(plan.carbsMaxG)} g`,
      carbsPerHour: `${plan.perHour.carbs[0]}–${plan.perHour.carbs[1]} g/h`,
      sodium: `${formatDecimal(plan.sodiumMg / 1000, 1)} g`,
      sodiumPerHour: `${plan.perHour.sodiumMg} mg/h`,
      practical:
        hours < 1
          ? "Sous l'heure, de l'eau suffit généralement."
          : `Environ ${flasks} flasque${flasks > 1 ? 's' : ''} de 500 ml et au moins ${gels} gel${gels > 1 ? 's' : ''} de 25 g de glucides (ou l'équivalent en barres, boisson d'effort…).`,
    };
  });
}
