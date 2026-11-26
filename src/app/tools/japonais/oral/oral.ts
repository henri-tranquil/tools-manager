import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { cryptoRandomInt } from '../../../shared/random';
import { readStored, writeStored } from '../../../shared/storage';
import { REPLIES, Reply } from '../data/listening';
import { PhraseLevel, PHRASES } from '../data/phrases';
import { VOCAB, VocabWord } from '../data/vocab';
import { furigana, loadTokenizer, Tokenizer } from '../dictionary';
import { loadJapaneseFont, useSpeech } from '../japanese';
import { kanaToRomaji, toHiragana } from '../kana';
import { parsePhrase, Phrase } from '../phrases';
import { pickWeighted, recordAnswer, remember, StatsMap } from '../quiz';
import {
  bestComparison,
  Comparison,
  speakingVerdict,
  spellNumbers,
  spokenReading,
  VERDICTS,
} from '../speaking';
import { VoicePicker } from '../voice-picker';

/* La reconnaissance vocale n'a pas encore de types standard dans TypeScript. */
interface RecognitionAlternative {
  readonly transcript: string;
}
interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: RecognitionAlternative;
}
interface RecognitionEvent {
  readonly results: { readonly length: number; [index: number]: RecognitionResult };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | undefined {
  const w = globalThis as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

type Mode = 'lire' | 'mots' | 'repondre';
type Status = 'idle' | 'listening' | 'analysing' | 'done';

interface Settings {
  readonly mode: Mode;
  readonly levels: readonly PhraseLevel[];
  readonly furigana: boolean;
}

/** Ce qu'il faut dire : texte affiché, lecture attendue (si connue d'avance), aide. */
interface Target {
  readonly key: string;
  readonly text: string;
  /** Lecture prononcée attendue ; absente, elle est calculée avec kuromoji. */
  readonly reading?: string;
  readonly ruby: readonly { text: string; ruby?: string }[];
  readonly fr: string;
  /** Ce que la voix lit comme modèle. */
  readonly model: string;
  /** Mode « répondre » : la réplique à laquelle on répond. */
  readonly prompt?: string;
}

const MODES: readonly { id: Mode; label: string; help: string }[] = [
  { id: 'lire', label: 'Lire à voix haute', help: 'Lisez la phrase à voix haute.' },
  { id: 'mots', label: 'Mots', help: 'Prononcez ce mot.' },
  {
    id: 'repondre',
    label: 'Répondre',
    help: 'Écoutez la réplique et répondez à voix haute avec la réponse attendue.',
  },
];

const LEVELS: readonly { id: PhraseLevel; label: string }[] = [
  { id: 1, label: 'Kana' },
  { id: 2, label: 'Premiers kanji' },
  { id: 3, label: 'Phrases longues' },
];

const ALL_PHRASES = PHRASES.map(parsePhrase);

const phraseTarget = (p: Phrase): Target => ({
  key: `lire:${p.id}`,
  text: p.text,
  reading: p.words.map((w) => w.spoken).join(''),
  ruby: p.words.flatMap((w) => w.ruby),
  fr: p.fr,
  model: p.text,
});

const wordTarget = (w: VocabWord): Target => ({
  key: `mots:${w.w}`,
  text: w.w,
  reading: w.r,
  ruby: furigana(w.w, w.r),
  fr: w.fr,
  model: w.r,
});

const replyTarget = (r: Reply): Target => ({
  key: `repondre:${r.id}`,
  text: r.choices[0],
  ruby: [{ text: r.choices[0] }],
  fr: r.explanation,
  model: r.choices[0],
  prompt: r.prompt,
});

@Component({
  selector: 'app-oral',
  imports: [VoicePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .card {
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
    .target {
      margin: 0;
      font-family: var(--font-jp-display);
      font-size: clamp(26px, 4.6vw, 40px);
      line-height: 1.8;
      overflow-wrap: anywhere;
    }
    .prompt {
      margin: 0;
      font-family: var(--font-jp);
      font-size: 22px;
    }
    .fr {
      margin: 0;
      font-weight: 700;
    }
    .mic {
      display: grid;
      place-items: center;
      width: 104px;
      aspect-ratio: 1;
      border: var(--bw) solid var(--ink);
      border-radius: 50%;
      background: var(--coral);
      box-shadow: var(--shadow);
      font-family: var(--font-display);
      font-size: 18px;
      cursor: pointer;

      &[data-status='listening'] {
        background: var(--yellow);
        animation: pulse 1s ease-in-out infinite;
      }
      &:disabled {
        cursor: default;
      }
    }
    .live {
      min-height: 1.6em;
      margin: 0;
      font-family: var(--font-jp);
      font-size: 18px;
    }
    .score {
      font-family: var(--font-display);
      font-size: clamp(48px, 9vw, 72px);
      line-height: 1;
      letter-spacing: -0.04em;

      small {
        font-size: 0.4em;
      }
    }
    .morae {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      font-family: var(--font-jp);
      font-size: 22px;
    }
    .mora {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      min-width: 34px;
      padding: 2px 6px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 8px;
      background: var(--mint);

      small {
        font-family: var(--font-mono);
        font-size: 11px;
      }
      &[data-status='wrong'] {
        background: var(--coral);
      }
      &[data-status='missing'] {
        background: var(--paper);
        border-style: dashed;
      }
      &[data-status='extra'] {
        background: var(--cream);
        text-decoration: line-through;
      }
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      font-family: var(--font-mono);
      font-size: 12px;
    }
    .warning {
      margin: 0;
      padding: 12px 14px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: var(--radius);
      background: var(--yellow-soft);
      font-weight: 700;
    }
    audio {
      width: 100%;
    }
    .romaji {
      font-family: var(--font-mono);
      font-weight: 700;
    }
    .tight {
      gap: 8px;
    }
    .group {
      margin: 0;
      padding: 0;
      border: 0;
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
        @if (!supported) {
          <p class="warning" role="status">
            Ce navigateur ne propose pas la reconnaissance vocale. Utilisez Chrome, Edge ou Safari
            pour cet exercice.
          </p>
        }
        @if (error()) {
          <p class="warning" role="alert">{{ error() }}</p>
        }

        <div class="card" aria-live="polite">
          @if (result(); as r) {
            <span
              class="stamp"
              [class.stamp--ok]="r.score >= 0.75"
              [class.stamp--ko]="r.score < 0.4"
              >{{ verdicts[verdictOf(r.score)].title }}</span
            >
          }
          <span class="kicker">{{ modeInfo().help }}</span>
          @if (target().prompt; as prompt) {
            <p class="prompt" lang="ja">「{{ prompt }}」</p>
            <button type="button" class="btn btn--small lift" (click)="speech.speak(prompt)">
              Écouter la réplique ♪
            </button>
          }
          @if (settings().mode !== 'repondre' || result()) {
            <p class="target" lang="ja">
              @for (seg of target().ruby; track $index) {
                @if (seg.ruby && (settings().furigana || result())) {
                  <ruby
                    >{{ seg.text }}<rt>{{ seg.ruby }}</rt></ruby
                  >
                } @else {
                  {{ seg.text }}
                }
              }
            </p>
          }
          @if (settings().mode !== 'repondre') {
            <p class="fr">{{ target().fr }}</p>
          }
          <button
            type="button"
            class="mic lift"
            [attr.data-status]="status()"
            [disabled]="!supported || status() === 'analysing'"
            (click)="toggleListening()"
            [attr.aria-label]="status() === 'listening' ? 'Arrêter' : 'Parler'"
          >
            {{ status() === 'listening' ? '■ Stop' : status() === 'analysing' ? '…' : '● Parler' }}
          </button>
          <p class="live" lang="ja">
            @if (status() === 'listening') {
              {{ interim() || 'Je vous écoute…' }}
            } @else if (status() === 'analysing') {
              {{ tokenizerReady() ? 'Analyse…' : 'Chargement du dictionnaire (une seule fois)…' }}
            }
          </p>
        </div>

        @if (result(); as r) {
          <div class="tile tile--wide stack" [class.tile--mint]="r.score >= 0.95">
            <div class="row">
              <span class="score">{{ percent(r.score) }}<small> %</small></span>
              <span>{{ verdicts[verdictOf(r.score)].text }}</span>
            </div>
            <div class="morae" lang="ja" aria-label="Sons attendus et entendus">
              @for (p of r.parts; track $index) {
                <span class="mora" [attr.data-status]="p.status"
                  >{{ p.text }}
                  @if (p.heard) {
                    <small>{{ p.heard }}</small>
                  }
                </span>
              }
            </div>
            <div class="legend" aria-hidden="true">
              <span>vert : juste</span><span>rouge : entendu autre chose (en petit)</span
              ><span>pointillé : manquant</span><span>barré : en trop</span>
            </div>
            <span
              >Entendu : <strong lang="ja">{{ heard() || '—' }}</strong></span
            >
            <span class="romaji">Attendu : {{ romaji() }}</span>
            @if (settings().mode === 'repondre') {
              <span>{{ target().fr }}</span>
            }
            @if (recording()) {
              <span class="kicker">Votre voix</span>
              <audio controls [src]="recording()"></audio>
            }
          </div>
        }

        <div class="row">
          <button type="button" class="btn btn--small lift" (click)="speech.speak(target().model)">
            Écouter le modèle ♪
          </button>
          @if (result()) {
            <button type="button" class="btn btn--small lift" (click)="retry()">Réessayer</button>
            <button type="button" class="btn btn--dark lift" (click)="next()">Suivante →</button>
          } @else {
            <button type="button" class="btn btn--small btn--ghost" (click)="next()">Passer</button>
          }
        </div>
      </div>

      <div class="game__side">
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
        @if (settings().mode === 'lire') {
          <fieldset class="stack tight group">
            <legend class="kicker">Phrases</legend>
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
          </fieldset>
        }
        @if (settings().mode !== 'repondre') {
          <label class="check">
            <input
              type="checkbox"
              [checked]="settings().furigana"
              (change)="update({ furigana: !settings().furigana })"
            />
            Afficher les furigana
          </label>
        }
        <app-voice-picker [speech]="speech" />
        <div class="stats">
          <div class="tile tile--yellow">
            <span class="kicker">Essais</span>
            <span class="tile__value">{{ attempts() }}</span>
          </div>
          <div class="tile tile--mint">
            <span class="kicker">Moyenne</span>
            <span class="tile__value">{{ average() ?? '–' }}<small>%</small></span>
          </div>
        </div>
        <p class="note">
          La reconnaissance vocale de votre navigateur envoie le son de votre voix à son service en
          ligne (Google pour Chrome, Microsoft pour Edge, Apple pour Safari) pour le transcrire.
          L'enregistrement que vous réécoutez reste sur votre appareil. Le score compare les sons
          (mores) entendus à ceux attendus.
        </p>
      </div>
    </div>
  `,
})
export class Oral {
  protected readonly modes = MODES;
  protected readonly levels = LEVELS;
  protected readonly verdicts = VERDICTS;
  protected readonly speech = useSpeech();
  protected readonly supported = !!recognitionCtor();

  protected readonly settings = signal<Settings>({
    mode: 'lire',
    levels: [1],
    furigana: true,
    ...readStored<Partial<Settings>>('japonais:oral-reglages', {}),
  });
  private readonly stats = signal<StatsMap>(readStored('japonais:oral-stats', {}));
  protected readonly target = signal<Target>(phraseTarget(ALL_PHRASES[0]));
  protected readonly status = signal<Status>('idle');
  protected readonly interim = signal('');
  protected readonly heard = signal('');
  protected readonly result = signal<Comparison | null>(null);
  protected readonly expected = signal('');
  protected readonly error = signal('');
  protected readonly recording = signal<string | null>(null);
  protected readonly tokenizerReady = signal(false);
  private readonly scores = signal<readonly number[]>([]);

  protected readonly modeInfo = computed(
    () => MODES.find((m) => m.id === this.settings().mode) ?? MODES[0],
  );
  protected readonly attempts = computed(() => this.scores().length);
  protected readonly average = computed(() => {
    const s = this.scores();
    return s.length ? Math.round((100 * s.reduce((a, b) => a + b, 0)) / s.length) : null;
  });
  protected readonly romaji = computed(() => kanaToRomaji(this.expected()));

  private recognition: Recognition | null = null;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private recent: string[] = [];
  private tokenizer: Promise<Tokenizer> | null = null;

  constructor() {
    loadJapaneseFont();
    this.next();
    inject(DestroyRef).onDestroy(() => {
      this.recognition?.abort();
      this.stopRecorder();
      this.revokeRecording();
    });
  }

  protected update(patch: Partial<Settings>): void {
    this.settings.update((s) => ({ ...s, ...patch }));
    writeStored('japonais:oral-reglages', this.settings());
    if ('mode' in patch || 'levels' in patch) {
      this.recent = [];
      this.next();
    }
  }

  protected toggleLevel(level: PhraseLevel): void {
    const levels = this.settings().levels;
    const updated = levels.includes(level) ? levels.filter((l) => l !== level) : [...levels, level];
    this.update({ levels: updated.length ? updated : [level] });
  }

  protected next(): void {
    this.recognition?.abort();
    const stats = this.stats();
    const mode = this.settings().mode;
    let target: Target | undefined;
    if (mode === 'lire') {
      const pool = ALL_PHRASES.filter((p) => this.settings().levels.includes(p.level));
      const p = pickWeighted(pool, (x) => `lire:${x.id}`, stats, cryptoRandomInt, this.recent);
      target = p && phraseTarget(p);
    } else if (mode === 'mots') {
      const w = pickWeighted(VOCAB, (x) => `mots:${x.w}`, stats, cryptoRandomInt, this.recent);
      target = w && wordTarget(w);
    } else {
      const r = pickWeighted(
        REPLIES,
        (x) => `repondre:${x.id}`,
        stats,
        cryptoRandomInt,
        this.recent,
      );
      target = r && replyTarget(r);
    }
    if (target) {
      this.target.set(target);
      this.recent = remember(this.recent, target.key, 30);
      this.expected.set(target.reading ? toHiragana(target.reading) : '');
    }
    this.reset();
  }

  protected retry(): void {
    this.reset();
  }

  private reset(): void {
    this.status.set('idle');
    this.interim.set('');
    this.heard.set('');
    this.result.set(null);
    this.error.set('');
    this.revokeRecording();
  }

  protected toggleListening(): void {
    if (this.status() === 'listening') {
      this.recognition?.stop();
      return;
    }
    const Ctor = recognitionCtor();
    if (!Ctor) {
      return;
    }
    this.reset();
    this.speech.cancel();
    // Le dictionnaire (lecture de ce qui a été entendu) se charge pendant qu'on parle.
    this.tokenizer ??= loadTokenizer();
    void this.tokenizer.then(
      () => this.tokenizerReady.set(true),
      () => (this.tokenizer = null),
    );

    const recognition = new Ctor();
    recognition.lang = 'ja-JP';
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;
    let finals: string[] = [];
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        finals = Array.from({ length: last.length }, (_, i) => last[i].transcript);
      } else {
        this.interim.set(last[0]?.transcript ?? '');
      }
    };
    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        'not-allowed':
          'Accès au micro refusé : autorisez-le dans la barre d’adresse, puis réessayez.',
        'service-not-allowed': 'Le navigateur refuse la reconnaissance vocale sur cette page.',
        'no-speech': 'Rien entendu : parlez juste après avoir appuyé sur « Parler ».',
        'audio-capture': 'Aucun micro trouvé.',
        network: 'La reconnaissance vocale a besoin du réseau : vérifiez la connexion.',
      };
      if (event.error !== 'aborted') {
        this.error.set(messages[event.error] ?? `Erreur de reconnaissance (${event.error}).`);
      }
    };
    recognition.onend = () => {
      this.stopRecorder();
      if (this.recognition !== recognition) {
        return;
      }
      this.recognition = null;
      if (finals.length) {
        void this.analyse(finals);
      } else {
        this.status.set('idle');
      }
    };
    this.recognition = recognition;
    this.status.set('listening');
    recognition.start();
    void this.startRecorder();
  }

  private async analyse(transcripts: string[]): Promise<void> {
    this.status.set('analysing');
    this.heard.set(transcripts[0]);
    try {
      const tokenizer = await (this.tokenizer ??= loadTokenizer());
      this.tokenizerReady.set(true);
      const read = (text: string) => spokenReading(tokenizer.tokenize(spellNumbers(text)));
      const target = this.target();
      const expected = target.reading ? toHiragana(target.reading) : read(target.text);
      this.expected.set(expected);
      const result = bestComparison(expected, transcripts.map(read));
      this.result.set(result);
      this.scores.update((s) => [...s, result.score]);
      this.stats.update((s) => recordAnswer(s, target.key, result.score >= 0.75));
      writeStored('japonais:oral-stats', this.stats());
    } catch {
      this.error.set('Impossible de charger le dictionnaire de lecture : vérifiez la connexion.');
    } finally {
      this.status.set('done');
    }
  }

  /** Enregistre la voix en parallèle, pour la réécouter (reste sur l'appareil). */
  private async startRecorder(): Promise<void> {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices) {
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (this.status() !== 'listening') {
        this.stopRecorder();
        return;
      }
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(this.stream);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        if (chunks.length) {
          this.revokeRecording();
          this.recording.set(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })));
        }
      };
      recorder.start();
      this.recorder = recorder;
    } catch {
      // Pas d'enregistrement possible : l'exercice fonctionne quand même.
    }
  }

  private stopRecorder(): void {
    if (this.recorder?.state === 'recording') {
      this.recorder.stop();
    }
    this.recorder = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private revokeRecording(): void {
    const url = this.recording();
    if (url) {
      URL.revokeObjectURL(url);
      this.recording.set(null);
    }
  }

  protected verdictOf(score: number) {
    return speakingVerdict(score);
  }

  protected percent(score: number): number {
    return Math.round(score * 100);
  }
}
