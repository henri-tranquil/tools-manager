import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { interiorAngle, miterAngle, rectangleFrame } from '../workshop-math';

@Component({
  selector: 'app-angle-onglet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .shape {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      padding: 12px;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius);
      background: var(--cream);
    }
    .shape svg {
      width: 160px;
      height: 160px;
    }
  `,
  template: `
    <div class="stack">
      <div class="tool-layout">
        <div class="tool-layout__inputs">
          <label class="label">
            Nombre de côtés du cadre
            <input
              #n
              class="field"
              type="text"
              inputmode="numeric"
              [value]="sides()"
              (input)="sides.set(n.value)"
            />
          </label>
          <p class="note">Réglage de la scie à onglet : 0° correspond à une coupe droite.</p>
        </div>
        <div class="tool-layout__results" aria-live="polite">
          <div class="tile tile--peach tile--wide">
            <span class="kicker">Angle de coupe</span>
            <span class="tile__value tile__value--big">{{ angles().miter }}</span>
          </div>
          <div class="tile">
            <span class="kicker">Angle intérieur</span>
            <span class="tile__value">{{ angles().interior }}</span>
          </div>
          @if (angles().points) {
            <div class="shape" aria-hidden="true">
              <svg viewBox="-55 -55 110 110">
                <polygon
                  [attr.points]="angles().points"
                  fill="#FFB38A"
                  stroke="#111"
                  stroke-width="5"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          }
        </div>
      </div>

      <div class="tool-layout">
        <div class="tool-layout__inputs">
          <p class="kicker">Cadre rectangulaire</p>
          <div class="row">
            <label class="label">
              Largeur intérieure (cm)
              <input
                #w
                class="field field--compact"
                type="text"
                inputmode="decimal"
                [value]="innerW()"
                (input)="innerW.set(w.value)"
              />
            </label>
            <label class="label">
              Hauteur intérieure (cm)
              <input
                #h
                class="field field--compact"
                type="text"
                inputmode="decimal"
                [value]="innerH()"
                (input)="innerH.set(h.value)"
              />
            </label>
          </div>
          <label class="label">
            Largeur de la baguette (cm)
            <input
              #m
              class="field field--compact"
              type="text"
              inputmode="decimal"
              [value]="molding()"
              (input)="molding.set(m.value)"
            />
          </label>
        </div>
        <div class="tool-layout__results" aria-live="polite">
          @if (frame(); as f) {
            <div class="tile">
              <span class="kicker">2 grands montants</span>
              <span class="tile__value">{{ f.long }}</span>
            </div>
            <div class="tile">
              <span class="kicker">2 petits montants</span>
              <span class="tile__value">{{ f.short }}</span>
            </div>
            <div class="tile tile--wide tile--yellow">
              <span class="kicker">Baguette à prévoir (chutes comprises)</span>
              <span class="tile__value">{{ f.total }}</span>
            </div>
          } @else {
            <p class="tile tile--wide tile--coral">Saisissez des dimensions positives.</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class AngleOnglet {
  protected readonly sides = signal('4');
  protected readonly innerW = signal('30');
  protected readonly innerH = signal('40');
  protected readonly molding = signal('3');

  protected readonly angles = computed(() => {
    const n = Number(this.sides());
    if (!Number.isInteger(n) || n < 3 || n > 64) {
      return { miter: '—', interior: '—', points: '' };
    }
    const points = Array.from({ length: n }, (_, i) => {
      const a = (2 * Math.PI * i) / n - Math.PI / 2;
      return `${(48 * Math.cos(a)).toFixed(2)},${(48 * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
    return {
      miter: `${formatDecimal(miterAngle(n), 2)}°`,
      interior: `${formatDecimal(interiorAngle(n), 2)}°`,
      points,
    };
  });

  protected readonly frame = computed(() => {
    const [w, h, m] = [this.innerW(), this.innerH(), this.molding()].map(parseDecimal);
    if (!(w > 0 && h > 0 && m >= 0)) {
      return null;
    }
    const f = rectangleFrame(w, h, m);
    const cm = (v: number) => `${formatDecimal(v, 1)} cm`;
    return { long: cm(f.long), short: cm(f.short), total: cm(f.total) };
  });
}
