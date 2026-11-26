import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { KANA_STROKES } from './data/kana-strokes';
import { DrawPad } from './draw-pad';
import { buildTemplates, recognize, Stroke, Template } from './recognizer';

type Filter = 'all' | 'kana' | 'kanji';

let kanaTemplates: Template[] | undefined;
let kanjiTemplates: Promise<Template[]> | undefined;

/** Modèles des kanji N5/N4, chargés à la demande (≈ 200 ko de tracés). */
function loadKanjiTemplates(): Promise<Template[]> {
  kanjiTemplates ??= import('./data/kanji-strokes').then((m) => buildTemplates(m.KANJI_STROKES));
  return kanjiTemplates;
}

/**
 * Écriture à la main : on trace un caractère (kana ou kanji des niveaux N5/N4), on choisit
 * parmi les propositions, et le caractère est émis vers le parent.
 */
@Component({
  selector: 'app-handwriting',
  imports: [DrawPad],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      align-items: flex-start;
      --pad-size: 280px;
    }
    .side {
      flex: 1 1 240px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .candidates {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
      gap: 8px;
    }
    .candidate {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 4px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 12px;
      background: var(--paper);
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      font-family: var(--font-jp-display);
      font-weight: 600;
      font-size: 34px;
      line-height: 1.15;

      small {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 700;
      }
      &:first-child {
        background: var(--yellow-soft);
      }
    }
  `,
  template: `
    <app-draw-pad
      [strokes]="strokes()"
      (strokesChange)="strokes.set($event)"
      hint="Tracez un caractère"
    />
    <div class="side">
      <div class="seg" role="group" aria-label="Caractères reconnus">
        <button type="button" [attr.aria-pressed]="filter() === 'all'" (click)="filter.set('all')">
          Tout
        </button>
        <button
          type="button"
          [attr.aria-pressed]="filter() === 'kana'"
          (click)="filter.set('kana')"
        >
          Kana
        </button>
        <button
          type="button"
          [attr.aria-pressed]="filter() === 'kanji'"
          (click)="filter.set('kanji')"
        >
          Kanji N5-N4
        </button>
      </div>
      <span class="kicker">
        {{ matches().length ? 'Choisissez le bon caractère' : 'Les propositions apparaîtront ici' }}
      </span>
      <div class="candidates" aria-live="polite">
        @for (m of matches(); track m.kana) {
          <button type="button" class="candidate lift" lang="ja" (click)="choose(m.kana)">
            {{ m.kana }}<small>{{ m.score }} %</small>
          </button>
        }
      </div>
      <div class="row">
        <button
          type="button"
          class="btn btn--small lift"
          [disabled]="!strokes().length"
          (click)="strokes.set(strokes().slice(0, -1))"
        >
          ↶ Annuler le trait
        </button>
        <button
          type="button"
          class="btn btn--small lift"
          [disabled]="!strokes().length"
          (click)="strokes.set([])"
        >
          Effacer
        </button>
      </div>
      <p class="note">
        Reconnaît les {{ kanaCount }} kana et les {{ kanjiCount() || 284 }} kanji des niveaux N5 et
        N4. Tracés de référence : KanjiVG (CC BY-SA 3.0).
      </p>
    </div>
  `,
})
export class Handwriting {
  readonly typed = output<string>();

  protected readonly strokes = signal<readonly Stroke[]>([]);
  protected readonly filter = signal<Filter>('all');
  private readonly kanji = signal<Template[]>([]);
  protected readonly kanaCount = Object.keys(KANA_STROKES).length;
  protected readonly kanjiCount = computed(() => this.kanji().length);

  private readonly templates = computed(() => {
    kanaTemplates ??= buildTemplates(KANA_STROKES);
    const filter = this.filter();
    return [
      ...(filter !== 'kanji' ? kanaTemplates : []),
      ...(filter !== 'kana' ? this.kanji() : []),
    ];
  });

  protected readonly matches = computed(() => recognize(this.strokes(), this.templates(), 8));

  constructor() {
    void loadKanjiTemplates().then((t) => this.kanji.set(t));
  }

  protected choose(char: string): void {
    this.typed.emit(char);
    this.strokes.set([]);
  }
}
