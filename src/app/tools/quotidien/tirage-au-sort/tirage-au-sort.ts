import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { cue } from '../../../shared/beep';
import { SoundToggle } from '../../../shared/sound-toggle';
import { cryptoRandomInt } from '../../../shared/random';
import { draw, flipCoin, randomBetween, rollDice } from '../daily-math';

type Mode = 'des' | 'piece' | 'nombre' | 'noms';

const MODES: readonly { id: Mode; label: string }[] = [
  { id: 'des', label: 'Dés' },
  { id: 'piece', label: 'Pile ou face' },
  { id: 'nombre', label: 'Nombre' },
  { id: 'noms', label: 'Noms' },
];

@Component({
  selector: 'app-tirage-au-sort',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SoundToggle],
  styles: `
    .result {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .chip {
      min-width: 64px;
      padding: 10px 16px;
      border: var(--bw) solid var(--ink);
      border-radius: 12px;
      background: var(--paper);
      box-shadow: var(--shadow-sm);
      font-family: var(--font-display);
      font-size: 30px;
      text-align: center;
      animation: pop 0.25s ease-out;
    }
    @keyframes pop {
      from {
        transform: scale(0.6) rotate(-8deg);
      }
    }
  `,
  template: `
    <div class="stack">
      <div class="seg" role="group" aria-label="Type de tirage">
        @for (m of modes; track m.id) {
          <button
            type="button"
            [attr.aria-pressed]="mode() === m.id"
            (click)="mode.set(m.id); results.set([])"
          >
            {{ m.label }}
          </button>
        }
      </div>
      <div class="tool-layout">
        <div class="tool-layout__inputs">
          @switch (mode()) {
            @case ('des') {
              <div class="row">
                <label class="label">
                  Nombre de dés
                  <input
                    #n
                    class="field field--compact"
                    type="number"
                    min="1"
                    max="20"
                    [value]="diceCount()"
                    (input)="diceCount.set(+n.value)"
                  />
                </label>
                <label class="label">
                  Faces
                  <input
                    #f
                    class="field field--compact"
                    type="number"
                    min="2"
                    max="1000"
                    [value]="diceFaces()"
                    (input)="diceFaces.set(+f.value)"
                  />
                </label>
              </div>
            }
            @case ('nombre') {
              <div class="row">
                <label class="label">
                  Minimum
                  <input
                    #a
                    class="field field--compact"
                    type="number"
                    [value]="min()"
                    (input)="min.set(+a.value)"
                  />
                </label>
                <label class="label">
                  Maximum
                  <input
                    #b
                    class="field field--compact"
                    type="number"
                    [value]="max()"
                    (input)="max.set(+b.value)"
                  />
                </label>
              </div>
            }
            @case ('noms') {
              <label class="label">
                Un nom par ligne
                <textarea
                  #t
                  class="field field--text"
                  rows="5"
                  [value]="names()"
                  (input)="names.set(t.value)"
                ></textarea>
              </label>
              <label class="label">
                Combien en tirer ?
                <input
                  #k
                  class="field field--compact"
                  type="number"
                  min="1"
                  [value]="pickCount()"
                  (input)="pickCount.set(+k.value)"
                />
              </label>
            }
            @case ('piece') {
              <p>Une pièce virtuelle, parfaitement équilibrée.</p>
            }
          }
          <div class="row">
            <button type="button" class="btn btn--coral lift" (click)="roll()">
              Tirer au sort
            </button>
            <app-sound-toggle />
          </div>
          <p class="note">Tirage cryptographique (crypto.getRandomValues), sans biais.</p>
        </div>
        <div class="tool-layout__results">
          <div class="tile tile--wide" style="background: #D9F99D" aria-live="polite">
            <span class="kicker">Résultat</span>
            @if (results().length) {
              <div class="result">
                @for (r of results(); track $index) {
                  <span class="chip">{{ r }}</span>
                }
              </div>
              @if (total() !== null) {
                <span class="note">Total : {{ total() }}</span>
              }
            } @else {
              <p>Appuyez sur « Tirer au sort ».</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TirageAuSort {
  protected readonly modes = MODES;
  protected readonly mode = signal<Mode>('des');
  protected readonly diceCount = signal(2);
  protected readonly diceFaces = signal(6);
  protected readonly min = signal(1);
  protected readonly max = signal(100);
  protected readonly names = signal('Alice\nBastien\nChloé\nDavid');
  protected readonly pickCount = signal(1);
  protected readonly results = signal<readonly (string | number)[]>([]);
  protected readonly total = signal<number | null>(null);

  protected roll(): void {
    cue('roll');
    this.total.set(null);
    switch (this.mode()) {
      case 'des': {
        const count = Math.min(20, Math.max(1, Math.round(this.diceCount()) || 1));
        const faces = Math.min(1000, Math.max(2, Math.round(this.diceFaces()) || 6));
        const dice = rollDice(count, faces, cryptoRandomInt);
        this.results.set(dice);
        this.total.set(count > 1 ? dice.reduce((a, b) => a + b, 0) : null);
        break;
      }
      case 'piece':
        this.results.set([flipCoin(cryptoRandomInt)]);
        break;
      case 'nombre': {
        const [lo, hi] = [Math.round(this.min()), Math.round(this.max())].sort((a, b) => a - b);
        this.results.set(
          Number.isFinite(lo) && Number.isFinite(hi)
            ? [randomBetween(lo, hi, cryptoRandomInt)]
            : [],
        );
        break;
      }
      case 'noms': {
        const list = this.names()
          .split('\n')
          .map((n) => n.trim())
          .filter(Boolean);
        this.results.set(
          draw(list, Math.max(1, Math.round(this.pickCount()) || 1), cryptoRandomInt),
        );
        break;
      }
    }
  }
}
