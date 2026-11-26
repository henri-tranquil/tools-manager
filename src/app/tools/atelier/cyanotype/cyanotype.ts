import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Alarm, cue, ring, tickLastSeconds } from '../../../shared/beep';
import { Countdown } from '../../../shared/countdown';
import { SoundToggle } from '../../../shared/sound-toggle';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { cyanotypeMix, EXPOSURES } from '../workshop-math';

const A4_CM2 = 21 * 29.7;

@Component({
  selector: 'app-cyanotype',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SoundToggle],
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
      gap: 10px;
    }
    .preset {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 10px 12px;
      text-align: left;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 10px;
      background: var(--cream);
      cursor: pointer;
      font-weight: 700;
    }
    .preset span {
      font-family: var(--font-mono);
      font-weight: 400;
      font-size: 13px;
    }
    .preset[aria-pressed='true'] {
      background: #2b4fd8;
      color: var(--paper);
      box-shadow: var(--shadow-sm);
    }
    .blue {
      background: #2b4fd8;
      color: var(--paper);
    }
  `,
  template: `
    <div class="stack">
      <div class="tool-layout">
        <div class="tool-layout__inputs">
          <p class="kicker">Préparer les solutions</p>
          <label class="label">
            Nombre de feuilles A4 à enduire
            <input
              #s
              class="field"
              type="text"
              inputmode="decimal"
              [value]="sheets()"
              (input)="sheets.set(s.value)"
            />
          </label>
          <p class="note">
            Formule classique : A = 25 g de citrate d'ammonium ferrique (vert) pour 100 ml d'eau, B
            = 10 g de ferricyanure de potassium pour 100 ml. Mélanger A et B à parts égales juste
            avant d'enduire, à l'abri des UV. Gants conseillés.
          </p>
        </div>
        <div class="tool-layout__results" aria-live="polite">
          @if (mix(); as m) {
            <div class="tile tile--wide blue">
              <span class="kicker">Mélange sensibilisant</span>
              <span class="tile__value tile__value--big">{{ m.mix }}</span>
            </div>
            <div class="tile tile--mint">
              <span class="kicker">Solution A</span>
              <span class="tile__value">{{ m.each }}</span>
              <span class="note">{{ m.gramsA }} de citrate</span>
            </div>
            <div class="tile tile--yellow">
              <span class="kicker">Solution B</span>
              <span class="tile__value">{{ m.each }}</span>
              <span class="note">{{ m.gramsB }} de ferricyanure</span>
            </div>
          }
        </div>
      </div>

      <div class="tool-layout">
        <div class="tool-layout__inputs">
          <div class="row">
            <p class="kicker">Minuteur d'exposition</p>
            <app-sound-toggle />
          </div>
          <div class="grid" role="group" aria-label="Conditions d'exposition">
            @for (preset of exposures; track preset.id) {
              <button
                type="button"
                class="preset"
                [attr.aria-pressed]="preset.id === exposure()"
                (click)="choose(preset.id, preset.minutes)"
              >
                {{ preset.label }}<span>≈ {{ preset.minutes }} min</span>
              </button>
            }
          </div>
          <p class="note">
            Repères à affiner avec une bande de test : l'image est prête quand les zones exposées
            virent au gris-bronze.
          </p>
        </div>
        <div class="tool-layout__results">
          <div class="tile tile--wide">
            <span class="clock" role="timer" aria-live="off">{{ timer.display() }}</span>
            <div class="row">
              <button type="button" class="btn btn--coral lift" (click)="toggle()">
                {{ startLabel() }}
              </button>
              <button type="button" class="btn lift" (click)="reset()">Réinitialiser</button>
            </div>
            @if (timer.remaining() === 0) {
              <p aria-live="assertive">
                <strong>Exposition terminée :</strong> rincez à l'eau claire.
              </p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class Cyanotype {
  protected readonly exposures = EXPOSURES;
  protected readonly sheets = signal('4');
  protected readonly exposure = signal(EXPOSURES[0].id);
  protected readonly alarm = new Alarm(() => ring(4, 660), 3000, 20);
  protected readonly timer = new Countdown(() => this.alarm.start(), {
    onSecond: (left) => tickLastSeconds(left, 5),
  });
  protected readonly startLabel = computed(() =>
    this.alarm.active()
      ? 'Arrêter la sonnerie'
      : this.timer.running()
        ? 'Pause'
        : this.timer.remaining() === 0
          ? 'Terminé !'
          : 'Démarrer',
  );

  protected readonly mix = computed(() => {
    const sheets = parseDecimal(this.sheets());
    if (!(sheets > 0)) {
      return null;
    }
    const m = cyanotypeMix(sheets * A4_CM2);
    return {
      mix: `${formatDecimal(m.mixMl, 1)} ml`,
      each: `${formatDecimal(m.eachMl, 1)} ml`,
      gramsA: `${formatDecimal(m.gramsA, 2)} g`,
      gramsB: `${formatDecimal(m.gramsB, 2)} g`,
    };
  });

  constructor() {
    this.timer.set(EXPOSURES[0].minutes * 60);
    inject(DestroyRef).onDestroy(() => {
      this.timer.dispose();
      this.alarm.stop();
    });
  }

  protected toggle(): void {
    if (this.alarm.active()) {
      this.alarm.stop();
      return;
    }
    if (this.timer.remaining() === 0) {
      return;
    }
    cue(this.timer.running() ? 'pause' : 'start');
    this.timer.toggle();
  }

  protected choose(id: string, minutes: number): void {
    this.alarm.stop();
    this.exposure.set(id);
    this.timer.set(minutes * 60);
  }

  protected reset(): void {
    this.alarm.stop();
    const preset = EXPOSURES.find((e) => e.id === this.exposure()) ?? EXPOSURES[0];
    this.timer.set(preset.minutes * 60);
  }
}
