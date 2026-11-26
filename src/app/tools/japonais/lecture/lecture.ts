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
import { kanaToRomaji } from '../kana';
import { checkTranscription, parsePhrase, Phrase, Verdict } from '../phrases';
import { accuracy, EMPTY_SCORE, nextScore, pickWeighted, recordAnswer, StatsMap } from '../quiz';

type Display = 'kanji' | 'kana';

const ALL_PHRASES = PHRASES.map(parsePhrase);

const LEVELS: readonly { id: PhraseLevel; label: string }[] = [
  { id: 1, label: 'Kana' },
  { id: 2, label: 'Premiers kanji' },
  { id: 3, label: 'Phrases longues' },
];

const VERDICTS: Readonly<Record<Verdict, { title: string; text: string }>> = {
  exact: { title: '正解 · Parfait', text: 'Transcription exacte.' },
  'long-vowels': {
    title: 'Presque',
    text: 'Juste, mais attention aux voyelles longues (ou, ō, ー…).',
  },
  particle: {
    title: 'Presque',
    text: 'Les particules は, へ et を se prononcent « wa », « e » et « o ».',
  },
  wrong: { title: 'Pas tout à fait', text: 'Comparez avec la bonne lecture ci-dessous.' },
};

@Component({
  selector: 'app-lecture',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .sentence {
      position: relative;
      padding: 30px 22px 26px;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius-lg);
      background:
        linear-gradient(transparent calc(100% - 2px), rgb(17 17 17 / 0.1) 0) 0 0 / 100% 2.6em,
        var(--paper);
      box-shadow: var(--shadow-lg);
    }
    .sentence[data-state='ok'] {
      background-color: var(--mint);
    }
    .sentence__text {
      font-family: var(--font-jp-display);
      font-size: clamp(26px, 4.4vw, 42px);
      line-height: 2.1;
      overflow-wrap: anywhere;
    }
    .result {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .romaji {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 18px;
    }
    .fr {
      font-size: 20px;
      font-weight: 700;
    }
    .word {
      padding: 4px 10px;
      border: 2px solid var(--ink);
      border-radius: 999px;
      background: var(--paper);
      font-size: 14px;
    }
  `,
  template: `
    <div class="game">
      <div class="game__play">
        <div class="sentence" [attr.data-state]="verdict() === 'exact' ? 'ok' : null">
          @if (verdict(); as v) {
            <span
              class="stamp"
              [class.stamp--ok]="v === 'exact'"
              [class.stamp--ko]="v === 'wrong'"
              >{{ verdicts[v].title }}</span
            >
          }
          <p class="sentence__text" lang="ja">
            @if (display() === 'kana') {
              {{ phrase().kana }}
            } @else {
              @for (word of phrase().words; track $index) {
                @for (seg of word.ruby; track $index) {
                  @if (seg.ruby && (showFurigana() || verdict())) {
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
        </div>

        <form class="answer" (submit)="$event.preventDefault(); submitOrNext()">
          <label class="visually-hidden" for="lecture-answer">Transcription en rōmaji</label>
          <input
            #answerInput
            id="lecture-answer"
            class="field field--compact"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Tapez la phrase en rōmaji…"
            [value]="answer()"
            (input)="answer.set(answerInput.value)"
            [readOnly]="!!verdict()"
          />
          <button type="submit" class="btn btn--dark lift">
            {{ verdict() ? 'Suivante →' : 'Valider' }}
          </button>
        </form>

        @if (verdict(); as v) {
          <div class="tile tile--wide" [class.tile--mint]="v === 'exact'" aria-live="polite">
            <div class="result">
              <span class="kicker">{{ verdicts[v].text }}</span>
              <span class="romaji">{{ phrase().romaji }}</span>
              <span class="fr">« {{ phrase().fr }} »</span>
              <div class="chips">
                @for (word of phrase().words; track $index) {
                  @if (!word.punctuation) {
                    <span class="word"
                      ><span lang="ja" class="jp">{{ word.surface }}</span> ·
                      {{ romaji(word.spoken) }}</span
                    >
                  }
                }
              </div>
            </div>
          </div>
        }

        <div class="row">
          @if (speech.available()) {
            <button type="button" class="btn btn--small lift" (click)="speech.speak(phrase().text)">
              Écouter ♪
            </button>
          }
          @if (!verdict() && display() === 'kanji') {
            <button
              type="button"
              class="btn btn--small lift"
              [attr.aria-pressed]="showFurigana()"
              (click)="showFurigana.set(!showFurigana())"
            >
              {{ showFurigana() ? 'Masquer' : 'Indice :' }} furigana
            </button>
          }
          @if (!verdict()) {
            <button type="button" class="btn btn--small btn--ghost" (click)="reveal()">
              Voir la réponse
            </button>
          }
        </div>
      </div>

      <div class="game__side">
        <span class="kicker">Niveaux</span>
        <div class="stack">
          @for (l of levels; track l.id) {
            <label class="check">
              <input
                type="checkbox"
                [checked]="activeLevels().includes(l.id)"
                (change)="toggleLevel(l.id)"
              />
              {{ l.label }}
            </label>
          }
        </div>
        <div class="seg" role="group" aria-label="Écriture de la phrase">
          <button
            type="button"
            [attr.aria-pressed]="display() === 'kanji'"
            (click)="setDisplay('kanji')"
          >
            Kanji + kana
          </button>
          <button
            type="button"
            [attr.aria-pressed]="display() === 'kana'"
            (click)="setDisplay('kana')"
          >
            Kana seulement
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
            <span class="kicker">Phrases</span>
            <span class="tile__value">{{ pool().length }}</span>
          </div>
        </div>
        <p class="note">
          Séparez les mots par des espaces (« pan o », pas « pano »). Toutes les orthographes sont
          acceptées : shi ou si, ō ou ou. Les phrases ratées reviennent plus souvent.
        </p>
      </div>
    </div>
  `,
})
export class Lecture {
  protected readonly levels = LEVELS;
  protected readonly verdicts = VERDICTS;
  protected readonly speech = useSpeech();

  protected readonly activeLevels = signal<readonly PhraseLevel[]>(
    readStored('japonais:lecture-niveaux', [1, 2]),
  );
  protected readonly display = signal<Display>('kanji');
  private readonly stats = signal<StatsMap>(readStored('japonais:lecture-stats', {}));
  protected readonly score = signal(EMPTY_SCORE);
  protected readonly phrase = signal<Phrase>(ALL_PHRASES[0]);
  protected readonly answer = signal('');
  protected readonly verdict = signal<Verdict | null>(null);
  protected readonly showFurigana = signal(false);

  protected readonly pool = computed(() => {
    const levels = this.activeLevels();
    return ALL_PHRASES.filter((p) => levels.includes(p.level));
  });
  protected readonly precision = computed(() => accuracy(this.score()));

  private readonly answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');

  constructor() {
    loadJapaneseFont();
    this.next(false);
  }

  protected toggleLevel(level: PhraseLevel): void {
    const levels = this.activeLevels();
    const updated = levels.includes(level) ? levels.filter((l) => l !== level) : [...levels, level];
    this.activeLevels.set(updated.length ? updated : [level]);
    writeStored('japonais:lecture-niveaux', this.activeLevels());
    this.next();
  }

  protected setDisplay(display: Display): void {
    this.display.set(display);
    this.next();
  }

  protected next(focus = true): void {
    const phrase = pickWeighted(
      this.pool(),
      (p) => p.text,
      this.stats(),
      cryptoRandomInt,
      this.phrase().text,
    );
    if (phrase) {
      this.phrase.set(phrase);
    }
    this.answer.set('');
    this.verdict.set(null);
    this.showFurigana.set(false);
    if (focus) {
      queueMicrotask(() => this.answerInput()?.nativeElement.focus());
    }
  }

  protected submitOrNext(): void {
    if (this.verdict()) {
      this.next();
      return;
    }
    if (!this.answer().trim()) {
      return;
    }
    const verdict = checkTranscription(this.answer(), this.phrase());
    this.grade(verdict, verdict !== 'wrong');
  }

  protected reveal(): void {
    this.grade('wrong', false);
  }

  private grade(verdict: Verdict, correct: boolean): void {
    this.verdict.set(verdict);
    this.score.update((s) => nextScore(s, correct));
    this.stats.update((s) => recordAnswer(s, this.phrase().text, verdict === 'exact'));
    writeStored('japonais:lecture-stats', this.stats());
  }

  protected romaji(kana: string): string {
    return kanaToRomaji(kana);
  }
}
