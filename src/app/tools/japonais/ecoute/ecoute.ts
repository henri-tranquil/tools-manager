import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { answerSound } from '../../../shared/beep';
import { cryptoRandomInt } from '../../../shared/random';
import { SoundToggle } from '../../../shared/sound-toggle';
import { readStored, writeStored } from '../../../shared/storage';
import { Dialogue, DIALOGUES, REPLIES, Reply } from '../data/listening';
import { PHRASES } from '../data/phrases';
import { loadJapaneseFont, useSpeech } from '../japanese';
import { VoicePicker } from '../voice-picker';
import {
  dialogueLines,
  Question,
  replyLines,
  shuffleChoices,
  SoundQuestion,
  soundQuestion,
  SoundTarget,
} from '../listening';
import { checkTranscription, parsePhrase, Phrase } from '../phrases';
import {
  accuracy,
  choices,
  EMPTY_SCORE,
  nextScore,
  pickWeighted,
  recordAnswer,
  remember,
  StatsMap,
} from '../quiz';

type Mode = 'dictee' | 'sens' | 'son' | 'dialogue' | 'reponse';
type State = 'ask' | 'ok' | 'close' | 'ko';

interface Settings {
  readonly mode: Mode;
  readonly rate: number;
  /** Mode « son → caractère » : choisir parmi des kana ou des mots en kanji. */
  readonly target: SoundTarget;
}

const MODES: readonly { id: Mode; label: string; help: string }[] = [
  { id: 'dictee', label: 'Dictée', help: 'Écoutez la phrase et écrivez-la en rōmaji ou en kana.' },
  { id: 'sens', label: 'Sens', help: 'Écoutez la phrase et choisissez sa traduction.' },
  {
    id: 'son',
    label: 'Son → caractère',
    help: 'Écoutez le son et choisissez le kana ou le mot en kanji qui correspond.',
  },
  {
    id: 'dialogue',
    label: 'Dialogues',
    help: 'Lisez la situation et la question, écoutez le dialogue, puis répondez.',
  },
  {
    id: 'reponse',
    label: 'Réponse',
    help: 'Écoutez la réplique et les trois réponses numérotées : laquelle convient ?',
  },
];

const RATES: readonly { value: number; label: string }[] = [
  { value: 0.75, label: 'Lent' },
  { value: 1, label: 'Normal' },
  { value: 1.2, label: 'Rapide' },
];

/** Phrases courtes et moyennes : les plus longues se prêtent mal à la dictée. */
const ALL_PHRASES = PHRASES.map(parsePhrase).filter((p) => p.level < 3);

