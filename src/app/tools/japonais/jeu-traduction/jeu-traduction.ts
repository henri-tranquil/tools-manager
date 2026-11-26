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
import { PhraseLevel, PHRASES } from '../data/phrases';
import { loadJapaneseFont, useSpeech } from '../japanese';
import { checkTranscription, parsePhrase, Phrase } from '../phrases';
import {
  accuracy,
  choices,
  EMPTY_SCORE,
  nextScore,
  pickWeighted,
  recordAnswer,
  remember,
  Score,
  StatsMap,
} from '../quiz';
import { analyzeFrench, checkAssembly, FrenchCheck, tiles } from '../translation-game';

type Direction = 'ja-fr' | 'fr-ja';
type Answer = 'write' | 'choice' | 'tiles' | 'romaji';
type Kind = 'ok' | 'close' | 'wrong';

interface Result {
  readonly kind: Kind;
  readonly title: string;
  readonly text: string;
}

interface Settings {
  readonly direction: Direction;
  readonly jaFr: Answer;
  readonly frJa: Answer;
  readonly levels: readonly PhraseLevel[];
  readonly kanaOnly: boolean;
}

const ALL_PHRASES = PHRASES.map(parsePhrase);

const DEFAULT_SETTINGS: Settings = {
  direction: 'ja-fr',
  jaFr: 'write',
  frJa: 'tiles',
  levels: [1, 2],
  kanaOnly: false,
};

const LEVELS: readonly { id: PhraseLevel; label: string }[] = [
  { id: 1, label: 'Kana' },
  { id: 2, label: 'Premiers kanji' },
  { id: 3, label: 'Phrases longues' },
];

const RESULTS: Readonly<Record<string, Result>> = {
  ok: { kind: 'ok', title: '正解 · Bravo', text: 'Bonne traduction.' },
  negation: {
    kind: 'wrong',
    title: 'Sens inversé',
    text: "Les mots y sont, mais la négation n'est pas la bonne : comparez avec la traduction.",
  },
  frClose: {
    kind: 'close',
    title: 'Presque',
    text: 'Une partie du sens y est : comparez avec la traduction proposée.',
  },
  order: {
    kind: 'ok',
    title: '正解 · Autre ordre',
    text: "Juste : en japonais l'ordre des compléments est libre, seul le verbe reste à la fin.",
  },
  longVowels: {
    kind: 'close',
    title: 'Presque',
    text: 'Juste, mais attention aux voyelles longues (ou, ō, ー…).',
  },
  particle: {
    kind: 'close',
    title: 'Presque',
    text: 'Les particules は, へ et を se prononcent « wa », « e » et « o ».',
  },
  wrong: { kind: 'wrong', title: 'Raté', text: 'Voici la bonne réponse.' },
  override: { kind: 'ok', title: 'Accepté', text: 'Compté juste : votre formulation convient.' },
};

