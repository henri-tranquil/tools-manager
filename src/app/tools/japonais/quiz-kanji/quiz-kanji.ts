import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { cryptoRandomInt } from '../../../shared/random';
import { readStored, writeStored } from '../../../shared/storage';
import { Kanji, KANJI } from '../data/kanji';
import { loadJapaneseFont, useSpeech } from '../japanese';
import { kanaToRomaji, matchesReading, toHiragana } from '../kana';
import {
  accuracy,
  choices,
  EMPTY_SCORE,
  nextScore,
  pickWeighted,
  recordAnswer,
  StatsMap,
  toReview,
} from '../quiz';

type Mode = 'meaning' | 'reading';
type State = 'ask' | 'ok' | 'ko';

interface Settings {
  readonly mode: Mode;
}

/** Libellé d'un sens pour le QCM : les deux premiers sens. */
const meaningOf = (k: Kanji) => k.meanings.slice(0, 2).join(', ');

/** Lectures acceptées : on'yomi en hiragana, kun'yomi avec ou sans okurigana. */
function readingsOf(k: Kanji): string[] {
  return [...k.on.map(toHiragana), ...k.kun.flatMap((r) => [r.split('.')[0], r.replace('.', '')])];
}

@Component({
  selector: 'app-quiz-kanji',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .prompt {
      position: relative;
      margin-top: 8px;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
    }
    .details {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 14px;
      align-items: baseline;

      dt {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
      }
      dd {
        margin: 0;
        font-weight: 700;
      }
    }
    .reading {
      display: inline-block;
      margin: 0 10px 4px 0;
      font-family: var(--font-jp);
      font-weight: 400;
      font-size: 19px;

      small {
        font-family: var(--font-mono);
        font-size: 12px;
      }
    }
    .okurigana {
      opacity: 0.55;
    }
    .choice {
      font-size: 16px;
    }
    .review {
      padding: 4px 10px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 10px;
      background: var(--cream);
      font-family: var(--font-jp-display);
      font-size: 26px;
    }
  `,
  template: `
    <div class="game">
      <div class="game__play">
        <div class="flashcard" [attr.data-state]="state()" aria-live="polite">
          @if (state() === 'ok') {
            <span class="stamp stamp--ok">正解 · Bravo</span>
          } @else if (state() === 'ko') {
            <span class="stamp stamp--ko">Raté</span>
          }
          <div class="flashcard__disc">
            <span class="flashcard__glyph" lang="ja">{{ kanji().k }}</span>
          </div>
          @if (state() === 'ask') {
            <p class="prompt">
              {{
                settings().mode === 'meaning'
                  ? 'Que signifie ce kanji ?'
                  : 'Donnez une de ses lectures'
              }}
            </p>
          }
        </div>

        @if (settings().mode === 'reading') {
          <form class="answer" (submit)="$event.preventDefault(); submitOrNext()">
            <label class="visually-hidden" for="kanji-answer">Lecture en rōmaji</label>
            <input
              #answerInput
              id="kanji-answer"
              class="field field--compact"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="ex. mizu ou sui"
              [value]="answer()"
              (input)="answer.set(answerInput.value)"
              [readOnly]="state() !== 'ask'"
            />
            <button type="submit" class="btn btn--dark lift">
              {{ state() === 'ask' ? 'Valider' : 'Suivant →' }}
            </button>
          </form>
        } @else {
          <div class="choice-grid" role="group" aria-label="Choisissez le sens">
            @for (option of options(); track option) {
              <button
                type="button"
                class="choice lift"
                [disabled]="state() !== 'ask'"
                [attr.data-result]="resultOf(option)"
                (click)="pick(option)"
              >
                {{ option }}
              </button>
            }
          </div>
        }

        @if (state() !== 'ask') {
          <div class="tile tile--wide">
            <dl class="details">
              <dt>Sens</dt>
              <dd>{{ kanji().meanings.join(', ') }}</dd>
              @if (kanji().on.length) {
                <dt>On'yomi</dt>
                <dd>
                  @for (r of kanji().on; track r) {
                    <span class="reading" lang="ja"
                      >{{ r }} <small>{{ romaji(r) }}</small></span
                    >
                  }
                </dd>
              }
              @if (kanji().kun.length) {
                <dt>Kun'yomi</dt>
                <dd>
                  @for (r of kanji().kun; track r) {
                    <span class="reading" lang="ja"
                      >{{ r.split('.')[0]
                      }}<span class="okurigana">{{ r.split('.')[1] ?? '' }}</span>
                      <small>{{ romaji(r.replace('.', '')) }}</small></span
                    >
                  }
                </dd>
              }
              <dt>Traits</dt>
              <dd>{{ kanji().strokes }}</dd>
            </dl>
          </div>
        }

        <div class="row">
          @if (state() !== 'ask' && settings().mode === 'meaning') {
            <button type="button" class="btn btn--dark lift" (click)="next()">Suivant →</button>
          }
          @if (speech.available() && state() !== 'ask') {
            <button type="button" class="btn btn--small lift" (click)="speak()">Écouter ♪</button>
          }
          @if (state() === 'ask') {
            <button type="button" class="btn btn--small btn--ghost" (click)="grade(false)">
              Je ne sais pas
            </button>
          }
        </div>
      </div>

      <div class="game__side">
        <span class="pill">JLPT N5 · niveau débutant</span>
        <div class="seg" role="group" aria-label="Question">
          <button
            type="button"
            [attr.aria-pressed]="settings().mode === 'meaning'"
            (click)="update({ mode: 'meaning' })"
          >
            Le sens
          </button>
          <button
            type="button"
            [attr.aria-pressed]="settings().mode === 'reading'"
            (click)="update({ mode: 'reading' })"
          >
            La lecture
          </button>
        </div>
        <div class="stats">
          <div class="tile tile--yellow">
            <span class="kicker">Score</span>
            <span class="tile__value"
              >{{ score().good }}<small> / {{ score().total }}</small></span
            >
          </div>
          <div class="tile tile--mint">
            <span class="kicker">Série</span>
            <span class="tile__value">{{ score().streak }}</span>
          </div>
          <div class="tile">
            <span class="kicker">Précision</span>
            <span class="tile__value">{{ precision() ?? '–' }}<small>%</small></span>
          </div>
          <div class="tile">
            <span class="kicker">Kanji</span>
            <span class="tile__value">{{ deck().length }}</span>
          </div>
        </div>
        @if (review().length) {
          <div class="stack">
            <span class="kicker">À revoir</span>
            <div class="chips">
              @for (r of review(); track r.key) {
                <span class="review" lang="ja">{{ r.key }}</span>
              }
            </div>
          </div>
        }
        <p class="note">
          En mode lecture, n'importe quelle lecture on ou kun est acceptée. Sens et lectures :
          KANJIDIC2 (EDRDG, CC BY-SA 4.0).
        </p>
      </div>
    </div>
  `,
})
export class QuizKanji {
  protected readonly speech = useSpeech();

  protected readonly settings = signal<Settings>(
    readStored('japonais:kanji-reglages', { mode: 'meaning' } as Settings),
  );
  private readonly stats = signal<StatsMap>(readStored('japonais:kanji-stats', {}));
  protected readonly score = signal(EMPTY_SCORE);
  protected readonly kanji = signal<Kanji>(KANJI[0]);
  protected readonly options = signal<readonly string[]>([]);
  protected readonly answer = signal('');
  protected readonly state = signal<State>('ask');
  private readonly picked = signal<string | null>(null);

  protected readonly deck = computed(() => KANJI);
  protected readonly precision = computed(() => accuracy(this.score()));
  protected readonly review = computed(() => {
    const inDeck = new Set(this.deck().map((k) => k.k));
    return toReview(this.stats(), 12).filter((r) => inDeck.has(r.key));
  });

  private readonly answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');
  constructor() {
    loadJapaneseFont();
    this.next(false);
  }

  protected update(patch: Partial<Settings>): void {
    this.settings.update((s) => ({ ...s, ...patch }));
    writeStored('japonais:kanji-reglages', this.settings());
    this.next();
  }

  protected next(focus = true): void {
    const deck = this.deck();
    const kanji = pickWeighted(deck, (k) => k.k, this.stats(), cryptoRandomInt, this.kanji().k);
    if (!kanji) {
      return;
    }
    this.kanji.set(kanji);
    this.options.set(choices(meaningOf(kanji), deck.map(meaningOf), 4, cryptoRandomInt));
    this.answer.set('');
    this.picked.set(null);
    this.state.set('ask');
    if (focus) {
      queueMicrotask(() => this.answerInput()?.nativeElement.focus());
    }
  }

  protected submitOrNext(): void {
    if (this.state() !== 'ask') {
      this.next();
      return;
    }
    const answer = this.answer();
    if (answer.trim()) {
      this.grade(readingsOf(this.kanji()).some((r) => matchesReading(answer, r)));
    }
  }

  protected pick(option: string): void {
    if (this.state() === 'ask') {
      this.picked.set(option);
      this.grade(option === meaningOf(this.kanji()));
    }
  }

  protected grade(correct: boolean): void {
    if (this.state() !== 'ask') {
      return;
    }
    this.state.set(correct ? 'ok' : 'ko');
    this.score.update((s) => nextScore(s, correct));
    this.stats.update((s) => recordAnswer(s, this.kanji().k, correct));
    writeStored('japonais:kanji-stats', this.stats());
  }

  protected resultOf(option: string): 'ok' | 'ko' | null {
    if (this.state() === 'ask') {
      return null;
    }
    if (option === meaningOf(this.kanji())) {
      return 'ok';
    }
    return option === this.picked() ? 'ko' : null;
  }

  protected romaji(kana: string): string {
    return kanaToRomaji(kana);
  }

  protected speak(): void {
    const k = this.kanji();
    this.speech.speak(k.kun[0]?.replace('.', '') ?? toHiragana(k.on[0] ?? k.k));
  }
}
