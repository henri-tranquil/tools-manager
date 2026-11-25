import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { formatDecimal } from '../../../shared/format';

type Status = 'idle' | 'active' | 'denied' | 'unsupported';

/** iOS exige une permission explicite, demandée à la suite d'un geste de l'utilisateur. */
interface OrientationEventWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const MAX_TILT = 20;

@Component({
  selector: 'app-niveau',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .level {
      position: relative;
      width: min(280px, 100%);
      aspect-ratio: 1;
      margin: 0 auto;
      border: var(--bw) solid var(--ink);
      border-radius: 50%;
      background: var(--mint);
      box-shadow: var(--shadow);
    }
    .level::before,
    .level::after {
      content: '';
      position: absolute;
      background: var(--ink);
    }
    .level::before {
      left: 50%;
      top: 10%;
      bottom: 10%;
      width: 2px;
      transform: translateX(-50%);
    }
    .level::after {
      top: 50%;
      left: 10%;
      right: 10%;
      height: 2px;
      transform: translateY(-50%);
    }
    .ring {
      position: absolute;
      inset: 38%;
      border: 3px solid var(--ink);
      border-radius: 50%;
    }
    .bubble {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 22%;
      aspect-ratio: 1;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 50%;
      background: var(--yellow);
      transition: transform 0.08s linear;
      z-index: 1;
    }
    .bubble--level {
      background: var(--paper);
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        @switch (status()) {
          @case ('idle') {
            <p>Posez votre téléphone à plat (ou sur la tranche) sur la surface à contrôler.</p>
            <button type="button" class="btn btn--coral lift" (click)="start()">
              Activer le capteur
            </button>
          }
          @case ('unsupported') {
            <p class="tile tile--coral">
              Pas de capteur d'inclinaison ici : ouvrez cette page sur un téléphone ou une tablette.
            </p>
          }
          @case ('denied') {
            <p class="tile tile--coral">
              L'accès au capteur a été refusé. Autorisez-le dans les réglages du navigateur puis
              réessayez.
            </p>
          }
          @case ('active') {
            <button type="button" class="btn lift" (click)="calibrate()">Mettre à zéro ici</button>
            <p class="note">Le zéro sert à compenser une coque ou un appareil légèrement bombé.</p>
          }
        }
        <p class="note">Les données du capteur restent sur l'appareil.</p>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        <div class="tile tile--wide tile--cream">
          <div
            class="level"
            role="img"
            [attr.aria-label]="'Inclinaison : ' + reading().x + ' et ' + reading().y"
          >
            <span class="ring"></span>
            <span
              class="bubble"
              [class.bubble--level]="reading().level"
              [style.transform]="reading().transform"
            ></span>
          </div>
        </div>
        <div class="tile" [class.tile--mint]="reading().level">
          <span class="kicker">Avant / arrière</span>
          <span class="tile__value">{{ reading().y }}</span>
        </div>
        <div class="tile" [class.tile--mint]="reading().level">
          <span class="kicker">Gauche / droite</span>
          <span class="tile__value">{{ reading().x }}</span>
        </div>
      </div>
    </div>
  `,
})
export class Niveau {
  protected readonly status = signal<Status>(
    typeof DeviceOrientationEvent === 'undefined' ? 'unsupported' : 'idle',
  );
  private readonly beta = signal(0);
  private readonly gamma = signal(0);
  private readonly offset = signal({ beta: 0, gamma: 0 });
  private hasReading = false;

  protected readonly reading = computed(() => {
    const y = this.beta() - this.offset().beta;
    const x = this.gamma() - this.offset().gamma;
    const clamp = (v: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, v));
    // La bulle monte du côté le plus haut, à l'inverse de l'inclinaison.
    const tx = (-clamp(x) / MAX_TILT) * 150;
    const ty = (-clamp(y) / MAX_TILT) * 150;
    return {
      x: `${formatDecimal(x, 1)}°`,
      y: `${formatDecimal(y, 1)}°`,
      level: Math.abs(x) < 0.5 && Math.abs(y) < 0.5,
      transform: `translate(calc(-50% + ${tx}%), calc(-50% + ${ty}%))`,
    };
  });

  private readonly onOrientation = (event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null) {
      return;
    }
    this.hasReading = true;
    this.beta.set(event.beta);
    this.gamma.set(event.gamma);
  };

  constructor() {
    inject(DestroyRef).onDestroy(() =>
      window.removeEventListener('deviceorientation', this.onOrientation),
    );
  }

  protected async start(): Promise<void> {
    const ctor = DeviceOrientationEvent as unknown as OrientationEventWithPermission;
    if (ctor.requestPermission) {
      try {
        if ((await ctor.requestPermission()) !== 'granted') {
          this.status.set('denied');
          return;
        }
      } catch {
        this.status.set('denied');
        return;
      }
    }
    window.addEventListener('deviceorientation', this.onOrientation);
    this.status.set('active');
    // Sur ordinateur, l'événement existe mais n'envoie jamais de mesure.
    setTimeout(() => {
      if (!this.hasReading) {
        window.removeEventListener('deviceorientation', this.onOrientation);
        this.status.set('unsupported');
      }
    }, 1500);
  }

  protected calibrate(): void {
    this.offset.set({ beta: this.beta(), gamma: this.gamma() });
  }
}