@Component({
  selector: 'app-jeu-traduction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .prompt {
      position: relative;
      padding: 30px 22px 24px;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-lg);
    }
    .prompt[data-kind='ok'] {
      background: var(--mint);
    }
    .jp-text {
      font-family: var(--font-jp-display);
      font-weight: 600;
      font-size: clamp(26px, 4.4vw, 40px);
      line-height: 2;
      overflow-wrap: anywhere;
    }
    .fr-text {
      font-family: var(--font-display);
      font-size: clamp(24px, 3.6vw, 34px);
      line-height: 1.2;
      letter-spacing: -0.02em;
    }
    .slot {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 62px;
      padding: 10px;
      border: var(--bw-thin) dashed var(--ink);
      border-radius: var(--radius);
      background: var(--cream);
    }
    .tile-btn {
      padding: 6px 14px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 10px;
      background: var(--paper);
      box-shadow: var(--shadow-sm);
      font-family: var(--font-jp-display);
      font-weight: 600;
      font-size: 24px;
      cursor: pointer;
    }
    .slot .tile-btn {
      background: var(--yellow-soft);
    }
    .tile-btn:disabled {
      cursor: default;
    }
    .solution {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .romaji {
      font-family: var(--font-mono);
      font-weight: 700;
    }
    .choice {
      font-size: 16px;
      text-align: left;
    }
    .hint {
      font-weight: 700;
    }
    .words {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .word {
      padding: 1px 8px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;

      &--ok {
        background: var(--mint);
      }
      &--ko {
        background: var(--paper);
        border-style: dashed;
      }
    }
  `,
  template: `
    <div class="game">
      <div class="game__play">
        <div class="prompt" [attr.data-kind]="result()?.kind">
          @if (result(); as r) {
            <span
              class="stamp"
              [class.stamp--ok]="r.kind === 'ok'"
              [class.stamp--ko]="r.kind === 'wrong'"
            >
              {{ r.title }}
            </span>
          }
          <span class="kicker">{{
            direction() === 'ja-fr' ? 'Traduisez en français' : 'Traduisez en japonais'
          }}</span>
          @if (direction() === 'ja-fr') {
            <p class="jp-text" lang="ja">
              @if (settings().kanaOnly) {
                {{ phrase().kana }}
              } @else {
                @for (word of phrase().words; track $index) {
                  @for (seg of word.ruby; track $index) {
                    @if (seg.ruby && (showFurigana() || result())) {
                      <ruby
                        >{{ seg.text }}<rt>{{ seg.ruby }}</rt></ruby
                      >
                    } @else {
                      {{ seg.text }}
                    }
                  }
                }
              }
            </p>
          } @else {
            <p class="fr-text">« {{ phrase().fr }} »</p>
          }
        </div>

        @switch (answerStyle()) {
          @case ('write') {
            <form class="answer" (submit)="$event.preventDefault(); submitOrNext()">
              <label class="visually-hidden" for="jeu-fr">Traduction en français</label>
              <input
                #answerInput
                id="jeu-fr"
                class="field field--compact"
                autocomplete="off"
                placeholder="Votre traduction…"
                [value]="answer()"
                (input)="answer.set(answerInput.value)"
                [readOnly]="!!result()"
              />
              <button type="submit" class="btn btn--dark lift">
                {{ result() ? 'Suivante →' : 'Valider' }}
              </button>
            </form>
          }
          @case ('romaji') {
            <form class="answer" (submit)="$event.preventDefault(); submitOrNext()">
              <label class="visually-hidden" for="jeu-romaji">Phrase japonaise en rōmaji</label>
              <input
                #answerInput
                id="jeu-romaji"
                class="field field--compact"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="La phrase en rōmaji…"
                [value]="answer()"
                (input)="answer.set(answerInput.value)"
                [readOnly]="!!result()"
              />
              <button type="submit" class="btn btn--dark lift">
                {{ result() ? 'Suivante →' : 'Valider' }}
              </button>
            </form>
          }
          @case ('choice') {
            <div class="choice-grid" role="group" aria-label="Choisissez la traduction">
              @for (option of options(); track option) {
                <button
                  type="button"
                  class="choice lift"
                  [disabled]="!!result()"
                  [attr.data-result]="resultOf(option)"
                  (click)="pick(option)"
                >
                  {{ option }}
                </button>
              }
            </div>
          }
          @case ('tiles') {
            <span class="kicker">Votre phrase · touchez une étiquette pour la retirer</span>
            <div class="slot" aria-live="polite">
              @for (i of chosen(); track i) {
                <button
                  type="button"
                  class="tile-btn"
                  lang="ja"
                  [disabled]="!!result()"
                  (click)="unpick(i)"
                >
                  {{ bank()[i] }}
                </button>
              }
            </div>
            <div class="chips" role="group" aria-label="Étiquettes disponibles">
              @for (t of bank(); track $index) {
                @if (!chosen().includes($index)) {
                  <button
                    type="button"
                    class="tile-btn lift"
                    lang="ja"
                    [disabled]="!!result()"
                    (click)="pickTile($index)"
                  >
                    {{ t }}
                  </button>
                }
              }
            </div>
            @if (!result()) {
              <button
                type="button"
                class="btn btn--dark lift"
                [disabled]="!chosen().length"
                (click)="checkTiles()"
              >
                Valider
              </button>
            }
          }
        }

        @if (result(); as r) {
          <div class="tile tile--wide" [class.tile--mint]="r.kind === 'ok'" aria-live="polite">
            <div class="solution">
              <span class="kicker">{{ r.text }}</span>
              <p class="jp-text" lang="ja">
                @for (word of phrase().words; track $index) {
                  @for (seg of word.ruby; track $index) {
                    @if (seg.ruby) {
                      <ruby
                        >{{ seg.text }}<rt>{{ seg.ruby }}</rt></ruby
                      >
                    } @else {
                      {{ seg.text }}
                    }
                  }
                }
              </p>
              <span class="romaji">{{ phrase().romaji }}</span>
              <strong>« {{ phrase().fr }} »</strong>
              @if (frenchCheck(); as fc) {
                @if (fc.negation === 'added') {
                  <span class="hint">Votre phrase est négative, l'originale ne l'est pas.</span>
                } @else if (fc.negation === 'missing') {
                  <span class="hint"
                    >L'originale est négative (〜ない, 〜ません) : il manque « ne… pas ».</span
                  >
                }
                @if (r.kind !== 'ok' && (fc.found.length || fc.missing.length)) {
                  <span class="words">
                    @for (w of fc.found; track w) {
                      <span class="word word--ok">✓ {{ w }}</span>
                    }
                    @for (w of fc.missing; track w) {
                      <span class="word word--ko">✗ {{ w }}</span>
                    }
                  </span>
                }
              }
            </div>
          </div>
          <div class="row">
            @if (answerStyle() !== 'write' && answerStyle() !== 'romaji') {
              <button type="button" class="btn btn--dark lift" (click)="next()">Suivante →</button>
            }
            @if (r.kind !== 'ok' && answerStyle() === 'write') {
              <button type="button" class="btn btn--small lift" (click)="override()">
                J'avais bon
              </button>
            }
          </div>
        }

        <div class="row">
          @if (speech.available()) {
            <button type="button" class="btn btn--small lift" (click)="speech.speak(phrase().text)">
              Écouter ♪
            </button>
          }
          @if (!result() && direction() === 'ja-fr' && !settings().kanaOnly) {
            <button
              type="button"
              class="btn btn--small lift"
              [attr.aria-pressed]="showFurigana()"
              (click)="showFurigana.set(!showFurigana())"
            >
              {{ showFurigana() ? 'Masquer' : 'Indice :' }} furigana
            </button>
          }
          @if (!result()) {
            <button
              type="button"
              class="btn btn--small btn--ghost"
              (click)="grade(results['wrong'])"
            >
              Voir la réponse
            </button>
          }
        </div>
      </div>

      <div class="game__side">
        <div class="seg" role="group" aria-label="Sens de traduction">
          <button
            type="button"
            [attr.aria-pressed]="direction() === 'ja-fr'"
            (click)="update({ direction: 'ja-fr' })"
          >
            Japonais → français
          </button>
          <button
            type="button"
            [attr.aria-pressed]="direction() === 'fr-ja'"
            (click)="update({ direction: 'fr-ja' })"
          >
            Français → japonais
          </button>
        </div>
        @if (direction() === 'ja-fr') {
          <div class="seg" role="group" aria-label="Façon de répondre">
            <button
              type="button"
              [attr.aria-pressed]="settings().jaFr === 'write'"
              (click)="update({ jaFr: 'write' })"
            >
              Écrire
            </button>
            <button
              type="button"
              [attr.aria-pressed]="settings().jaFr === 'choice'"
              (click)="update({ jaFr: 'choice' })"
            >
              Choisir parmi 4
            </button>
          </div>
          <label class="check">
            <input
              type="checkbox"
              [checked]="settings().kanaOnly"
              (change)="update({ kanaOnly: !settings().kanaOnly })"
            />
            Phrase en kana seulement
          </label>
        } @else {
          <div class="seg" role="group" aria-label="Façon de répondre">
            <button
              type="button"
              [attr.aria-pressed]="settings().frJa === 'tiles'"
              (click)="update({ frJa: 'tiles' })"
            >
              Assembler les mots
            </button>
            <button
              type="button"
              [attr.aria-pressed]="settings().frJa === 'romaji'"
              (click)="update({ frJa: 'romaji' })"
            >
              Taper en rōmaji
            </button>
          </div>
        }
        <span class="kicker">Niveaux</span>
        <div class="stack">
          @for (l of levels; track l.id) {
            <label class="check">
              <input
                type="checkbox"
                [checked]="settings().levels.includes(l.id)"
                (change)="toggleLevel(l.id)"
              />
              {{ l.label }}
            </label>
          }
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
            <span class="kicker">Phrases</span>
            <span class="tile__value">{{ pool().length }}</span>
          </div>
        </div>
        <p class="note">
          En français, la correction cherche les mots importants (synonymes courants compris) et
          vérifie la négation : une autre formulation juste passe souvent, et sinon « J'avais bon »
          la compte. En japonais, l'ordre des compléments peut varier, mais le verbe reste à la fin.
        </p>
      </div>
    </div>
  `,
})
export class JeuTraduction {
  protected readonly levels = LEVELS;
  protected readonly results = RESULTS;
  protected readonly speech = useSpeech();

  protected readonly settings = signal<Settings>({
    ...DEFAULT_SETTINGS,
    ...readStored<Partial<Settings>>('japonais:traduction-jeu', {}),
  });
  private readonly stats = signal<StatsMap>(readStored('japonais:traduction-jeu-stats', {}));
  protected readonly score = signal(EMPTY_SCORE);
  private scoreBefore: Score = EMPTY_SCORE;
  protected readonly phrase = signal<Phrase>(ALL_PHRASES[0]);
  protected readonly answer = signal('');
  protected readonly result = signal<Result | null>(null);
  protected readonly showFurigana = signal(false);
  /** Détail de la correction d'une traduction libre (mots retrouvés, manquants, négation). */
  protected readonly frenchCheck = signal<FrenchCheck | null>(null);
  protected readonly options = signal<readonly string[]>([]);
  protected readonly bank = signal<readonly string[]>([]);
  protected readonly chosen = signal<readonly number[]>([]);
  private readonly picked = signal<string | null>(null);

  protected readonly direction = computed(() => this.settings().direction);
  protected readonly answerStyle = computed<Answer>(() =>
    this.direction() === 'ja-fr' ? this.settings().jaFr : this.settings().frJa,
  );
  protected readonly pool = computed(() =>
    ALL_PHRASES.filter((p) => this.settings().levels.includes(p.level)),
  );
  protected readonly precision = computed(() => accuracy(this.score()));

  /** Dernières phrases tirées, pour ne pas les reproposer tout de suite. */
  private recent: string[] = [];
  private readonly answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');

  constructor() {
    loadJapaneseFont();
    this.next(false);
  }

  protected update(patch: Partial<Settings>): void {
    this.settings.update((s) => ({ ...s, ...patch }));
    writeStored('japonais:traduction-jeu', this.settings());
    this.next();
  }

  protected toggleLevel(level: PhraseLevel): void {
    const levels = this.settings().levels;
    const updated = levels.includes(level) ? levels.filter((l) => l !== level) : [...levels, level];
    this.update({ levels: updated.length ? updated : [level] });
  }

  protected next(focus = true): void {
    const key = (p: Phrase) => `${this.direction()}:${p.text}`;
    const phrase = pickWeighted(this.pool(), key, this.stats(), cryptoRandomInt, this.recent);
    if (phrase) {
      this.phrase.set(phrase);
      this.recent = remember(this.recent, key(phrase), this.pool().length);
      this.options.set(
        choices(
          phrase.fr,
          this.pool().map((p) => p.fr),
          4,
          cryptoRandomInt,
        ),
      );
      this.bank.set(tiles(phrase, ALL_PHRASES, 2, cryptoRandomInt));
    }
    this.answer.set('');
    this.chosen.set([]);
    this.picked.set(null);
    this.result.set(null);
    this.frenchCheck.set(null);
    this.showFurigana.set(false);
    if (focus) {
      queueMicrotask(() => this.answerInput()?.nativeElement.focus());
    }
  }

  protected submitOrNext(): void {
    if (this.result()) {
      this.next();
      return;
    }
    const answer = this.answer();
    if (!answer.trim()) {
      return;
    }
    if (this.answerStyle() === 'write') {
      const check = analyzeFrench(answer, this.phrase().translations);
      const verdict = check.verdict;
      this.frenchCheck.set(check);
      this.grade(
        verdict === 'ok'
          ? RESULTS['ok']
          : verdict === 'close'
            ? RESULTS['frClose']
            : check.negation
              ? RESULTS['negation']
              : RESULTS['wrong'],
      );
    } else {
      const verdict = checkTranscription(answer, this.phrase());
      const map = {
        exact: 'ok',
        'long-vowels': 'longVowels',
        particle: 'particle',
        wrong: 'wrong',
      };
      this.grade(RESULTS[map[verdict]]);
    }
  }

  protected pick(option: string): void {
    if (!this.result()) {
      this.picked.set(option);
      this.grade(option === this.phrase().fr ? RESULTS['ok'] : RESULTS['wrong']);
    }
  }

  protected pickTile(index: number): void {
    this.chosen.update((c) => [...c, index]);
  }

  protected unpick(index: number): void {
    this.chosen.update((c) => c.filter((i) => i !== index));
  }

  protected checkTiles(): void {
    const answer = this.chosen().map((i) => this.bank()[i]);
    const verdict = checkAssembly(answer, this.phrase());
    this.grade(
      verdict === 'exact'
        ? RESULTS['ok']
        : verdict === 'order'
          ? RESULTS['order']
          : RESULTS['wrong'],
    );
  }

  protected grade(result: Result): void {
    if (this.result()) {
      return;
    }
    const correct = result.kind !== 'wrong';
    this.result.set(result);
    this.scoreBefore = this.score();
    this.score.set(nextScore(this.scoreBefore, correct));
    this.stats.update((s) =>
      recordAnswer(s, `${this.direction()}:${this.phrase().text}`, result.kind === 'ok'),
    );
    writeStored('japonais:traduction-jeu-stats', this.stats());
  }

  /** « J'avais bon » : la réponse libre est comptée juste. */
  protected override(): void {
    this.result.set(RESULTS['override']);
    this.score.set(nextScore(this.scoreBefore, true));
  }

  protected resultOf(option: string): 'ok' | 'ko' | null {
    if (!this.result()) {
      return null;
    }
    if (option === this.phrase().fr) {
      return 'ok';
    }
    return option === this.picked() ? 'ko' : null;
  }
}
