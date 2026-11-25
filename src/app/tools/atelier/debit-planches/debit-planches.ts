import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { parseCutList, planCuts } from '../workshop-math';

const PIECE_COLORS = ['#FFB38A', '#FFE066', '#7CE0B5', '#8FD3FF', '#FF9EC7', '#B8A9FF'];

@Component({
  selector: 'app-debit-planches',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .board {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .board__bar {
      display: flex;
      height: 44px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 8px;
      overflow: hidden;
      background: repeating-linear-gradient(-45deg, var(--paper) 0 8px, #e9e2d3 8px 16px);
    }
    .board__cut {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      border-right: 2px solid var(--ink);
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      overflow: hidden;
      white-space: nowrap;
    }
    .board__meta {
      font-family: var(--font-mono);
      font-size: 12px;
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <div class="row">
          <label class="label">
            Longueur des planches (mm)
            <input
              #s
              class="field field--compact"
              type="text"
              inputmode="decimal"
              [value]="stock()"
              (input)="stock.set(s.value)"
            />
          </label>
          <label class="label">
            Trait de scie (mm)
            <input
              #k
              class="field field--compact"
              type="text"
              inputmode="decimal"
              [value]="kerf()"
              (input)="kerf.set(k.value)"
            />
          </label>
        </div>
        <label class="label">
          Pièces à couper (longueur × quantité, une par ligne)
          <textarea
            #c
            class="field field--text"
            rows="6"
            spellcheck="false"
            [value]="cuts()"
            (input)="cuts.set(c.value)"
          ></textarea>
        </label>
        <p class="note">
          Méthode « plus grande pièce d'abord » : une bonne solution, pas toujours l'optimum absolu.
        </p>
      </div>
      <div class="tool-layout__results" aria-live="polite">
        @if (plan(); as p) {
          <div class="tile tile--peach">
            <span class="kicker">Planches</span>
            <span class="tile__value tile__value--big">{{ p.boards.length }}</span>
          </div>
          <div class="tile">
            <span class="kicker">Chute totale</span>
            <span class="tile__value">{{ p.waste }}</span>
          </div>
          @if (p.tooLong.length) {
            <p class="tile tile--wide tile--coral">
              Trop longues pour la planche : {{ p.tooLong.join(', ') }} mm
            </p>
          }
          @for (board of p.boards; track $index) {
            <div class="board">
              <span class="board__meta">Planche {{ $index + 1 }} · chute {{ board.waste }}</span>
              <div class="board__bar" role="img" [attr.aria-label]="'Coupes : ' + board.label">
                @for (cut of board.cuts; track $index) {
                  <span
                    class="board__cut"
                    [style.width.%]="cut.percent"
                    [style.background]="cut.color"
                    >{{ cut.length }}</span
                  >
                }
              </div>
            </div>
          }
        } @else {
          <p class="tile tile--wide tile--coral">
            Saisissez une longueur de planche et au moins une pièce.
          </p>
        }
      </div>
    </div>
  `,
})
export class DebitPlanches {
  protected readonly stock = signal('2400');
  protected readonly kerf = signal('3');
  protected readonly cuts = signal('800 x 4\n600 x 2\n450 x 3\n300 x 2');

  protected readonly plan = computed(() => {
    const stock = parseDecimal(this.stock());
    const kerf = parseDecimal(this.kerf()) || 0;
    const requests = parseCutList(this.cuts());
    if (!(stock > 0) || requests.length === 0) {
      return null;
    }
    const colorOf = new Map(
      [...new Set(requests.map((r) => r.length))].map((l, i) => [
        l,
        PIECE_COLORS[i % PIECE_COLORS.length],
      ]),
    );
    const plan = planCuts(stock, kerf, requests);
    const mm = (v: number) => `${formatDecimal(v, 0)} mm`;
    return {
      tooLong: plan.tooLong,
      waste: mm(plan.boards.reduce((sum, b) => sum + b.waste, 0)),
      boards: plan.boards.map((b) => ({
        waste: mm(b.waste),
        label: b.cuts.join(', ') + ' mm',
        cuts: b.cuts.map((length) => ({
          length,
          percent: (length / stock) * 100,
          color: colorOf.get(length),
        })),
      })),
    };
  });
}
