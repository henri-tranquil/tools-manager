import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { goldenSplit, PHI } from '../workshop-math';

@Component({
  selector: 'app-nombre-or',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .bar {
      grid-column: 1 / -1;
      display: flex;
      height: 56px;
      border: var(--bw) solid var(--ink);
      border-radius: 10px;
      overflow: hidden;
    }
    .bar span {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 13px;
    }
    .bar span:first-child {
      flex: 1.618;
      background: var(--peach);
      border-right: var(--bw-thin) solid var(--ink);
    }
    .bar span:last-child {
      flex: 1;
      background: var(--yellow-soft);
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Longueur totale
          <input
            #l
            class="field"
            type="text"
            inputmode="decimal"
            [value]="length()"
            (input)="length.set(l.value)"
          />
        </label>
        <p class="note">
          φ = {{ phi }}. Le grand segment est au petit ce que le tout est au grand segment. L'unité
          est libre (mm, cm…).
        </p>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        @if (split(); as s) {
          <div
            class="bar"
            role="img"
            [attr.aria-label]="'Grand segment ' + s.major + ', petit segment ' + s.minor"
          >
            <span>{{ s.major }}</span><span>{{ s.minor }}</span>
          </div>
          <div class="tile tile--peach">
            <span class="kicker">Grand segment (L ÷ φ)</span>
            <span class="tile__value">{{ s.major }}</span>
          </div>
          <div class="tile tile--yellow">
            <span class="kicker">Petit segment</span>
            <span class="tile__value">{{ s.minor }}</span>
          </div>
          <div class="tile tile--wide">
            <span class="kicker"
              >Rectangle d'or : pour une largeur de {{ length() }}, la hauteur vaut</span
            >
            <span class="tile__value">{{ s.major }} ou {{ s.extended }}</span>
          </div>
        } @else {
          <p class="tile tile--wide tile--coral">Saisissez une longueur positive.</p>
        }
      </div>
    </div>
  `,
})
export class NombreOr {
  protected readonly phi = formatDecimal(PHI, 6);
  protected readonly length = signal('60');

  protected readonly split = computed(() => {
    const length = parseDecimal(this.length());
    if (!(length > 0)) {
      return null;
    }
    const s = goldenSplit(length);
    return {
      major: formatDecimal(s.major, 2),
      minor: formatDecimal(s.minor, 2),
      extended: formatDecimal(s.extended, 2),
    };
  });
}
