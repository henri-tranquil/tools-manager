import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { cue, finishSound, ring } from '../../../shared/beep';
import { Countdown } from '../../../shared/countdown';
import { SoundToggle } from '../../../shared/sound-toggle';
import { cryptoRandomInt } from '../../../shared/random';
import { readStored, writeStored } from '../../../shared/storage';
import { loadJapaneseFont, useSpeech } from '../japanese';
import { VoicePicker } from '../voice-picker';
import {
  buildExam,
  ExamFormat,
  ExamResult,
  ExamSection,
  markParts,
  N5_SCALE,
  PLANS,
  scoreExam,
  TYPE_LABELS,
} from '../jlpt';

type Phase = 'intro' | 'section' | 'pause' | 'results';

interface Attempt {
  readonly date: string;
  readonly format: ExamFormat;
  readonly total: number;
  readonly passed: boolean;
}

const LEVELS: readonly { n: string; label: string; detail: string }[] = [
  { n: 'N5', label: 'Débutant', detail: '≈ 100 kanji, 800 mots : phrases simples du quotidien.' },
  { n: 'N4', label: 'Élémentaire', detail: '≈ 300 kanji, 1 500 mots : conversations courantes.' },
  {
    n: 'N3',
    label: 'Intermédiaire',
    detail: '≈ 650 kanji : textes du quotidien, débit presque naturel.',
  },
  {
    n: 'N2',
    label: 'Avancé',
    detail: '≈ 1 000 kanji : journaux, demandé par beaucoup d’employeurs.',
  },
  { n: 'N1', label: 'Courant', detail: '≈ 2 000 kanji : textes abstraits, débit naturel.' },
];

