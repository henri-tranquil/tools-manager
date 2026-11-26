import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { cryptoRandomInt } from '../../../shared/random';
import { KANA_STROKES } from '../data/kana-strokes';
import { DrawPad } from '../draw-pad';
import { loadJapaneseFont } from '../japanese';
import { kanaToRomaji } from '../kana';
import {
  buildTemplates,
  Match,
  pathToPoints,
  Point,
  recognize,
  Stroke,
  Template,
} from '../recognizer';

type Mode = 'guess' | 'challenge';
type ScriptFilter = 'hiragana' | 'katakana' | 'all';

const isHiragana = (kana: string) => /^[ぁ-ゟ]$/.test(kana);

let templatesCache: Template[] | undefined;
const allTemplates = () => (templatesCache ??= buildTemplates(KANA_STROKES));

/** Point de départ d'un trait, pour numéroter l'ordre des traits. */
function strokeStart(d: string): Point {
  return pathToPoints(d, 1)[0] ?? { x: 0, y: 0 };
}

@Component({
  selector: 'app-dessin',
  imports: [DrawPad],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .ghost {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .ghost path {
      fill: none;
      stroke: var(--coral);
      stroke-width: 7;
      stroke-linecap: round;
      opacity: 0.35;
    }
    .hint {
      position: absolute;
      inset: auto 0 14px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 700;
      pointer-events: none;
      opacity: 0.6;
    }
    .match {
      display: grid;
      grid-template-columns: 56px 1fr auto;
      gap: 4px 12px;
      align-items: center;
      width: 100%;
      padding: 8px 12px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 12px;
      background: var(--paper);
      box-shadow: var(--shadow-sm);
      text-align: left;
      cursor: pointer;
    }
    .match[aria-pressed='true'],
    .match--target {
      background: var(--yellow-soft);
    }
    .match__glyph {
      grid-row: span 2;
      font-family: var(--font-jp-display);
      font-size: 40px;
      line-height: 1;
      text-align: center;
    }
    .match__score {
      font-family: var(--font-display);
      font-size: 22px;
    }
    .bar {
      grid-column: 2 / -1;
      height: 10px;
      border: 2px solid var(--ink);
      border-radius: 999px;
      background: var(--cream);
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--coral);
      transition: width 0.3s ease;
    }
    .order {
      width: 150px;
      flex: none;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 12px;
      background: var(--paper);
    }
    .order path {
      fill: none;
      stroke: var(--ink);
      stroke-width: 5;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 1;
      animation: draw 0.7s ease-in-out both;
    }
    .order circle {
      fill: var(--coral);
      stroke: var(--ink);
      stroke-width: 1.5;
    }
    .order text {
      font: 700 8px var(--font-mono);
      text-anchor: middle;
      dominant-baseline: central;
    }
    @keyframes draw {
      from {
        stroke-dashoffset: 1;
      }
      to {
        stroke-dashoffset: 0;
      }
    }
    .target {
      font-family: var(--font-display);
      font-size: 30px;
    }
    .results {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  `,
  template: `
    <div class="game">
      <div class="game__play">
        @if (mode() === 'challenge') {
          <div class="row">
            <p class="target">
              Dessinez « {{ target().romaji }} »
              @if (showModel()) {
                <span lang="ja" class="jp">{{ target().kana }}</span>
              }
            </p>
          </div>
        }
        <app-draw-pad [strokes]="strokes()" (strokesChange)="draw($event)">
          @if (mode() === 'challenge' && showModel()) {
            <svg class="ghost" viewBox="0 0 109 109" aria-hidden="true">
              @for (d of strokesOf(target().kana); track $index) {
                <path [attr.d]="d" />
              }
            </svg>
          }
        </app-draw-pad>
        <div class="row">
          <button
            type="button"
            class="btn btn--small lift"
            [disabled]="!strokeCount()"
            (click)="undo()"
          >
            ↶ Annuler le trait
          </button>
          <button
            type="button"
            class="btn btn--small lift"
            [disabled]="!strokeCount()"
            (click)="clear()"
          >
            Effacer
          </button>
          <span class="kicker">{{ strokeCount() }} trait{{ strokeCount() > 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div class="game__side">
        <div class="seg" role="group" aria-label="Mode">
          <button type="button" [attr.aria-pressed]="mode() === 'guess'" (click)="setMode('guess')">
            Deviner
          </button>
          <button
            type="button"
            [attr.aria-pressed]="mode() === 'challenge'"
            (click)="setMode('challenge')"
          >
            Défi
          </button>
        </div>
        <div class="seg" role="group" aria-label="Kana proposés">
          <button
            type="button"
            [attr.aria-pressed]="filter() === 'hiragana'"
            (click)="setFilter('hiragana')"
          >
            Hiragana <span class="jp" lang="ja">あ</span>
          </button>
          <button
            type="button"
            [attr.aria-pressed]="filter() === 'katakana'"
            (click)="setFilter('katakana')"
          >
            Katakana <span class="jp" lang="ja">ア</span>
          </button>
          <button type="button" [attr.aria-pressed]="filter() === 'all'" (click)="setFilter('all')">
            Tous
          </button>
        </div>

        @if (mode() === 'challenge') {
          @if (challengeResult(); as r) {
            <div class="tile tile--wide" [class.tile--mint]="r.score >= 70" aria-live="polite">
              <span class="kicker">Ressemblance avec {{ target().kana }}</span>
              <span class="tile__value tile__value--big">{{ r.score }} %</span>
              <span class="note">
                Classé n° {{ r.rank }} sur {{ templates().length }} kana ·
                {{ strokeCount() }} trait(s), modèle : {{ strokesOf(target().kana).length }}
              </span>
            </div>
          }
          <div class="row">
            <button type="button" class="btn btn--small lift" (click)="showModel.set(!showModel())">
              {{ showModel() ? 'Cacher' : 'Montrer' }} le modèle
            </button>
            <button type="button" class="btn btn--small btn--coral lift" (click)="newTarget()">
              Kana suivant →
            </button>
          </div>
        }

        @if (mode() === 'guess') {
          <div class="results" aria-live="polite">
            <span class="kicker">
              {{
                matches().length
                  ? 'Kana les plus ressemblants'
                  : 'Les propositions apparaîtront ici'
              }}
            </span>
            @for (m of matches(); track m.kana) {
              <button
                type="button"
                class="match lift"
                [attr.aria-pressed]="selected() === m.kana"
                (click)="selected.set(m.kana)"
              >
                <span class="match__glyph" lang="ja">{{ m.kana }}</span>
                <span class="kicker">{{ romaji(m.kana) }}</span>
                <span class="match__score">{{ m.score }} %</span>
                <span class="bar" aria-hidden="true"><span [style.width.%]="m.score"></span></span>
              </button>
            }
          </div>
        }

        @if (orderKana(); as k) {
          <div class="row">
            <!-- Un nouveau rendu à chaque « Rejouer » relance l'animation. -->
            @for (key of [replay()]; track key) {
              <svg
                class="order"
                viewBox="0 0 109 109"
                role="img"
                [attr.aria-label]="'Ordre des traits de ' + k"
              >
                @for (d of strokesOf(k); track $index) {
                  <path [attr.d]="d" pathLength="1" [style.animation-delay.ms]="$index * 700" />
                }
                @for (d of strokesOf(k); track $index) {
                  <circle [attr.cx]="start(d).x" [attr.cy]="start(d).y" r="5.5" />
                  <text [attr.x]="start(d).x" [attr.y]="start(d).y">{{ $index + 1 }}</text>
                }
              </svg>
            }
            <div class="stack">
              <span class="kicker">Ordre des traits</span>
              <span class="note">{{ strokesOf(k).length }} trait(s), dans l'ordre numéroté.</span>
              <button type="button" class="btn btn--small lift" (click)="replay.set(replay() + 1)">
                Rejouer ▶
              </button>
            </div>
          </div>
        }
        <p class="note">
          Reconnaissance calculée dans votre navigateur (algorithme $P). Tracés de référence :
          KanjiVG, © Ulrich Apel, CC BY-SA 3.0.
        </p>
      </div>
    </div>
  `,
})
export class Dessin {
  protected readonly mode = signal<Mode>('guess');
  protected readonly filter = signal<ScriptFilter>('hiragana');
  protected readonly strokes = signal<readonly Stroke[]>([]);
  protected readonly selected = signal<string | null>(null);
  protected readonly showModel = signal(false);
  protected readonly replay = signal(1);
  protected readonly target = signal({ kana: 'あ', romaji: 'a' });

  protected readonly strokeCount = computed(() => this.strokes().length);
  protected readonly templates = computed(() => {
    const filter = this.filter();
    return allTemplates().filter((t) =>
      filter === 'all' ? true : filter === 'hiragana' ? isHiragana(t.kana) : !isHiragana(t.kana),
    );
  });
  protected readonly matches = computed<Match[]>(() => recognize(this.strokes(), this.templates()));
  protected readonly challengeResult = computed(() => {
    if (!this.strokeCount()) {
      return null;
    }
    const ranking = recognize(this.strokes(), this.templates(), Infinity);
    const index = ranking.findIndex((m) => m.kana === this.target().kana);
    return index < 0 ? null : { score: ranking[index].score, rank: index + 1 };
  });
  /** Kana dont on montre l'ordre des traits. */
  protected readonly orderKana = computed(() =>
    this.mode() === 'challenge'
      ? this.challengeResult() || this.showModel()
        ? this.target().kana
        : null
      : (this.selected() ?? this.matches()[0]?.kana ?? null),
  );

  constructor() {
    loadJapaneseFont();
  }

  protected setMode(mode: Mode): void {
    this.mode.set(mode);
    this.clear();
    if (mode === 'challenge') {
      this.newTarget();
    }
  }

  protected setFilter(filter: ScriptFilter): void {
    this.filter.set(filter);
    this.selected.set(null);
    if (this.mode() === 'challenge') {
      this.newTarget();
    }
  }

  protected newTarget(): void {
    const pool = this.templates().filter((t) => t.kana !== this.target().kana);
    const kana = pool[cryptoRandomInt(pool.length)].kana;
    this.target.set({ kana, romaji: kanaToRomaji(kana) });
    this.showModel.set(false);
    this.clear();
  }

  protected strokesOf(kana: string): readonly string[] {
    return KANA_STROKES[kana] ?? [];
  }

  protected start(d: string): Point {
    return strokeStart(d);
  }

  protected romaji(kana: string): string {
    return kanaToRomaji(kana);
  }

  protected draw(strokes: readonly Stroke[]): void {
    this.strokes.set(strokes);
    this.selected.set(null);
  }

  protected undo(): void {
    this.strokes.update((s) => s.slice(0, -1));
    this.selected.set(null);
  }

  protected clear(): void {
    this.strokes.set([]);
    this.selected.set(null);
  }
}
