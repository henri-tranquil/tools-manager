import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import {
  analyze,
  Glossary,
  loadGlossary,
  loadTokenizer,
  sentenceRomaji,
  Tokenizer,
  Word,
} from '../dictionary';
import { cryptoRandomInt } from '../../../shared/random';
import { PHRASES } from '../data/phrases';
import { Handwriting } from '../handwriting';
import { loadJapaneseFont, useSpeech } from '../japanese';
import { romajiToKana, Script } from '../kana';
import { KanaKeyboard } from '../kana-keyboard';

/** API de traduction intégrée au navigateur (Chrome 138+ sur ordinateur), qui traduit sur l'appareil. */
interface BrowserTranslator {
  translate(text: string): Promise<string>;
}

type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

interface TranslatorFactory {
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<Availability>;
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: EventTarget) => void;
  }): Promise<BrowserTranslator>;
}

const LANGS = { sourceLanguage: 'ja', targetLanguage: 'fr' } as const;
const MAX_LENGTH = 400;

const EXAMPLES: readonly string[] = [
  '私は日本語を勉強しています。',
  '週末は山を走ります。',
  'このパンはとても美味しいです。',
  '明日、友達と京都へ行きたい。',
];

type WritingTool = 'keyboard' | 'draw' | 'romaji';

const WRITING_TOOLS: readonly { id: WritingTool; label: string }[] = [
  { id: 'keyboard', label: 'Clavier kana' },
  { id: 'draw', label: 'Dessin' },
  { id: 'romaji', label: 'Rōmaji' },
];

type LoadState = 'idle' | 'loading' | 'ready' | 'error';
type TranslatorState = 'unsupported' | 'unavailable' | 'ready' | 'downloading' | 'busy' | 'error';

const SOURCE_LABELS: Readonly<Record<string, string>> = {
  fr: 'FR',
  en: 'EN',
  grammaire: 'Grammaire',
};