@Component({
  selector: 'app-jlpt',
  imports: [VoicePicker, SoundToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .ticket {
      display: flex;
      flex-wrap: wrap;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }
    .ticket__level {
      display: grid;
      place-items: center;
      min-width: 120px;
      padding: 18px;
      background: var(--ink);
      color: var(--yellow);
      font-family: var(--font-display);
      font-size: 52px;
      letter-spacing: -0.04em;
    }
    .ticket__body {
      flex: 999 1 280px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 18px 20px;
      border-left: var(--bw) dashed var(--ink);
    }
    .ticket__title {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(22px, 3vw, 28px);
      letter-spacing: -0.02em;
    }
    .info {
      border: var(--bw-thin) solid var(--ink);
      border-radius: var(--radius);
      background: var(--paper);

      summary {
        padding: 12px 16px;
        font-weight: 700;
        cursor: pointer;
      }
    }
    .info__body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 16px 16px;

      p,
      ul {
        margin: 0;
      }
      ul {
        padding-left: 18px;
      }
    }
    .levels {
      display: grid;
      gap: 6px;
      padding: 0 !important;
      list-style: none;

      li {
        display: flex;
        gap: 10px;
        align-items: baseline;
      }
      b {
        flex: none;
        width: 36px;
        font-family: var(--font-display);
      }
    }
    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .sheet-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      button {
        width: 36px;
        height: 36px;
        border: var(--bw-thin) solid var(--ink);
        border-radius: 50%;
        background: var(--paper);
        font-family: var(--font-mono);
        font-weight: 700;
        cursor: pointer;

        &[data-done='true'] {
          background: var(--ink);
          color: var(--paper);
        }
        &[aria-current='true'] {
          outline: 3px solid var(--coral);
          outline-offset: 2px;
        }
      }
    }
    .question {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-lg);
    }
    .prompt {
      margin: 0;
      font-family: var(--font-jp);
      font-size: clamp(20px, 3.4vw, 28px);
      line-height: 1.7;
      overflow-wrap: anywhere;

      u {
        text-decoration-thickness: 3px;
        text-underline-offset: 6px;
      }
    }
    .passage {
      margin: 0;
      padding: 14px 16px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: var(--radius);
      background: var(--cream);
      font-family: var(--font-jp);
      font-size: 18px;
      line-height: 1.8;
      white-space: pre-line;
    }
    .choice {
      font-family: var(--font-jp);
      font-size: 18px;
      text-align: left;

      &[aria-pressed='true'] {
        background: var(--yellow);
      }
    }
    .clock {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 22px;

      &[data-low='true'] {
        color: #b3261e;
      }
    }
    .score {
      font-family: var(--font-display);
      font-size: clamp(56px, 10vw, 88px);
      line-height: 1;
      letter-spacing: -0.04em;

      small {
        font-size: 0.35em;
      }
    }
    .review {
      display: flex;
      flex-direction: column;
      gap: 10px;
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
    .tight {
      gap: 8px;
    }
  `,
  template: `
    @switch (phase()) {
      @case ('intro') {
        <div class="stack">
          <div class="ticket">
            <span class="ticket__level" aria-hidden="true">N5</span>
            <div class="ticket__body">
              <span class="kicker">Examen blanc · convocation</span>
              <h3 class="ticket__title">JLPT N5 en conditions réelles</h3>
              <div class="chips">
                @for (s of planSections(); track s.id) {
                  <span class="tag">{{ s.fr }} · {{ s.minutes }} min · {{ s.count }} q.</span>
                }
              </div>
              <div class="seg" role="group" aria-label="Format">
                <button
                  type="button"
                  [attr.aria-pressed]="format() === 'complet'"
                  (click)="setFormat('complet')"
                >
                  Complet · 90 min
                </button>
                <button
                  type="button"
                  [attr.aria-pressed]="format() === 'court'"
                  (click)="setFormat('court')"
                >
                  Court · 30 min
                </button>
              </div>
              <app-voice-picker [speech]="speech" />
              <label class="check">
                <input
                  type="checkbox"
                  [checked]="singleListen()"
                  (change)="singleListen.set(!singleListen())"
                />
                Une seule écoute par piste, comme à l'examen
              </label>
              <div class="row">
                <button type="button" class="btn btn--dark lift" (click)="start()">
                  Commencer l'épreuve →
                </button>
              </div>
            </div>
          </div>

          <details class="info">
            <summary>ⓘ Comment marche le JLPT ?</summary>
            <div class="info__body">
              <p>
                Le <strong>JLPT</strong> (Japanese-Language Proficiency Test, 日本語能力試験) est
                l'examen officiel de japonais pour les non-natifs, organisé par la Japan Foundation
                et JEES. Il compte cinq niveaux, du N5 au N1, et on choisit librement le sien.
              </p>
              <ul class="levels">
                @for (l of levels; track l.n) {
                  <li>
                    <b>{{ l.n }}</b><span
                      ><strong>{{ l.label }}</strong> — {{ l.detail }}</span
                    >
                  </li>
                }
              </ul>
              <ul>
                <li>
                  <strong>Deux sessions par an</strong>, en juillet et en décembre (le premier
                  dimanche), sur papier. Toutes ne sont pas ouvertes partout : en France, quelques
                  centres seulement, inscriptions plusieurs mois à l'avance.
                </li>
                <li>
                  <strong>Que des QCM</strong> : vocabulaire, grammaire, lecture et écoute. Ni
                  expression orale ni écrite.
                </li>
                <li>
                  <strong>Le N5</strong> : vocabulaire (20 min), grammaire et lecture (40 min),
                  écoute (30 min).
                </li>
                <li>
                  <strong>Notation du N5</strong> : {{ scale.max }} points, dont
                  {{ scale.language.max }} pour les connaissances et la lecture, et
                  {{ scale.listening.max }} pour l'écoute. Il faut au moins {{ scale.pass }} points
                  au total, et au moins {{ scale.language.min }} et {{ scale.listening.min }} dans
                  chaque partie.
                </li>
                <li>
                  Les résultats arrivent environ deux mois plus tard ; le certificat n'expire pas.
                </li>
              </ul>
              <p class="note">
                Ce simulateur imite le format avec des questions originales (les sujets officiels
                sont protégés). Chaque examen est tiré au hasard et privilégie les questions que
                vous n'avez pas encore vues : trois examens complets d'affilée ne se répètent pas.
                Le vrai JLPT ajuste les points selon la difficulté de chaque session : le score
                affiché ici est une estimation. Détails et dates officiels :
                <a href="https://www.jlpt.jp/e/" target="_blank" rel="noopener"
                  >jlpt.jp<span class="visually-hidden"> (nouvel onglet)</span></a
                >.
              </p>
            </div>
          </details>

          @if (history().length) {
            <div class="stack tight">
              <span class="kicker">Derniers essais</span>
              <div class="chips">
                @for (a of history(); track $index) {
                  <span class="tag"
                    >{{ a.date }} · {{ a.format }} · {{ a.total }}/180 ·
                    {{ a.passed ? 'réussi' : 'échoué' }}</span
                  >
                }
              </div>
            </div>
          }
        </div>
      }

      @case ('section') {
        @let s = section();
        @let q = question();
        <div class="stack">
          <div class="bar">
            <span class="kicker"
              >Épreuve {{ sectionIndex() + 1 }} / 3 · <span class="jp">{{ s.ja }}</span> ·
              {{ s.fr }}</span
            >
            <span
              class="clock"
              role="timer"
              aria-label="Temps restant"
              [attr.data-low]="timer.remaining() < 60"
              >{{ timer.display() }}</span
            >
            <app-sound-toggle />
          </div>
          <nav class="sheet-nav" aria-label="Questions de l'épreuve">
            @for (item of s.questions; track item.id) {
              <button
                type="button"
                [attr.data-done]="answers()[sectionIndex()][$index] !== null"
                [attr.aria-current]="$index === questionIndex()"
                [attr.aria-label]="'Question ' + ($index + 1)"
                (click)="go($index)"
              >
                {{ $index + 1 }}
              </button>
            }
          </nav>

          <div class="question">
            <span class="kicker"
              >{{ questionIndex() + 1 }}. <span class="jp">{{ labels[q.type].ja }}</span> ·
              {{ labels[q.type].help }}</span
            >
            @if (q.passage) {
              <p class="passage" lang="ja">{{ q.passage }}</p>
            }
            @if (q.situation) {
              <p>
                <strong>{{ q.situation }}</strong>
              </p>
            }
            @if (q.prompt) {
              <p class="prompt" lang="ja">
                @for (part of parts(q.prompt); track $index) {
                  @if (part.mark) {
                    <u>{{ part.text }}</u>
                  } @else {
                    {{ part.text }}
                  }
                }
              </p>
            }
            @if (q.note && q.type !== 'yomi' && q.type !== 'hyouki') {
              <span class="note">{{ q.note }}</span>
            }
            @if (q.audio) {
              <div class="row">
                <button
                  type="button"
                  class="btn lift"
                  [disabled]="!speech.available() || (singleListen() && played().has(q.id))"
                  (click)="play()"
                >
                  {{
                    speech.speaking()
                      ? 'Lecture…'
                      : played().has(q.id)
                        ? 'Réécouter ♪'
                        : 'Écouter ♪'
                  }}
                </button>
                @if (!speech.available()) {
                  <span class="note">Aucune voix japonaise dans ce navigateur.</span>
                }
              </div>
            }
          </div>

          <div class="choice-grid" role="group" aria-label="Propositions">
            @for (option of q.options; track $index) {
              <button
                type="button"
                class="choice lift"
                lang="ja"
                [attr.aria-pressed]="answers()[sectionIndex()][questionIndex()] === $index"
                (click)="choose($index)"
              >
                {{ $index + 1 }}. {{ q.hiddenOptions ? '' : option }}
              </button>
            }
          </div>

          <div class="row">
            <button
              type="button"
              class="btn btn--small lift"
              [disabled]="questionIndex() === 0"
              (click)="go(questionIndex() - 1)"
            >
              ← Précédente
            </button>
            @if (questionIndex() + 1 < s.questions.length) {
              <button type="button" class="btn btn--small lift" (click)="go(questionIndex() + 1)">
                Suivante →
              </button>
            }
            <button type="button" class="btn btn--dark lift" (click)="endSection()">
              Rendre la copie ({{ answeredCount() }}/{{ s.questions.length }})
            </button>
          </div>
        </div>
      }

      @case ('pause') {
        <div class="ticket">
          <span class="ticket__level" aria-hidden="true">休</span>
          <div class="ticket__body">
            <span class="kicker">Pause</span>
            <h3 class="ticket__title">Épreuve {{ sectionIndex() + 1 }} terminée</h3>
            <p>
              Prochaine épreuve : <span class="jp">{{ nextSection()?.ja }}</span> ·
              {{ nextSection()?.fr }} ({{ nextSection()?.minutes }} min).
            </p>
            <div class="row">
              <button type="button" class="btn btn--dark lift" (click)="nextSectionStart()">
                Commencer →
              </button>
            </div>
          </div>
        </div>
      }

      @case ('results') {
        @if (result(); as r) {
          <div class="tool-layout">
            <div class="stack">
              <div class="ticket">
                <span class="ticket__level" aria-hidden="true">{{
                  r.passed ? '合格' : '不合格'
                }}</span>
                <div class="ticket__body">
                  <span class="kicker">Résultat estimé</span>
                  <span class="score"
                    >{{ r.total }}<small> / {{ scale.max }}</small></span
                  >
                  <strong>{{
                    r.passed
                      ? 'Réussi : seuil de ' + scale.pass + ' points atteint.'
                      : 'Pas encore : ' + r.reasons.join(' ')
                  }}</strong>
                </div>
              </div>
              <div class="stats">
                <div class="tile" [class.tile--mint]="r.language.points >= r.language.min">
                  <span class="kicker">Connaissances + lecture</span>
                  <span class="tile__value"
                    >{{ r.language.points }}<small> / {{ r.language.max }}</small></span
                  >
                  <span class="note"
                    >{{ r.language.correct }}/{{ r.language.total }} justes · min
                    {{ r.language.min }}</span
                  >
                </div>
                <div class="tile" [class.tile--mint]="r.listening.points >= r.listening.min">
                  <span class="kicker">Écoute</span>
                  <span class="tile__value"
                    >{{ r.listening.points }}<small> / {{ r.listening.max }}</small></span
                  >
                  <span class="note"
                    >{{ r.listening.correct }}/{{ r.listening.total }} justes · min
                    {{ r.listening.min }}</span
                  >
                </div>
              </div>
              <table class="table">
                <caption class="visually-hidden">
                  Résultats par type de question
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Justes</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of r.byType; track t.type) {
                    <tr>
                      <td>
                        <span class="jp">{{ labels[t.type].ja }}</span> · {{ labels[t.type].fr }}
                      </td>
                      <td>{{ t.correct }} / {{ t.total }}</td>
                    </tr>
                  }
                </tbody>
              </table>
              <div class="row">
                <button type="button" class="btn btn--dark lift" (click)="reset()">
                  Nouvel examen →
                </button>
              </div>
            </div>
            <div class="stack">
              <span class="kicker">Corrigé · {{ mistakes().length }} erreur(s)</span>
              <ul class="review">
                @for (m of mistakes(); track m.id) {
                  <li>
                    <span class="note">{{ labels[m.type].fr }}</span>
                    @if (m.prompt) {
                      <span class="jp" lang="ja">{{ m.prompt }}</span>
                    }
                    <span
                      >Votre réponse : <strong class="jp">{{ m.given ?? '—' }}</strong> · Bonne
                      réponse : <strong class="jp">{{ m.correct }}</strong></span
                    >
                    <span>{{ m.explanation }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>
        }
      }
    }
  `,
})
export class Jlpt {
  protected readonly labels = TYPE_LABELS;
  protected readonly levels = LEVELS;
  protected readonly scale = N5_SCALE;
  protected readonly speech = useSpeech();
  /** Bips d'avertissement à 5 min et 1 min de la fin, sonnerie quand le temps est écoulé. */
  protected readonly timer = new Countdown(
    () => {
      // À la dernière épreuve, c'est l'arpège des résultats qui sonne.
      if (this.sectionIndex() + 1 < this.sections().length) {
        ring(3, 660);
      }
      this.endSection();
    },
    {
      onSecond: (left) => {
        if (left === 300 || left === 60) {
          cue('warning');
        }
      },
    },
  );

  protected readonly phase = signal<Phase>('intro');
  protected readonly format = signal<ExamFormat>(
    readStored<ExamFormat>('japonais:jlpt-format', 'court'),
  );
  protected readonly singleListen = signal(true);
  protected readonly sections = signal<readonly ExamSection[]>([]);
  protected readonly answers = signal<readonly (readonly (number | null)[])[]>([]);
  protected readonly sectionIndex = signal(0);
  protected readonly questionIndex = signal(0);
  protected readonly played = signal<ReadonlySet<string>>(new Set());
  protected readonly result = signal<ExamResult | null>(null);
  protected readonly history = signal<readonly Attempt[]>(
    readStored<Attempt[]>('japonais:jlpt-essais', []),
  );

  protected readonly planSections = computed(() => {
    const plan = PLANS[this.format()];
    const names = { moji: 'Vocabulaire', bunpou: 'Grammaire · lecture', choukai: 'Écoute' };
    return (Object.keys(plan) as (keyof typeof plan)[]).map((id) => ({
      id,
      fr: names[id],
      minutes: plan[id].minutes,
      count: Object.values(plan[id].counts).reduce((a, b) => a + (b ?? 0), 0),
    }));
  });
  protected readonly section = computed(() => this.sections()[this.sectionIndex()]);
  protected readonly nextSection = computed(() => this.sections()[this.sectionIndex() + 1]);
  protected readonly question = computed(() => this.section().questions[this.questionIndex()]);
  protected readonly answeredCount = computed(
    () => (this.answers()[this.sectionIndex()] ?? []).filter((a) => a !== null).length,
  );
  protected readonly mistakes = computed(() =>
    this.sections().flatMap((s, si) =>
      s.questions
        .map((q, qi) => ({ q, given: this.answers()[si]?.[qi] ?? null }))
        .filter(({ q, given }) => given !== q.answer)
        .map(({ q, given }) => ({
          id: q.id,
          type: q.type,
          prompt: (q.prompt || q.situation || '').replace(/\[\[|]]/g, ''),
          given: given === null ? null : q.options[given],
          correct: q.options[q.answer],
          explanation: q.explanation,
        })),
    ),
  );

  constructor() {
    loadJapaneseFont();
    inject(DestroyRef).onDestroy(() => this.timer.dispose());
  }

  protected setFormat(format: ExamFormat): void {
    this.format.set(format);
    writeStored('japonais:jlpt-format', format);
  }

  protected start(): void {
    const seen = readStored<string[]>('japonais:jlpt-vues', []);
    const sections = buildExam(this.format(), cryptoRandomInt, seen);
    // Questions posées : elles ne reviendront qu'une fois les autres épuisées.
    const asked = sections.flatMap((s) => s.questions.map((q) => q.id));
    writeStored(
      'japonais:jlpt-vues',
      [...seen.filter((id) => !asked.includes(id)), ...asked].slice(-400),
    );
    this.sections.set(sections);
    this.answers.set(sections.map((s) => s.questions.map(() => null)));
    this.played.set(new Set());
    this.result.set(null);
    this.sectionIndex.set(0);
    this.beginSection();
  }

  private beginSection(): void {
    this.questionIndex.set(0);
    this.timer.set(this.section().minutes * 60);
    this.timer.start();
    this.phase.set('section');
  }

  protected go(index: number): void {
    this.speech.cancel();
    this.questionIndex.set(Math.max(0, Math.min(index, this.section().questions.length - 1)));
  }

  protected choose(option: number): void {
    const si = this.sectionIndex();
    const qi = this.questionIndex();
    this.answers.update((all) =>
      all.map((row, i) => (i === si ? row.map((a, j) => (j === qi ? option : a)) : row)),
    );
  }

  protected play(): void {
    const q = this.question();
    if (!q.audio || (this.singleListen() && this.played().has(q.id))) {
      return;
    }
    this.played.update((s) => new Set([...s, q.id]));
    void this.speech.speakLines(q.audio, 1, q.hiddenOptions ? 700 : 450);
  }

  protected endSection(): void {
    if (this.phase() !== 'section') {
      return;
    }
    this.timer.set(0);
    this.speech.cancel();
    if (this.sectionIndex() + 1 < this.sections().length) {
      this.phase.set('pause');
    } else {
      this.finish();
    }
  }

  protected nextSectionStart(): void {
    this.sectionIndex.update((i) => i + 1);
    this.beginSection();
  }

  private finish(): void {
    const result = scoreExam(this.sections(), this.answers());
    this.result.set(result);
    this.phase.set('results');
    finishSound(result.passed);
    const attempt: Attempt = {
      date: new Date().toLocaleDateString('fr-FR'),
      format: this.format(),
      total: result.total,
      passed: result.passed,
    };
    this.history.update((h) => [attempt, ...h].slice(0, 6));
    writeStored('japonais:jlpt-essais', this.history());
  }

  protected reset(): void {
    this.phase.set('intro');
  }

  protected parts(text: string) {
    return markParts(text);
  }
}
