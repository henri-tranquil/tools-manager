import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { answerSound } from '../../../shared/beep';
import { cryptoRandomInt } from '../../../shared/random';
import { SoundToggle } from '../../../shared/sound-toggle';
import { readStored, writeStored } from '../../../shared/storage';
import { loadJapaneseFont, useSpeech } from '../japanese';
import { KanaGroup, kanaEntries, kanaToRomaji, matchesReading, toKatakana } from '../kana';
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

type ScriptChoice = 'hiragana' | 'katakana' | 'mix';
type Mode = 'type' | 'choice';
type State = 'ask' | 'ok' | 'ko';

interface Card {
  /** Kana affiché (hiragana ou katakana). */
  readonly kana: string;
  readonly romaji: string;
}

interface Settings {
  readonly script: ScriptChoice;
  readonly groups: readonly KanaGroup[];
  readonly mode: Mode;
}

const SCRIPTS: readonly { id: ScriptChoice; label: string; sample: string }[] = [
  { id: 'hiragana', label: 'Hiragana', sample: 'あ' },
  { id: 'katakana', label: 'Katakana', sample: 'ア' },
  { id: 'mix', label: 'Les deux', sample: '' },
];

const GROUPS: readonly { id: KanaGroup; label: string; example: string }[] = [
  { id: 'base', label: 'Kana de base', example: 'あ か さ' },
  { id: 'dakuten', label: 'Avec accents (゛゜)', example: 'が ぱ' },
  { id: 'combo', label: 'Combinaisons', example: 'きゃ しょ' },
];

const DEFAULT_SETTINGS: Settings = { script: 'hiragana', groups: ['base'], mode: 'type' };

@Component({
  selector: 'app-quiz-kana',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SoundToggle],
  styles: `
    .prompt {
      position: relative;
      margin-top: 8px;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
    }
    .solution {
      position: relative;
      margin-top: 6px;
      font-family: var(--font-display);
      font-size: 34px;
      letter-spacing: -0.02em;
    }
    .review {
      min-width: 52px;
      padding: 6px 10px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 10px;
      background: var(--cream);
      text-align: center;
      font-family: var(--font-jp-display);
      font-size: 24px;
      line-height: 1.1;

      small {
        display: block;
        font-family: var(--font-mono);
        font-size: 11px;
      }
    }
    .groups {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .example {
      font-family: var(--font-jp);
      font-weight: 400;
      opacity: 0.75;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
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
            <span
              class="flashcard__glyph"
              [class.flashcard__glyph--long]="(card()?.kana?.length ?? 0) > 1"
              lang="ja"
              >{{ card()?.kana }}</span
            >
          </div>
          @if (state() === 'ask') {
            <p class="prompt">Comment se lit ce kana ?</p>
          } @else {
            <p class="solution">{{ card()?.romaji }}</p>
          }
        </div>

        @if (settings().mode === 'type') {
          <form class="answer" (submit)="$event.preventDefault(); submitOrNext()">
            <label class="visually-hidden" for="kana-answer">Lecture en rōmaji</label>
            <input
              #answerInput
              id="kana-answer"
              class="field"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="ex. ka"
              [value]="answer()"
              (input)="answer.set(answerInput.value)"
              [readOnly]="state() !== 'ask'"
            />
            <button type="submit" class="btn btn--dark lift">
              {{ state() === 'ask' ? 'Valider' : 'Suivant →' }}
            </button>
          </form>
        } @else {
          <div class="choice-grid" role="group" aria-label="Choisissez la lecture">
            @for (option of options(); track option) {
              <button
                type="button"
                class="choice lift"
                [disabled]="state() !== 'ask'"
                [attr.data-result]="resultOf(option)"
                (click)="check(option)"
              >
                {{ option }}
              </button>
            }
          </div>
          @if (state() === 'ko') {
            <button type="button" class="btn btn--dark lift" (click)="next()">Suivant →</button>
          }
        }

        <div class="actions">
          @if (speech.available()) {
            <button type="button" class="btn btn--small lift" (click)="speak()">Écouter ♪</button>
          }
          @if (state() === 'ask') {
            <button type="button" class="btn btn--small btn--ghost" (click)="skip()">
              Je ne sais pas
            </button>
          }
        </div>
      </div>

      <div class="game__side">
        <app-sound-toggle />
        <div class="seg" role="group" aria-label="Écriture">
          @for (s of scripts; track s.id) {
            <button
              type="button"
              [attr.aria-pressed]="settings().script === s.id"
              (click)="update({ script: s.id })"
            >
              {{ s.label }} <span class="jp" lang="ja">{{ s.sample }}</span>
            </button>
          }
        </div>
        <div class="groups">
          @for (g of groups; track g.id) {
            <label class="check">
              <input
                type="checkbox"
                [checked]="settings().groups.includes(g.id)"
                (change)="toggleGroup(g.id)"
              />
              {{ g.label }} <span class="example" lang="ja">{{ g.example }}</span>
            </label>
          }
        </div>
        <div class="seg" role="group" aria-label="Façon de répondre">
          <button
            type="button"
            [attr.aria-pressed]="settings().mode === 'type'"
            (click)="update({ mode: 'type' })"
          >
            Taper
          </button>
          <button
            type="button"
            [attr.aria-pressed]="settings().mode === 'choice'"
            (click)="update({ mode: 'choice' })"
          >
            Choisir parmi 4
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
            <span class="kicker">Record</span>
            <span class="tile__value">{{ record() }}</span>
          </div>
          <div class="tile">
            <span class="kicker">Précision</span>
            <span class="tile__value">{{ precision() ?? '–' }}<small>%</small></span>
          </div>
        </div>

        @if (review().length) {
          <div class="stack">
            <span class="kicker">À revoir (reviennent plus souvent)</span>
            <div class="chips">
              @for (r of review(); track r.key) {
                <span class="review" lang="ja"
                  >{{ r.key }}<small>{{ romajiOf(r.key) }}</small></span
                >
              }
            </div>
          </div>
        }
        <p class="note">
          Toutes les orthographes sont acceptées : shi ou si, tsu ou tu, o ou wo pour を. Vos
          statistiques restent dans ce navigateur.
          @if (hasStats()) {
            <button type="button" class="btn btn--small btn--ghost" (click)="resetStats()">
              Effacer mes statistiques
            </button>
          }
        </p>
      </div>
    </div>
  `,
})
export class QuizKana {
  protected readonly scripts = SCRIPTS;
  protected readonly groups = GROUPS;
  protected readonly speech = useSpeech();

