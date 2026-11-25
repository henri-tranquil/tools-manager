import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal } from '../../../shared/format';
import { contrastRatio, parseColor, rgbToHex, wcagLevels } from '../color';

@Component({
  selector: 'app-contraste',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .preview {
      grid-column: 1 / -1;
      padding: 22px;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .preview__big {
      font-family: var(--font-display);
      font-size: 28px;
    }
    .badge {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 12px;
      font-weight: 700;
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <div class="label">
          <label for="contraste-texte">Couleur du texte</label>
          <div class="swatch-input">
            <input
              type="color"
              aria-label="Choisir la couleur du texte"
              [value]="fgHex()"
              (input)="fg.set($any($event.target).value)"
            />
            <input
              id="contraste-texte"
              #f
              class="field field--compact"
              type="text"
              [value]="fg()"
              (input)="fg.set(f.value)"
            />
          </div>
        </div>
        <div class="label">
          <label for="contraste-fond">Couleur du fond</label>
          <div class="swatch-input">
            <input
              type="color"
              aria-label="Choisir la couleur du fond"
              [value]="bgHex()"
              (input)="bg.set($any($event.target).value)"
            />
            <input
              id="contraste-fond"
              #b
              class="field field--compact"
              type="text"
              [value]="bg()"
              (input)="bg.set(b.value)"
            />
          </div>
        </div>
        <button type="button" class="btn btn--small lift" (click)="swap()">Inverser ⇅</button>
        <p class="note">Formats acceptés : #rrggbb, #rgb, rgb(…), hsl(…).</p>
      </div>

      <div class="tool-layout__results">
        @if (ratio(); as r) {
          <div class="preview" [style.color]="fgHex()" [style.background]="bgHex()">
            <span class="preview__big">Texte de démonstration</span>
            <span>Le vif zéphyr jubile sur les kumquats du clown gracieux.</span>
          </div>
          <div class="tile tile--wide tile--yellow">
            <span class="kicker">Ratio de contraste</span>
            <span class="tile__value tile__value--big">{{ r.text }} : 1</span>
          </div>
          @for (level of r.levels; track level.label) {
            <div class="badge" [style.background]="level.ok ? 'var(--mint)' : 'var(--coral)'">
              <span>{{ level.label }}</span>
              <span>{{ level.ok ? 'Réussi ✓' : 'Échec ✕' }}</span>
            </div>
          }
        } @else {
          <p class="tile tile--wide tile--coral">Couleur invalide : vérifiez les deux saisies.</p>
        }
      </div>
    </div>
  `,
})
export class Contraste {
  protected readonly fg = signal('#111111');
  protected readonly bg = signal('#FFD23F');

  private readonly fgRgb = computed(() => parseColor(this.fg()));
  private readonly bgRgb = computed(() => parseColor(this.bg()));
  protected readonly fgHex = computed(() => {
    const c = this.fgRgb();
    return c ? rgbToHex(c) : '#000000';
  });
  protected readonly bgHex = computed(() => {
    const c = this.bgRgb();
    return c ? rgbToHex(c) : '#FFFFFF';
  });

  protected readonly ratio = computed(() => {
    const a = this.fgRgb();
    const b = this.bgRgb();
    if (!a || !b) {
      return null;
    }
    const value = contrastRatio(a, b);
    const levels = wcagLevels(value);
    return {
      text: formatDecimal(Math.floor(value * 100) / 100, 2),
      levels: [
        { label: 'AA · texte courant (4,5:1)', ok: levels.aaNormal },
        { label: 'AA · grand texte (3:1)', ok: levels.aaLarge },
        { label: 'AAA · texte courant (7:1)', ok: levels.aaaNormal },
        { label: 'AAA · grand texte (4,5:1)', ok: levels.aaaLarge },
      ],
    };
  });

  protected swap(): void {
    const fg = this.fg();
    this.fg.set(this.bg());
    this.bg.set(fg);
  }
}