@Component({
  selector: 'app-traduction',
  imports: [KanaKeyboard, Handwriting],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .input {
      font-family: var(--font-jp);
      font-size: 22px;
    }
    .sentence {
      font-family: var(--font-jp-display);
      font-size: clamp(24px, 4vw, 38px);
      line-height: 2.1;
      overflow-wrap: anywhere;
    }
    .romaji {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 17px;
    }
    .words {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 190px), 1fr));
      gap: 12px;
    }
    .word {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 14px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 12px;
      background: var(--paper);
      box-shadow: var(--shadow-sm);
    }
    .word--grammar {
      background: var(--cream);
    }
    .word__jp {
      font-family: var(--font-jp-display);
      font-size: 28px;
      line-height: 1.9;
    }
    .word__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .gloss {
      font-weight: 700;
    }
    .tag--fr {
      background: var(--sky);
    }
    .tag--grammaire {
      background: var(--yellow-soft);
    }
    .example {
      font-family: var(--font-jp);
    }
    .tools,
    .ime {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .ime .field {
      flex: 1 1 200px;
      min-width: 0;
    }
    .translation {
      font-size: 22px;
      font-weight: 700;
    }
  `,
  template: `
    <div class="stack">
      <label class="label" for="jp-text">
        Phrase en japonais (kanji, hiragana, katakana)
        <textarea
          #text
          id="jp-text"
          class="field field--text input"
          rows="2"
          lang="ja"
          [attr.maxlength]="maxLength"
          [value]="input()"
          (input)="setInput(text.value)"
        ></textarea>
      </label>
      <div class="tools">
        <span class="kicker">Écrire avec</span>
        <div class="seg" role="group" aria-label="Outil d'écriture">
          @for (t of writingTools; track t.id) {
            <button type="button" [attr.aria-pressed]="tool() === t.id" (click)="toggleTool(t.id)">
              {{ t.label }}
            </button>
          }
        </div>
        @if (input()) {
          <button type="button" class="btn btn--small btn--ghost" (click)="setInput('')">
            Vider
          </button>
        }
      </div>
      @switch (tool()) {
        @case ('keyboard') {
          <app-kana-keyboard (typed)="insert($event)" (erase)="erase()" />
        }
        @case ('draw') {
          <app-handwriting (typed)="insert($event)" />
        }
        @case ('romaji') {
          <form class="ime" (submit)="$event.preventDefault(); insertRomaji()">
            <label class="visually-hidden" for="ime-input">Rōmaji à convertir</label>
            <input
              #ime
              id="ime-input"
              class="field field--compact"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="ex. watashi wa"
              [value]="romajiBuffer()"
              (input)="romajiBuffer.set(ime.value)"
            />
            <div class="seg" role="group" aria-label="Écriture">
              <button
                type="button"
                [attr.aria-pressed]="imeScript() === 'hiragana'"
                (click)="imeScript.set('hiragana')"
              >
                Hiragana <span class="jp" lang="ja">あ</span>
              </button>
              <button
                type="button"
                [attr.aria-pressed]="imeScript() === 'katakana'"
                (click)="imeScript.set('katakana')"
              >
                Katakana <span class="jp" lang="ja">ア</span>
              </button>
            </div>
            <button
              type="submit"
              class="btn btn--small btn--dark lift"
              [disabled]="!romajiBuffer().trim()"
            >
              Insérer <span class="jp" lang="ja">{{ imePreview() }}</span> ↵
            </button>
          </form>
        }
      }
      <div class="row">
        @for (e of examples; track e) {
          <button
            type="button"
            class="btn btn--small btn--ghost example"
            lang="ja"
            (click)="setInput(e)"
          >
            {{ e }}
          </button>
        }
        <button type="button" class="btn btn--small btn--yellow lift" (click)="randomPhrase()">
          Phrase au hasard ↻
        </button>
      </div>

      @switch (loadState()) {
        @case ('idle') {
          <div class="row">
            <button type="button" class="btn btn--coral lift" (click)="load()">
              Analyser la phrase
            </button>
          </div>
          <p class="note">
            Le premier clic télécharge les dictionnaires depuis ce site (≈ 18 Mo, une seule fois,
            puis en cache). Votre texte n'est envoyé nulle part : tout est analysé ici.
          </p>
        }
        @case ('loading') {
          <p class="pill" role="status">Chargement des dictionnaires…</p>
        }
        @case ('error') {
          <p class="note" role="alert">Les dictionnaires n'ont pas pu être chargés.</p>
          <button type="button" class="btn btn--small lift" (click)="load()">Réessayer</button>
        }
      }

      @if (words().length) {
        <div class="tile tile--wide" aria-live="polite">
          <span class="kicker">Lecture</span>
          <p class="sentence" lang="ja">
            @for (w of words(); track $index) {
              @for (seg of w.ruby; track $index) {
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
          <p class="romaji">{{ romaji() }}</p>
          <div class="row">
            @if (speech.available()) {
              <button type="button" class="btn btn--small lift" (click)="speech.speak(input())">
                Écouter ♪
              </button>
            }
            @switch (translatorState()) {
              @case ('ready') {
                <button type="button" class="btn btn--small btn--yellow lift" (click)="translate()">
                  Traduire la phrase entière
                </button>
              }
              @case ('downloading') {
                <span class="pill" role="status"
                  >Le navigateur prépare la traduction… {{ progress() }} %</span
                >
              }
              @case ('busy') {
                <span class="pill" role="status">Traduction…</span>
              }
            }
          </div>
          @if (translation()) {
            <p class="translation">« {{ translation() }} »</p>
            <p class="note">
              Traduction automatique faite par votre navigateur, sur votre appareil.
            </p>
          }
          @if (translatorState() === 'unsupported' || translatorState() === 'unavailable') {
            <p class="note">
              Pour la phrase entière, il faut un navigateur qui traduit sur l'appareil (Chrome
              récent sur ordinateur). Ici, voici le sens de chaque mot.
            </p>
          }
          @if (translatorState() === 'error') {
            <p class="note" role="alert">
              La traduction locale a échoué : voici le sens mot à mot.
            </p>
          }
        </div>

        <span class="kicker">Mot à mot</span>
        <div class="words">
          @for (w of words(); track $index) {
            @if (w.pos !== 'ponctuation') {
              <div class="word" [class.word--grammar]="w.gloss?.source === 'grammaire'">
                <span class="word__jp" lang="ja">
                  @for (seg of w.ruby; track $index) {
                    @if (seg.ruby) {
                      <ruby
                        >{{ seg.text }}<rt>{{ seg.ruby }}</rt></ruby
                      >
                    } @else {
                      {{ seg.text }}
                    }
                  }
                </span>
                <span class="word__meta">
                  <span class="kicker">{{ w.romaji }}</span>
                  <span class="tag">{{ w.pos }}</span>
                  @if (w.gloss; as g) {
                    <span class="tag" [class]="'tag--' + g.source">{{
                      sourceLabel(g.source)
                    }}</span>
                  }
                </span>
                @if (w.lemma) {
                  <span class="note"
                    >forme du dictionnaire : <span lang="ja" class="jp">{{ w.lemma }}</span></span
                  >
                }
                <span class="gloss">{{ w.gloss?.text ?? '—' }}</span>
              </div>
            }
          }
        </div>
        <p class="note">
          Découpage et lectures : kuromoji (Apache 2.0) et IPAdic. Sens : JMdict, © EDRDG, CC BY-SA
          4.0, en français quand il existe, sinon en anglais (EN).
        </p>
      }
    </div>
  `,
})
export class Traduction {
  protected readonly examples = EXAMPLES;
  protected readonly maxLength = MAX_LENGTH;
  protected readonly speech = useSpeech();

  protected readonly writingTools = WRITING_TOOLS;
  protected readonly input = signal(EXAMPLES[0]);
  protected readonly tool = signal<WritingTool | null>(null);
  protected readonly romajiBuffer = signal('');
  protected readonly imeScript = signal<Script>('hiragana');
  protected readonly imePreview = computed(() =>
    romajiToKana(this.romajiBuffer().trim(), this.imeScript()),
  );
  private readonly textArea = viewChild<ElementRef<HTMLTextAreaElement>>('text');
  protected readonly loadState = signal<LoadState>('idle');
  private readonly tokenizer = signal<Tokenizer | null>(null);
  private readonly glossary = signal<Glossary | null>(null);

  protected readonly translatorState = signal<TranslatorState>('unsupported');
  protected readonly translation = signal('');
  protected readonly progress = signal(0);
  private translator: BrowserTranslator | null = null;

  protected readonly words = computed<Word[]>(() => {
    const tokenizer = this.tokenizer();
    const glossary = this.glossary();
    const text = this.input().trim().slice(0, MAX_LENGTH);
    return tokenizer && glossary && text ? analyze(tokenizer.tokenize(text), glossary) : [];
  });
  protected readonly romaji = computed(() => sentenceRomaji(this.words()));

  constructor() {
    loadJapaneseFont();
    void this.checkTranslator();
  }

  protected setInput(value: string): void {
    this.input.set(value.slice(0, MAX_LENGTH));
    this.translation.set('');
  }

  /** Une phrase des jeux de lecture, sans les marques de lecture ([…], _) ni les espaces. */
  protected randomPhrase(): void {
    const { text } = PHRASES[cryptoRandomInt(PHRASES.length)];
    this.setInput(text.replace(/\[[^\]]*]/g, '').replace(/[_\s]/g, ''));
  }

  protected toggleTool(tool: WritingTool): void {
    this.tool.set(this.tool() === tool ? null : tool);
  }

  /** Insère du texte à la position du curseur dans la zone de saisie (à la fin par défaut). */
  protected insert(text: string): void {
    const area = this.textArea()?.nativeElement;
    const value = this.input();
    const start = area?.selectionStart ?? value.length;
    const end = area?.selectionEnd ?? value.length;
    this.setInput(value.slice(0, start) + text + value.slice(end));
    const caret = start + text.length;
    queueMicrotask(() => area?.setSelectionRange(caret, caret));
  }

  /** Efface le caractère avant le curseur (ou la sélection). */
  protected erase(): void {
    const area = this.textArea()?.nativeElement;
    const value = this.input();
    const end = area?.selectionEnd ?? value.length;
    const start = area && area.selectionStart !== end ? area.selectionStart : Math.max(0, end - 1);
    this.setInput(value.slice(0, start) + value.slice(end));
    queueMicrotask(() => area?.setSelectionRange(start, start));
  }

  protected insertRomaji(): void {
    const kana = this.imePreview();
    if (kana) {
      this.insert(kana);
      this.romajiBuffer.set('');
    }
  }

  /** Les dictionnaires ne sont téléchargés qu'au clic : rien ne part sans action de l'utilisateur. */
  protected async load(): Promise<void> {
    this.loadState.set('loading');
    try {
      const [tokenizer, glossary] = await Promise.all([loadTokenizer(), loadGlossary()]);
      this.tokenizer.set(tokenizer);
      this.glossary.set(glossary);
      this.loadState.set('ready');
    } catch {
      this.loadState.set('error');
    }
  }

  private factory(): TranslatorFactory | undefined {
    return (globalThis as { Translator?: TranslatorFactory }).Translator;
  }

  private async checkTranslator(): Promise<void> {
    const factory = this.factory();
    if (!factory) {
      return;
    }
    try {
      const availability = await factory.availability(LANGS);
      this.translatorState.set(availability === 'unavailable' ? 'unavailable' : 'ready');
    } catch {
      this.translatorState.set('unavailable');
    }
  }

  protected async translate(): Promise<void> {
    const factory = this.factory();
    const text = this.input().trim();
    if (!factory || !text) {
      return;
    }
    try {
      if (!this.translator) {
        this.translatorState.set('downloading');
        this.translator = await factory.create({
          ...LANGS,
          monitor: (m) =>
            m.addEventListener('downloadprogress', (e) =>
              this.progress.set(Math.round(((e as ProgressEvent).loaded ?? 0) * 100)),
            ),
        });
      }
      this.translatorState.set('busy');
      this.translation.set(await this.translator.translate(text));
      this.translatorState.set('ready');
    } catch {
      this.translatorState.set('error');
    }
  }

  protected sourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
  }
}