  protected readonly settings = signal<Settings>(
    readStored('japonais:kana-reglages', DEFAULT_SETTINGS),
  );
  private readonly stats = signal<StatsMap>(readStored('japonais:kana-stats', {}));
  protected readonly record = signal<number>(readStored('japonais:kana-record', 0));
  protected readonly score = signal(EMPTY_SCORE);
  protected readonly card = signal<Card | undefined>(undefined);
  protected readonly options = signal<readonly string[]>([]);
  protected readonly answer = signal('');
  protected readonly state = signal<State>('ask');
  private readonly picked = signal<string | null>(null);

  protected readonly precision = computed(() => accuracy(this.score()));
  protected readonly review = computed(() => toReview(this.stats()));
  protected readonly hasStats = computed(() => Object.keys(this.stats()).length > 0);

  private readonly deck = computed<Card[]>(() => {
    const { script, groups } = this.settings();
    const entries = kanaEntries(groups.length ? groups : ['base']);
    const hira = entries.map((e) => ({ kana: e.kana, romaji: e.romaji }));
    const kata = hira.map((c) => ({ kana: toKatakana(c.kana), romaji: c.romaji }));
    return script === 'hiragana' ? hira : script === 'katakana' ? kata : [...hira, ...kata];
  });

  private readonly answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    loadJapaneseFont();
    this.next(false);
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected update(patch: Partial<Settings>): void {
    this.settings.update((s) => ({ ...s, ...patch }));
    writeStored('japonais:kana-reglages', this.settings());
    this.next();
  }

  protected toggleGroup(group: KanaGroup): void {
    const groups = this.settings().groups;
    const nextGroups = groups.includes(group)
      ? groups.filter((g) => g !== group)
      : [...groups, group];
    this.update({ groups: nextGroups.length ? nextGroups : ['base'] });
  }

  protected next(focus = true): void {
    clearTimeout(this.timer);
    const deck = this.deck();
    const card = pickWeighted(
      deck,
      (c) => c.kana,
      this.stats(),
      cryptoRandomInt,
      this.card()?.kana,
    );
    this.card.set(card);
    this.answer.set('');
    this.picked.set(null);
    this.state.set('ask');
    if (card) {
      const pool = deck.map((c) => c.romaji);
      this.options.set(choices(card.romaji, pool, 4, cryptoRandomInt));
    }
    if (focus) {
      queueMicrotask(() => this.answerInput()?.nativeElement.focus());
    }
  }

  protected submitOrNext(): void {
    if (this.state() === 'ask') {
      this.check(this.answer());
    } else {
      this.next();
    }
  }

  protected check(answer: string): void {
    const card = this.card();
    if (!card || this.state() !== 'ask' || !answer.trim()) {
      return;
    }
    this.picked.set(answer);
    this.grade(matchesReading(answer, card.kana));
  }

  protected skip(): void {
    this.grade(false);
  }

  private grade(correct: boolean): void {
    const card = this.card();
    if (!card) {
      return;
    }
    this.state.set(correct ? 'ok' : 'ko');
    this.score.update((s) => nextScore(s, correct));
    answerSound(correct ? 'ok' : 'ko', this.score().streak);
    this.stats.update((s) => recordAnswer(s, card.kana, correct));
    writeStored('japonais:kana-stats', this.stats());
    if (this.score().best > this.record()) {
      this.record.set(this.score().best);
      writeStored('japonais:kana-record', this.record());
    }
    if (correct) {
      this.timer = setTimeout(() => this.next(), 650);
    }
  }

  protected resultOf(option: string): 'ok' | 'ko' | null {
    if (this.state() === 'ask') {
      return null;
    }
    if (option === this.card()?.romaji) {
      return 'ok';
    }
    return option === this.picked() ? 'ko' : null;
  }

  protected romajiOf(kana: string): string {
    return kanaToRomaji(kana);
  }

  protected speak(): void {
    const card = this.card();
    if (card) {
      this.speech.speak(card.kana);
    }
  }

  protected resetStats(): void {
    this.stats.set({});
    this.record.set(0);
    writeStored('japonais:kana-stats', {});
    writeStored('japonais:kana-record', 0);
  }
}
