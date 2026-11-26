import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { answerSound, finishSound } from '../../../shared/beep';
import { cryptoRandomInt } from '../../../shared/random';
import { SoundToggle } from '../../../shared/sound-toggle';
import { readStored, writeStored } from '../../../shared/storage';
import {
  checkExercise,
  diagnose,
  Exercise,
  EXERCISE_KINDS,
  ExerciseKind,
  makeSheet,
} from '../exercises';
import { loadJapaneseFont } from '../japanese';

interface Settings {
  readonly kinds: readonly ExerciseKind[];
  readonly length: number;
}

interface Answered {
  readonly exercise: Exercise;
  readonly answer: string;
  readonly correct: boolean;
  readonly trap: string | null;
}

type KindStats = Readonly<Record<string, { ok: number; total: number }>>;

const DEFAULT_SETTINGS: Settings = { kinds: ['particules', 'conjugaison'], length: 10 };
const LENGTHS = [5, 10, 20];

@Component({
  selector: 'app-exercices',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SoundToggle],
  styles: `
    .sheet {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 22px 20px;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-lg);
      position: relative;
    }
    .progress {
      display: flex;
      gap: 4px;

      span {
        flex: 1;
        height: 10px;
        border: var(--bw-thin) solid var(--ink);
        border-radius: 999px;
        background: var(--paper);

        &[data-state='ok'] {
          background: var(--mint);
        }
        &[data-state='ko'] {
          background: var(--coral);
        }
        &[data-state='current'] {
          background: var(--yellow);
        }
      }
    }
    .question {
      margin: 0;
      font-family: var(--font-jp-display);
      font-size: clamp(26px, 4.4vw, 38px);
      line-height: 1.5;
      overflow-wrap: anywhere;
    }
    .hint {
      margin: 0;
      font-weight: 700;
    }
    .choice {
      font-family: var(--font-jp);
      font-size: 24px;
    }
    .correction {
      display: flex;
      flex-direction: column;
      gap: 8px;

      p {
        margin: 0;
      }
    }
    .solution {
      font-family: var(--font-jp);
      font-size: 22px;
    }
    .trap {
      font-weight: 700;
    }
    .score {
      font-family: var(--font-display);
      font-size: clamp(56px, 10vw, 88px);
      line-height: 1;
      letter-spacing: -0.04em;

      small {
        font-size: 0.4em;
      }
    }
    .mistakes {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px 14px;
        border: var(--bw-thin) solid var(--ink);
        border-radius: var(--radius);
        background: var(--cream);
      }
    }
    .jp {
      font-family: var(--font-jp);
    }
    .group {
      margin: 0;
      padding: 0;
      border: 0;
    }
    .tight {
      gap: 10px;
    }
    .bar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 4px 10px;
      align-items: center;
      font-weight: 700;

      .meter {
        grid-column: 1 / -1;
        height: 10px;
        border: var(--bw-thin) solid var(--ink);
        border-radius: 999px;
        background: var(--paper);
        overflow: hidden;
      }
      .meter span {
        display: block;
        height: 100%;
        background: var(--mint);
      }
    }
  `,
  template: `
    <div class="game">
      <div class="game__play">
        @if (!finished()) {
          @let ex = current();
          <div class="sheet" [attr.data-state]="state()" aria-live="polite">
            @if (state() === 'ok') {
              <span class="stamp stamp--ok">正解 · Bravo</span>
            } @else if (state() === 'ko') {
              <span class="stamp stamp--ko">Raté</span>
            }
            <div class="progress" aria-hidden="true">
              @for (s of progress(); track $index) {
                <span [attr.data-state]="s"></span>
              }
            </div>
            <span class="kicker"
              >Exercice {{ index() + 1 }} / {{ sheet().length }} · {{ ex.instruction }}</span
            >
            <p class="question" lang="ja">{{ ex.question }}</p>
            <p class="hint">{{ ex.hint }}</p>
          </div>

          @if (ex.choices; as options) {
            <div class="choice-grid" role="group" aria-label="Choisissez la réponse">
              @for (option of options; track option) {
                <button
                  type="button"
                  class="choice lift"
                  lang="ja"
                  [disabled]="state() !== 'ask'"
                  [attr.data-result]="resultOf(option)"
                  (click)="submit(option)"
                >
                  {{ option }}
                </button>
              }
            </div>
          } @else {
            <form class="answer" (submit)="$event.preventDefault(); submitOrNext()">
              <label class="visually-hidden" for="exercice-reponse"
                >Réponse en kana ou en rōmaji</label
              >
              <input
                #answerInput
                id="exercice-reponse"
                class="field field--compact"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="kana ou rōmaji"
                [value]="answer()"
                (input)="answer.set(answerInput.value)"
                [readOnly]="state() !== 'ask'"
              />
              <button type="submit" class="btn btn--dark lift">
                {{ state() === 'ask' ? 'Valider' : nextLabel() }}
              </button>
            </form>
          }

          @if (last(); as a) {
            <div class="tile tile--wide correction" [class.tile--mint]="a.correct">
              @if (!a.correct) {
                <p>
                  Votre réponse : <strong class="jp">{{ a.answer || '—' }}</strong>
                </p>
              }
              <p class="solution" lang="ja">{{ a.exercise.solution }}</p>
              @if (a.trap) {
                <p class="trap">{{ a.trap }}</p>
              }
              <p>{{ a.exercise.explanation }}</p>
            </div>
          }

          <div class="row">
            @if (state() !== 'ask' && ex.choices) {
              <button type="button" class="btn btn--dark lift" (click)="next()">
                {{ nextLabel() }}
              </button>
            }
            @if (state() === 'ask') {
              <button type="button" class="btn btn--small btn--ghost" (click)="submit('')">
                Je ne sais pas
              </button>
            }
          </div>
        } @else {
          <div class="sheet">
            <span class="kicker">Bilan de la fiche</span>
            <span class="score"
              >{{ good() }}<small> / {{ answered().length }}</small></span
            >
            <p class="hint">{{ verdict() }}</p>
          </div>
          @if (mistakes().length) {
            <span class="kicker">Corrigé de vos erreurs</span>
            <ul class="mistakes">
              @for (m of mistakes(); track m.exercise.key) {
                <li>
                  <span class="jp" lang="ja">{{ m.exercise.question }}</span>
                  <span
                    >Votre réponse : <strong class="jp">{{ m.answer || '—' }}</strong> · Réponse :
                    <strong class="jp">{{ m.exercise.solution }}</strong></span
                  >
                  @if (m.trap) {
                    <strong>{{ m.trap }}</strong>
                  }
                  <span>{{ m.exercise.explanation }}</span>
                </li>
              }
            </ul>
          }
          <div class="row">
            <button type="button" class="btn btn--dark lift" (click)="newSheet()">
              Nouvelle fiche →
            </button>
          </div>
        }
      </div>

      <div class="game__side">
        <app-sound-toggle />
        <span class="pill">Niveau JLPT N5</span>
        <fieldset class="stack group">
          <legend class="kicker">Au programme</legend>
          @for (k of kinds; track k.id) {
            <label class="check">
              <input
                type="checkbox"
                [checked]="settings().kinds.includes(k.id)"
                (change)="toggleKind(k.id)"
              />
              {{ k.label }}
            </label>
          }
        </fieldset>
        <div class="stack tight">
          <span class="kicker">Longueur de la fiche</span>
          <div class="seg" role="group" aria-label="Longueur de la fiche">
            @for (n of lengths; track n) {
              <button
                type="button"
                [attr.aria-pressed]="settings().length === n"
                (click)="update({ length: n })"
              >
                {{ n }}
              </button>
            }
          </div>
        </div>
        <div class="stack tight">
          <span class="kicker">Réussite cumulée</span>
          @for (k of kinds; track k.id) {
            @let s = stats()[k.id];
            <div class="bar">
              <span>{{ k.label }}</span>
              <span>{{ s ? rate(s) + ' %' : '–' }}</span>
              <span class="meter"><span [style.width.%]="s ? rate(s) : 0"></span></span>
            </div>
          }
        </div>
        <p class="note">
          Chaque fiche est tirée au hasard et corrigée sur-le-champ : la règle est rappelée à chaque
          réponse, et les erreurs classiques (を avec すき, かえる conjugué comme 食べる…) ont leur
          propre explication.
        </p>
      </div>
    </div>
  `,
})
export class Exercices {
  protected readonly kinds = EXERCISE_KINDS;
  protected readonly lengths = LENGTHS;

