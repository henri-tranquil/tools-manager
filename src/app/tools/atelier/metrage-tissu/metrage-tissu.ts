import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { fabricLength, parseFabricPieces } from '../workshop-math';

@Component({
  selector: 'app-metrage-tissu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <div class="row">
          <label class="label">
            Laize du tissu (cm)
            <input
              #l
              class="field field--compact"
              type="text"
              inputmode="decimal"
              [value]="laize()"
              (input)="laize.set(l.value)"
            />
          </label>
          <label class="label">
            Marge (%)
            <input
              #m
              class="field field--compact"
              type="text"
              inputmode="decimal"
              [value]="margin()"
              (input)="margin.set(m.value)"
            />
          </label>
        </div>
        <label class="label">
          Pièces du patron (largeur × hauteur × quantité, en cm)
          <textarea
            #p
            class="field field--text"
            rows="6"
            spellcheck="false"
            [value]="pieces()"
            (input)="pieces.set(p.value)"
          ></textarea>
        </label>
        <label class="check">
          <input type="checkbox" [checked]="rotation()" (change)="rotation.set(!rotation())" />
          Autoriser la rotation des pièces
        </label>
        <p class="note">
          Décochez pour un tissu à sens ou à motif (droit-fil respecté). Coutures déjà comprises
          dans les dimensions. La marge couvre le rétrécissement au lavage et les raccords.
        </p>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        @if (result(); as r) {
          <div class="tile tile--wide tile--peach">
            <span class="kicker">À acheter</span>
            <span class="tile__value tile__value--big">{{ r.toBuy }}</span>
          </div>
          <div class="tile">
            <span class="kicker">Longueur utile</span>
            <span class="tile__value">{{ r.length }}</span>
          </div>
          <div class="tile">
            <span class="kicker">Rangées de coupe</span>
            <span class="tile__value">{{ r.rows }}</span>
          </div>
          @if (r.unfit) {
            <p class="tile tile--wide tile--coral">
              {{ r.unfit }} pièce(s) plus large(s) que la laize : à découper autrement.
            </p>
          }
        } @else {
          <p class="tile tile--wide tile--coral">
            Saisissez la laize et au moins une pièce (ex. 40 x 60 x 2).
          </p>
        }
      </div>
    </div>
  `,
})
export class MetrageTissu {
  protected readonly laize = signal('140');
  protected readonly margin = signal('10');
  protected readonly rotation = signal(true);
  protected readonly pieces = signal('55 x 75 x 2\n40 x 60 x 2\n20 x 30 x 4');

  protected readonly result = computed(() => {
    const laize = parseDecimal(this.laize());
    const margin = parseDecimal(this.margin()) || 0;
    const pieces = parseFabricPieces(this.pieces());
    if (!(laize > 0) || pieces.length === 0) {
      return null;
    }
    const plan = fabricLength(laize, pieces, this.rotation());
    // Arrondi aux 10 cm supérieurs : c'est en général le pas de vente au mètre.
    const toBuyCm = Math.ceil((plan.lengthCm * (1 + margin / 100)) / 10) * 10;
    return {
      length: `${formatDecimal(plan.lengthCm, 0)} cm`,
      toBuy: `${formatDecimal(toBuyCm / 100, 2)} m`,
      rows: plan.rows,
      unfit: plan.unfit,
    };
  });
}
