import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  contrastRatio,
  formatHsl,
  formatRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  tintsAndShades,
} from '../color';

@Component({
  selector: 'app-couleurs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .preview {
      grid-column: 1 / -1;
      height: 120px;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      display: flex;
      align-items: flex-end;
      padding: 14px;
      font-family: var(--font-display);
      font-size: 24px;
    }
    .format {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .format code {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 16px;
      overflow-wrap: anywhere;
    }
    .palette {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(9, minmax(0, 1fr));
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .palette button {
      height: 64px;
      border: 0;
      border-right: 2px solid var(--ink);
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 10px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 6px;
    }
    .palette button:last-child {
      border-right: 0;
    }
    @media (max-width: 560px) {
      .palette button {
        font-size: 0;
      }
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <div class="label">
          <label for="couleur-saisie">Couleur (HEX, RGB ou HSL)</label>
          <div class="swatch-input">
            <input
              type="color"
              aria-label="Choisir une couleur"
              [value]="hex()"
              (input)="value.set($any($event.target).value)"
            />
            <input
              id="couleur-saisie"
              #c
              class="field field--compact"
              type="text"
              [value]="value()"
              (input)="value.set(c.value)"
            />
          </div>
        </div>
        @if (copied()) {
          <p class="note" aria-live="polite">Copié : {{ copied() }}</p>
        } @else {
          <p class="note">Cliquez sur une valeur ou une nuance pour la copier.</p>
        }
      </div>

      <div class="tool-layout__results">
        @if (color(); as c) {
          <div class="preview" [style.background]="c.hex" [style.color]="c.textColor">
            {{ c.hex }}
          </div>
          @for (f of c.formats; track f.label) {
            <button type="button" class="tile format lift" (click)="copy(f.value)">
              <span class="kicker">{{ f.label }}</span>
              <code>{{ f.value }}</code>
            </button>
          }
          <div class="palette" role="group" aria-label="Teintes et nuances">
            @for (swatch of c.palette; track $index) {
              <button
                type="button"
                [style.background]="swatch.hex"
                [style.color]="swatch.textColor"
                [attr.aria-label]="'Copier ' + swatch.hex"
                (click)="copy(swatch.hex)"
              >
                {{ swatch.hex }}
              </button>
            }
          </div>
        } @else {
          <p class="tile tile--wide tile--coral">
            Couleur invalide. Exemples : #FF6B6B, rgb(255 107 107), hsl(0 100% 71%).
          </p>
        }
      </div>
    </div>
  `,
})
export class Couleurs {
  protected readonly value = signal('#FF6B6B');
  protected readonly copied = signal('');

  private readonly rgb = computed(() => parseColor(this.value()));
  protected readonly hex = computed(() => {
    const c = this.rgb();
    return c ? rgbToHex(c) : '#000000';
  });

  protected readonly color = computed(() => {
    const rgb = this.rgb();
    if (!rgb) {
      return null;
    }
    const black = { r: 17, g: 17, b: 17 };
    const white = { r: 255, g: 255, b: 255 };
    const readableOn = (c: typeof rgb) =>
      contrastRatio(c, black) >= contrastRatio(c, white) ? '#111' : '#fff';
    return {
      hex: rgbToHex(rgb),
      textColor: readableOn(rgb),
      formats: [
        { label: 'HEX', value: rgbToHex(rgb) },
        { label: 'RGB', value: formatRgb(rgb) },
        { label: 'HSL', value: formatHsl(rgbToHsl(rgb)) },
      ],
      palette: tintsAndShades(rgb).map((c) => ({ hex: rgbToHex(c), textColor: readableOn(c) })),
    };
  });

  protected async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(text);
    } catch {
      this.copied.set('');
    }
  }
}