  protected readonly settings = signal<Settings>({
    ...DEFAULT_SETTINGS,
    ...readStored<Partial<Settings>>('japonais:exercices-reglages', {}),
  });
  protected readonly stats = signal<KindStats>(readStored('japonais:exercices-stats', {}));
  protected readonly sheet = signal<readonly Exercise[]>([]);
  protected readonly index = signal(0);
  protected readonly answered = signal<readonly Answered[]>([]);
  protected readonly answer = signal('');
  protected readonly finished = signal(false);

  protected readonly current = computed(() => this.sheet()[this.index()]);
  protected readonly last = computed(() => {
    const a = this.answered()[this.index()];
    return a ?? null;
  });
  protected readonly state = computed<'ask' | 'ok' | 'ko'>(() => {
    const a = this.last();
    return !a ? 'ask' : a.correct ? 'ok' : 'ko';
  });
  protected readonly progress = computed(() =>
    this.sheet().map((_, i) => {
      const a = this.answered()[i];
      return a ? (a.correct ? 'ok' : 'ko') : i === this.index() ? 'current' : 'todo';
    }),
  );
  protected readonly good = computed(() => this.answered().filter((a) => a.correct).length);
  protected readonly mistakes = computed(() => this.answered().filter((a) => !a.correct));
  protected readonly nextLabel = computed(() =>
    this.index() + 1 >= this.sheet().length ? 'Voir le bilan' : 'Suivant →',
  );
  protected readonly verdict = computed(() => {
    const ratio = this.good() / Math.max(1, this.answered().length);
    return ratio === 1
      ? 'Sans faute !'
      : ratio >= 0.8
        ? 'Très bien : relisez le corrigé des quelques erreurs.'
        : ratio >= 0.5
          ? 'Pas mal : le corrigé ci-dessous rappelle chaque règle.'
          : 'À retravailler : lisez le corrigé, puis refaites une fiche.';
  });