@Component({
  selector: 'app-ecoute',
  imports: [SoundToggle, VoicePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .player {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 26px 20px 22px;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius-lg);
      background:
        radial-gradient(circle, rgb(17 17 17 / 0.12) 1.2px, transparent 1.4px) 0 0 / 16px 16px,
        var(--paper);
      box-shadow: var(--shadow-lg);
      text-align: center;
    }
    .play {
      display: grid;
      place-items: center;
      width: 112px;
      aspect-ratio: 1;
      border: var(--bw) solid var(--ink);
      border-radius: 50%;
      background: var(--coral);
      box-shadow: var(--shadow);
      font-family: var(--font-display);
      font-size: 40px;
      cursor: pointer;

      &[data-speaking='true'] {
        background: var(--yellow);
        animation: pulse 1s ease-in-out infinite;
      }
    }
    .situation {
      margin: 0;
      font-weight: 700;
      font-size: 18px;
    }
    .listens {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .choice {
      font-size: 16px;
      text-align: left;
    }
    .choice--glyph {
      text-align: center;
      font-family: var(--font-jp-display);
      font-size: 34px;
    }
    .choice--number {
      text-align: center;
      font-family: var(--font-display);
      font-size: 26px;
    }
    .script {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
      font-family: var(--font-jp);
      font-size: 19px;

      li {
        display: flex;
        gap: 10px;
        align-items: baseline;
      }
    }
    .who {
      flex: none;
      padding: 0 8px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 999px;
      background: var(--sky);
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;

      &--f {
        background: var(--peach);
      }
    }
    .romaji {
      font-family: var(--font-mono);
      font-weight: 700;
    }
    .warning {
      padding: 12px 14px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: var(--radius);
      background: var(--yellow-soft);
      font-weight: 700;
    }
    .tight {
      gap: 8px;
    }
    @keyframes pulse {
      50% {
        transform: scale(1.06);
      }
    }
  `,
  template: `
    <div class="game">
      <div class="game__play">
        @if (!speech.available()) {
          <p class="warning" role="status">
            Aucune voix japonaise n'est disponible dans ce navigateur. Installez-en une (Windows :
            Paramètres › Heure et langue › Voix ; macOS : Réglages › Accessibilité › Contenu énoncé
            ; Android : synthèse vocale Google) ou essayez Chrome ou Edge, qui proposent des voix en
            ligne.
          </p>
        }

        <div class="player" [attr.data-state]="state()" aria-live="polite">
          @if (state() === 'ok') {
            <span class="stamp stamp--ok">正解 · Bravo</span>
          } @else if (state() === 'close') {
            <span class="stamp">Presque</span>
          } @else if (state() === 'ko') {
            <span class="stamp stamp--ko">Raté</span>
          }
          <span class="kicker">{{ modeInfo().help }}</span>
          @if (settings().mode === 'dialogue') {
            <p class="situation">{{ dialogue().situation }}</p>
            <p class="situation">
              <span class="kicker">Question · </span>{{ dialogue().question }}
            </p>
          }
          <button
            type="button"
            class="play lift"
            [attr.data-speaking]="speech.speaking()"
            [disabled]="!speech.available()"
            (click)="play()"
            [attr.aria-label]="speech.speaking() ? 'Arrêter' : listens() ? 'Réécouter' : 'Écouter'"
          >
            {{ speech.speaking() ? '■' : '▶' }}
          </button>
          <span class="listens">{{
            listens() === 0 ? 'Appuyez pour écouter' : 'Écouté ' + listens() + ' fois'
          }}</span>
        </div>

        @switch (settings().mode) {
          @case ('dictee') {
            <form class="answer" (submit)="$event.preventDefault(); submitOrNext()">
              <label class="visually-hidden" for="ecoute-dictee">Ce que vous avez entendu</label>
              <input
                #answerInput
                id="ecoute-dictee"
                class="field field--compact"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="La phrase en rōmaji ou en kana…"
                [value]="answer()"
                (input)="answer.set(answerInput.value)"
                [readOnly]="state() !== 'ask'"
              />
              <button type="submit" class="btn btn--dark lift">
                {{ state() === 'ask' ? 'Valider' : 'Suivante →' }}
              </button>
            </form>
          }
          @case ('reponse') {
            <div class="choice-grid" role="group" aria-label="Choisissez la bonne réponse">
              @for (option of question().options; track $index) {
                <button
                  type="button"
                  class="choice choice--number lift"
                  [disabled]="state() !== 'ask'"
                  [attr.data-result]="resultOf($index)"
                  [attr.aria-label]="'Réponse ' + ($index + 1)"
                  (click)="pick($index)"
                >
                  {{ $index + 1 }}
                </button>
              }
            </div>
          }
          @default {
            <div class="choice-grid" role="group" aria-label="Choisissez la réponse">
              @for (option of question().options; track $index) {
                <button
                  type="button"
                  class="choice lift"
                  [class.choice--glyph]="settings().mode === 'son'"
                  [attr.lang]="settings().mode === 'son' ? 'ja' : null"
                  [disabled]="state() !== 'ask'"
                  [attr.data-result]="resultOf($index)"
                  (click)="pick($index)"
                >
                  {{ option }}
                </button>
              }
            </div>
          }
        }

        @if (state() !== 'ask') {
          <div class="tile tile--wide stack" [class.tile--mint]="state() === 'ok'">
            @switch (settings().mode) {
              @case ('dialogue') {
                <ul class="script" lang="ja">
                  @for (line of dialogue().lines; track $index) {
                    <li>
                      <span class="who" [class.who--f]="line.s === 1">{{
                        line.s === 1 ? '女' : '男'
                      }}</span>
                      {{ line.ja }}
                    </li>
                  }
                </ul>
                <span>{{ dialogue().explanation }}</span>
              }
              @case ('reponse') {
                <ul class="script" lang="ja">
                  <li><span class="who who--f">女</span> {{ reply().prompt }}</li>
                  @for (option of question().options; track $index) {
                    <li>
                      <span class="who">{{ $index + 1 }}</span>
                      {{ option }}{{ $index === question().answer ? ' ✓' : '' }}
                    </li>
                  }
                </ul>
                <span>{{ reply().explanation }}</span>
              }
              @case ('son') {
                <p class="script" lang="ja">
                  {{ question().options[question().answer] }}
                </p>
                <span>{{ sound().explanation }}</span>
              }
              @default {
                <p class="script" lang="ja">{{ phrase().text }}</p>
                <span class="romaji">{{ phrase().romaji }}</span>
                <strong>« {{ phrase().fr }} »</strong>
                @if (feedback()) {
                  <span>{{ feedback() }}</span>
                }
              }
            }
          </div>
        }

        <div class="row">
          @if (state() !== 'ask' && settings().mode !== 'dictee') {
            <button type="button" class="btn btn--dark lift" (click)="next()">Suivante →</button>
          }
          @if (state() === 'ask') {
            <button type="button" class="btn btn--small btn--ghost" (click)="giveUp()">
              Je ne sais pas
            </button>
          }
        </div>
      </div>

      <div class="game__side">
        <app-sound-toggle />
        <div class="seg seg--grid" role="group" aria-label="Exercice">
          @for (m of modes; track m.id) {
            <button
              type="button"
              [attr.aria-pressed]="settings().mode === m.id"
              (click)="update({ mode: m.id })"
            >
              {{ m.label }}
            </button>
          }
        </div>
        @if (settings().mode === 'son') {
          <div class="stack tight">
            <span class="kicker">Ce qu'on entend</span>
            <div class="seg" role="group" aria-label="Type de son">
              <button
                type="button"
                [attr.aria-pressed]="settings().target === 'kana'"
                (click)="update({ target: 'kana' })"
              >
                Un kana
              </button>
              <button
                type="button"
                [attr.aria-pressed]="settings().target === 'kanji'"
                (click)="update({ target: 'kanji' })"
              >
                Un mot en kanji
              </button>
            </div>
          </div>
        }
        <app-voice-picker [speech]="speech" />
        <div class="stack tight">
          <span class="kicker">Vitesse</span>
          <div class="seg" role="group" aria-label="Vitesse de lecture">
            @for (r of rates; track r.value) {
              <button
                type="button"
                [attr.aria-pressed]="settings().rate === r.value"
                (click)="setRate(r.value)"
              >
                {{ r.label }}
              </button>
            }
          </div>
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
            <span class="kicker">Pistes</span>
            <span class="tile__value">{{ deckSize() }}</span>
          </div>
        </div>
        <p class="note">
          Voix de synthèse du navigateur ; deux voix (ou une voix plus aiguë) pour les dialogues.
          @if (speech.online()) {
            Voix en ligne : le texte lu est envoyé au service de synthèse vocale de votre
            navigateur.
          }
          Dialogues et réponses suivent les épreuves d'écoute du JLPT N5.
        </p>
      </div>
    </div>
  `,
})
export class Ecoute {
  protected readonly modes = MODES;
  protected readonly rates = RATES;
  protected readonly speech = useSpeech();

  protected readonly settings = signal<Settings>({
    mode: 'dictee',
    rate: 1,
    target: 'kana',
    ...readStored<Partial<Settings>>('japonais:ecoute-reglages', {}),
  });
  private readonly stats = signal<StatsMap>(readStored('japonais:ecoute-stats', {}));
  protected readonly score = signal(EMPTY_SCORE);
  protected readonly phrase = signal<Phrase>(ALL_PHRASES[0]);
  protected readonly dialogue = signal<Dialogue>(DIALOGUES[0]);
  protected readonly reply = signal<Reply>(REPLIES[0]);
  protected readonly sound = signal<SoundQuestion>({
    key: '',
    spoken: '',
    options: [],
    answer: 0,
    explanation: '',
  });
  protected readonly question = signal<Question>({ options: [], answer: 0 });
  protected readonly answer = signal('');
  protected readonly state = signal<State>('ask');
  protected readonly feedback = signal('');
  protected readonly listens = signal(0);
  private readonly picked = signal<number | null>(null);

  protected readonly modeInfo = computed(
    () => MODES.find((m) => m.id === this.settings().mode) ?? MODES[0],
  );
  protected readonly precision = computed(() => accuracy(this.score()));
  protected readonly deckSize = computed(() => {
    switch (this.settings().mode) {
      case 'dialogue':
        return DIALOGUES.length;
      case 'reponse':
        return REPLIES.length;
      case 'son':
        return 40;
      default:
        return ALL_PHRASES.length;
    }
  });

  private recent: string[] = [];
  private readonly answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');

  constructor() {
    loadJapaneseFont();
    this.next(false);
  }

  protected update(patch: Partial<Settings>): void {
    this.settings.update((s) => ({ ...s, ...patch }));
    writeStored('japonais:ecoute-reglages', this.settings());
    this.recent = [];
    this.next();
  }

  protected setRate(rate: number): void {
    this.settings.update((s) => ({ ...s, rate }));
    writeStored('japonais:ecoute-reglages', this.settings());
  }

  private key(): string {
    const mode = this.settings().mode;
    if (mode === 'son') {
      return this.sound().key;
    }
    const id =
      mode === 'dialogue'
        ? this.dialogue().id
        : mode === 'reponse'
          ? this.reply().id
          : this.phrase().id;
    return `${mode}:${id}`;
  }

  protected next(focus = true): void {
    this.speech.cancel();
    const mode = this.settings().mode;
    const stats = this.stats();
    if (mode === 'son') {
      // Quelques tirages pour éviter de reposer un son entendu à l'instant.
      let q = soundQuestion(this.settings().target, cryptoRandomInt);
      for (let i = 0; i < 10 && this.recent.includes(q.key); i++) {
        q = soundQuestion(this.settings().target, cryptoRandomInt);
      }
      this.sound.set(q);
      this.question.set({ options: q.options, answer: q.answer });
    } else if (mode === 'dialogue') {
      const d = pickWeighted(
        DIALOGUES,
        (x) => `dialogue:${x.id}`,
        stats,
        cryptoRandomInt,
        this.recent,
      );
      if (d) {
        this.dialogue.set(d);
        this.question.set(shuffleChoices(d.choices, cryptoRandomInt));
      }
    } else if (mode === 'reponse') {
      const r = pickWeighted(
        REPLIES,
        (x) => `reponse:${x.id}`,
        stats,
        cryptoRandomInt,
        this.recent,
      );
      if (r) {
        this.reply.set(r);
        this.question.set(shuffleChoices(r.choices, cryptoRandomInt));
      }
    } else {
      const p = pickWeighted(
        ALL_PHRASES,
        (x) => `${mode}:${x.id}`,
        stats,
        cryptoRandomInt,
        this.recent,
      );
      if (p) {
        this.phrase.set(p);
        const options = choices(
          p.fr,
          ALL_PHRASES.map((x) => x.fr),
          4,
          cryptoRandomInt,
        );
        this.question.set({ options, answer: options.indexOf(p.fr) });
      }
    }
    this.recent = remember(this.recent, this.key(), this.deckSize());
    this.answer.set('');
    this.feedback.set('');
    this.picked.set(null);
    this.state.set('ask');
    this.listens.set(0);
    if (focus) {
      queueMicrotask(() => this.answerInput()?.nativeElement.focus());
    }
  }

  protected play(): void {
    if (this.speech.speaking()) {
      this.speech.cancel();
      return;
    }
    this.listens.update((n) => n + 1);
    const rate = this.settings().rate;
    switch (this.settings().mode) {
      case 'dialogue':
        void this.speech.speakLines(dialogueLines(this.dialogue()), rate);
        break;
      case 'reponse':
        void this.speech.speakLines(replyLines(this.reply(), this.question().options), rate, 700);
        break;
      case 'son':
        void this.speech.speak(this.sound().spoken, { rate });
        break;
      default:
        void this.speech.speak(this.phrase().text, { rate });
    }
  }

  protected submitOrNext(): void {
    if (this.state() !== 'ask') {
      this.next();
      return;
    }
    const answer = this.answer();
    if (!answer.trim()) {
      return;
    }
    const verdict = checkTranscription(answer, this.phrase());
    const messages: Record<string, string> = {
      'long-vowels': 'Juste, aux voyelles longues près (ou, ō, ー…).',
      particle: 'Juste, mais les particules は, へ, を se prononcent wa, e, o.',
      wrong: '',
      exact: '',
    };
    this.feedback.set(messages[verdict]);
    this.grade(verdict === 'exact' ? 'ok' : verdict === 'wrong' ? 'ko' : 'close');
  }

  protected pick(index: number): void {
    if (this.state() === 'ask') {
      this.picked.set(index);
      this.grade(index === this.question().answer ? 'ok' : 'ko');
    }
  }

  protected giveUp(): void {
    this.grade('ko');
  }

  private grade(state: Exclude<State, 'ask'>): void {
    if (this.state() !== 'ask') {
      return;
    }
    this.state.set(state);
    const correct = state !== 'ko';
    this.score.update((s) => nextScore(s, correct));
    answerSound(state, this.score().streak);
    this.stats.update((s) => recordAnswer(s, this.key(), state === 'ok'));
    writeStored('japonais:ecoute-stats', this.stats());
  }

  protected resultOf(index: number): 'ok' | 'ko' | null {
    if (this.state() === 'ask') {
      return null;
    }
    if (index === this.question().answer) {
      return 'ok';
    }
    return index === this.picked() ? 'ko' : null;
  }
}
