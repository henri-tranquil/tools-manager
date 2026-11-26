import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { COMBO_ROWS, DAKUTEN_ROWS, GOJUON_ROWS, kanaToRomaji, Script, toKatakana } from './kana';

type Table = 'base' | 'dakuten' | 'combo';

const TABLES: readonly { id: Table; label: string; rows: readonly (readonly string[])[] }[] = [
  { id: 'base', label: 'Base', rows: GOJUON_ROWS },
  { id: 'dakuten', label: 'Accents ゛゜', rows: DAKUTEN_ROWS },
  { id: 'combo', label: 'Combinaisons', rows: COMBO_ROWS },
];

/** Petits kana, allongement et ponctuation, toujours visibles. */
const EXTRAS: readonly string[] = ['っ', 'ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ー'];
const PUNCTUATION: readonly string[] = ['、', '。', '？', '！', '「', '」'];

/**
 * Clavier japonais à l'écran : tableau des kana (hiragana ou katakana) avec leur lecture,
 * petits kana et ponctuation. Émet le texte tapé ; c'est le parent qui l'insère.
 */
@Component({
  selector: 'app-kana-keyboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .head {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .keys {
      display: grid;
      grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
      gap: 8px;
      max-width: 560px;
    }
    .extras {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .key {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      padding: 6px 4px 4px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 10px;
      --key-depth: 2px;
      background: var(--paper);
      box-shadow: 2px 2px 0 var(--ink);
      cursor: pointer;
      font-family: var(--font-jp-display);
      font-weight: 600;
      font-size: clamp(20px, 3.4vw, 26px);
      line-height: 1.2;
      transition:
        transform 0.1s ease,
        box-shadow 0.1s ease;

      small {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 700;
      }
      @media (hover: hover) {
        &:hover {
          transform: translate(var(--key-depth), var(--key-depth));
          box-shadow: 0 0 0 var(--ink);
          background: var(--yellow-soft);
        }
      }
      &:active {
        transform: translate(var(--key-depth), var(--key-depth));
        box-shadow: 0 0 0 var(--ink);
      }
      &--wide {
        padding: 6px 14px;
        font-family: var(--font-body);
        font-size: 15px;
        font-weight: 700;
      }
      &--empty {
        visibility: hidden;
      }
    }
  `,
  template: `
    <div class="head">
      <div class="seg" role="group" aria-label="Écriture du clavier">
        <button
          type="button"
          [attr.aria-pressed]="script() === 'hiragana'"
          (click)="script.set('hiragana')"
        >
          Hiragana <span class="jp" lang="ja">あ</span>
        </button>
        <button
          type="button"
          [attr.aria-pressed]="script() === 'katakana'"
          (click)="script.set('katakana')"
        >
          Katakana <span class="jp" lang="ja">ア</span>
        </button>
      </div>
      <div class="seg" role="group" aria-label="Touches affichées">
        @for (t of tables; track t.id) {
          <button type="button" [attr.aria-pressed]="table() === t.id" (click)="table.set(t.id)">
            {{ t.label }}
          </button>
        }
      </div>
    </div>
    <div class="keys" [style.--cols]="table() === 'combo' ? 3 : 5">
      @for (kana of keys(); track $index) {
        @if (kana) {
          <button
            type="button"
            class="key"
            lang="ja"
            [attr.aria-label]="show(kana) + ', ' + read(kana)"
            (click)="type(kana)"
          >
            {{ show(kana) }}<small>{{ read(kana) }}</small>
          </button>
        } @else {
          <span class="key key--empty" aria-hidden="true"></span>
        }
      }
    </div>
    <div class="extras">
      @for (kana of extras; track kana) {
        <button
          type="button"
          class="key"
          lang="ja"
          [attr.aria-label]="'petit ' + show(kana)"
          (click)="type(kana)"
        >
          {{ show(kana) }}
        </button>
      }
      @for (mark of punctuation; track mark) {
        <button type="button" class="key" lang="ja" (click)="typed.emit(mark)">{{ mark }}</button>
      }
      <button type="button" class="key key--wide" (click)="typed.emit('　')">Espace</button>
      <button
        type="button"
        class="key key--wide"
        aria-label="Effacer le dernier caractère"
        (click)="erase.emit()"
      >
        ⌫ Effacer
      </button>
    </div>
  `,
})
export class KanaKeyboard {
  readonly typed = output<string>();
  readonly erase = output<void>();

  protected readonly tables = TABLES;
  protected readonly extras = EXTRAS;
  protected readonly punctuation = PUNCTUATION;
  protected readonly script = signal<Script>('hiragana');
  protected readonly table = signal<Table>('base');
  protected readonly keys = computed(() => TABLES.find((t) => t.id === this.table())!.rows.flat());

  protected show(kana: string): string {
    return this.script() === 'katakana' ? toKatakana(kana) : kana;
  }

  protected read(kana: string): string {
    return kanaToRomaji(kana);
  }

  protected type(kana: string): void {
    this.typed.emit(this.show(kana));
  }
}