  private readonly answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');

  constructor() {
    loadJapaneseFont();
    this.newSheet(false);
  }

  protected update(patch: Partial<Settings>): void {
    this.settings.update((s) => ({ ...s, ...patch }));
    writeStored('japonais:exercices-reglages', this.settings());
    this.newSheet();
  }

  protected toggleKind(kind: ExerciseKind): void {
    const kinds = this.settings().kinds;
    const updated = kinds.includes(kind) ? kinds.filter((k) => k !== kind) : [...kinds, kind];
    this.update({ kinds: updated.length ? updated : [kind] });
  }

  protected newSheet(focus = true): void {
    this.sheet.set(makeSheet(this.settings().kinds, this.settings().length, cryptoRandomInt));
    this.index.set(0);
    this.answered.set([]);
    this.answer.set('');
    this.finished.set(false);
    this.focus(focus);
  }

  protected submitOrNext(): void {
    if (this.state() !== 'ask') {
      this.next();
    } else if (this.answer().trim()) {
      this.submit(this.answer());
    }
  }

  protected submit(answer: string): void {
    if (this.state() !== 'ask') {
      return;
    }
    const exercise = this.current();
    const correct = checkExercise(exercise, answer);
    const entry: Answered = {
      exercise,
      answer: answer.trim(),
      correct,
      trap: correct ? null : diagnose(exercise, answer),
    };
    this.answered.update((list) => {
      const copy = [...list];
      copy[this.index()] = entry;
      return copy;
    });
    this.answer.set(answer.trim());
    answerSound(correct ? 'ok' : 'ko', correct ? this.streak() : 0);
    this.stats.update((s) => {
      const k = s[exercise.kind] ?? { ok: 0, total: 0 };
      return { ...s, [exercise.kind]: { ok: k.ok + (correct ? 1 : 0), total: k.total + 1 } };
    });
    writeStored('japonais:exercices-stats', this.stats());
  }

  /** Bonnes réponses d'affilée en fin de fiche (pour faire monter le carillon). */
  private streak(): number {
    const list = this.answered();
    let n = 0;
    for (let i = list.length - 1; i >= 0 && list[i]?.correct; i -= 1) {
      n += 1;
    }
    return n;
  }

  protected next(): void {
    if (this.index() + 1 >= this.sheet().length) {
      finishSound(this.good() >= 0.8 * this.sheet().length);
      this.finished.set(true);
      return;
    }
    this.index.update((i) => i + 1);
    this.answer.set('');
    this.focus(true);
  }

  protected resultOf(option: string): 'ok' | 'ko' | null {
    const a = this.last();
    if (!a) {
      return null;
    }
    if (a.exercise.answers.includes(option)) {
      return 'ok';
    }
    return option === a.answer ? 'ko' : null;
  }

  protected rate(s: { ok: number; total: number }): number {
    return Math.round((100 * s.ok) / Math.max(1, s.total));
  }

  private focus(enabled: boolean): void {
    if (enabled) {
      queueMicrotask(() => this.answerInput()?.nativeElement.focus());
    }
  }
}
