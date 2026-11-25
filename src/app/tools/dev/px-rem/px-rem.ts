import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';

const COMMON_PX = [4, 8, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64];

@Component({
  selector: 'app-px-rem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Taille de police racine (px)
          <input
            #b
            class="field"
            type="text"
            inputmode="decimal"
            [value]="base()"
            (input)="base.set(b.value)"
          />
        </label>
        <div class="row">
          <label class="label">
            Pixels (px)
            <input
              #p
              class="field"
              type="text"
              inputmode="decimal"
              [value]="px()"
              (input)="onPx(p.value)"
            />
          </label>
          <label class="label">
            rem
            <input
              #r
              class="field field--mint"
              type="text"
              inputmode="decimal"
              [value]="rem()"
              (input)="onRem(r.value)"
            />
          </label>
        </div>
        <p class="note">
          1 rem = taille de police de l'élément html (16 px par défaut dans les navigateurs).
        </p>
      </div>
      <div class="tool-layout__results">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">px</th>
                <th scope="col" class="num">rem</th>
                <th scope="col">CSS</th>
              </tr>
            </thead>
            <tbody>
              @for (row of table(); track row.px) {
                <tr>
                  <th scope="row">{{ row.px }} px</th>
                  <td class="num">{{ row.rem }}</td>
                  <td>
                    <code>{{ row.css }}</code>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class PxRem {
  protected readonly base = signal('16');
  protected readonly px = signal('24');
  protected readonly rem = signal('1,5');

  private readonly baseValue = computed(() => parseDecimal(this.base()));

  protected readonly table = computed(() => {
    const base = this.baseValue();
    return COMMON_PX.map((px) => {
      const rem = base > 0 ? formatDecimal(px / base, 4) : '—';
      return { px, rem, css: base > 0 ? `${String(px / base)}rem` : '—' };
    });
  });

  protected onPx(raw: string): void {
    this.px.set(raw);
    const value = parseDecimal(raw);
    const base = this.baseValue();
    this.rem.set(Number.isNaN(value) || !(base > 0) ? '' : formatDecimal(value / base, 4));
  }

  protected onRem(raw: string): void {
    this.rem.set(raw);
    const value = parseDecimal(raw);
    const base = this.baseValue();
    this.px.set(Number.isNaN(value) || !(base > 0) ? '' : formatDecimal(value * base, 2));
  }
}
