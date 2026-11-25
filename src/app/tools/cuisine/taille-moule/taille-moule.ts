import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { Pan, panArea, panFactor, PanShape } from '../kitchen-math';

const SHAPES: readonly { id: PanShape; label: string }[] = [
  { id: 'rond', label: 'Rond' },
  { id: 'carre', label: 'Carré' },
  { id: 'rectangle', label: 'Rectangle' },
];

interface PanForm {
  shape: PanShape;
  a: string;
  b: string;
}

@Component({
  selector: 'app-taille-moule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .pan {
      margin: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: var(--radius);
      background: var(--cream);
    }
    .pan h4 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 400;
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        @for (side of sides; track side.key) {
          @let pan = side.key === 'from' ? from() : to();
          <fieldset class="pan">
            <h4>{{ side.title }}</h4>
            <div class="seg" role="group" [attr.aria-label]="'Forme : ' + side.title">
              @for (shape of shapes; track shape.id) {
                <button
                  type="button"
                  [attr.aria-pressed]="pan.shape === shape.id"
                  (click)="patch(side.key, { shape: shape.id })"
                >
                  {{ shape.label }}
                </button>
              }
            </div>
            <div class="row">
              <label class="label">
                {{
                  pan.shape === 'rond' ? 'Diamètre' : pan.shape === 'carre' ? 'Côté' : 'Longueur'
                }}
                (cm)
                <input
                  #a
                  class="field field--compact"
                  type="text"
                  inputmode="decimal"
                  [value]="pan.a"
                  (input)="patch(side.key, { a: a.value })"
                />
              </label>
              @if (pan.shape === 'rectangle') {
                <label class="label">
                  Largeur (cm)
                  <input
                    #b
                    class="field field--compact"
                    type="text"
                    inputmode="decimal"
                    [value]="pan.b"
                    (input)="patch(side.key, { b: b.value })"
                  />
                </label>
              }
            </div>
          </fieldset>
        }
      </div>
      <div class="tool-layout__results" aria-live="polite">
        <div class="tile tile--wide tile--yellow">
          <span class="kicker">Multipliez les quantités par</span>
          <span class="tile__value tile__value--big">{{ result().factor }}</span>
        </div>
        <div class="tile">
          <span class="kicker">Surface du moule de la recette</span>
          <span class="tile__value">{{ result().fromArea }}</span>
        </div>
        <div class="tile">
          <span class="kicker">Surface de votre moule</span>
          <span class="tile__value">{{ result().toArea }}</span>
        </div>
        <p class="note" style="grid-column: 1 / -1">
          À hauteur de pâte égale. Ajustez le temps de cuisson si l'épaisseur change.
        </p>
      </div>
    </div>
  `,
})
export class TailleMoule {
  protected readonly shapes = SHAPES;
  protected readonly sides = [
    { key: 'from' as const, title: 'Moule de la recette' },
    { key: 'to' as const, title: 'Mon moule' },
  ];
  protected readonly from = signal<PanForm>({ shape: 'rond', a: '24', b: '' });
  protected readonly to = signal<PanForm>({ shape: 'carre', a: '20', b: '' });

  protected readonly result = computed(() => {
    const from = this.toPan(this.from());
    const to = this.toPan(this.to());
    const area = (p: Pan | null) => (p ? `${formatDecimal(panArea(p), 0)} cm²` : '—');
    return {
      factor: from && to ? `× ${formatDecimal(panFactor(from, to), 2)}` : '—',
      fromArea: area(from),
      toArea: area(to),
    };
  });

  protected patch(key: 'from' | 'to', change: Partial<PanForm>): void {
    (key === 'from' ? this.from : this.to).update((pan) => ({ ...pan, ...change }));
  }

  private toPan(form: PanForm): Pan | null {
    const a = parseDecimal(form.a);
    const b = form.shape === 'rectangle' ? parseDecimal(form.b) : 0;
    const valid = a > 0 && (form.shape !== 'rectangle' || b > 0);
    return valid ? { shape: form.shape, a, b } : null;
  }
}
