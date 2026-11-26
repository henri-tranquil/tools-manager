import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { readStored, writeStored } from '../../../shared/storage';
import { loadJapaneseFont, useSpeech } from '../japanese';
import { kanaToRomaji, romajiToKana, Script } from '../kana';
import { KanaKeyboard } from '../kana-keyboard';

const EXAMPLE = 'nihongo wo benkyou shiteimasu.';

@Component({
  selector: 'app-romaji-kana',
  imports: [KanaKeyboard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .pair {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
      gap: 18px;
    }
    .side {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .kana-field {
      font-family: var(--font-jp);
      font-size: 24px;
      background: var(--mint);
    }
    .head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
  `,
  template: `
    <div class="stack">
      <div class="pair">
        <div class="side">
          <div class="head">
            <label class="kicker" for="romaji-input">Rōmaji</label>
            <label class="check">
              <input type="checkbox" [checked]="macrons()" (change)="toggleMacrons()" />
              Voyelles longues en ō
            </label>
          </div>
          <textarea
            #romajiInput
            id="romaji-input"
            class="field field--text"
            rows="4"
            spellcheck="false"
            autocapitalize="off"
            [value]="romaji()"
            (input)="editRomaji(romajiInput.value)"
          ></textarea>
          <button type="button" class="btn btn--small lift" (click)="copy(romaji(), 'romaji')">
            {{ copied() === 'romaji' ? 'Copié ✓' : 'Copier' }}
          </button>
        </div>
        <div class="side">
          <div class="head">
            <label class="kicker" for="kana-input">Kana</label>
            <div class="seg" role="group" aria-label="Écriture des kana">
              <button
                type="button"
                [attr.aria-pressed]="script() === 'hiragana'"
                (click)="setScript('hiragana')"
              >
                Hiragana <span class="jp" lang="ja">あ</span>
              </button>
              <button
                type="button"
                [attr.aria-pressed]="script() === 'katakana'"
                (click)="setScript('katakana')"
              >
                Katakana <span class="jp" lang="ja">ア</span>
              </button>
            </div>
          </div>
          <textarea
            #kanaInput
            id="kana-input"
            class="field field--text kana-field"
            rows="4"
            lang="ja"
            spellcheck="false"
            [value]="kana()"
            (input)="editKana(kanaInput.value)"
          ></textarea>
          <div class="row">
            <button type="button" class="btn btn--small lift" (click)="copy(kana(), 'kana')">
              {{ copied() === 'kana' ? 'Copié ✓' : 'Copier' }}
            </button>
            @if (speech.available()) {
              <button type="button" class="btn btn--small lift" (click)="speech.speak(kana())">
                Écouter ♪
              </button>
            }
          </div>
        </div>
      </div>
      <p class="note">
        Comme un clavier japonais : « nn » ou « n' » pour ん, consonne doublée pour っ (kitte), « -
        » pour ー en katakana (ko-hi- → コーヒー). Collez aussi un texte en kana pour le lire en
        rōmaji.
      </p>

      <span class="kicker">Clavier japonais · cliquez pour écrire dans les kana</span>
      <app-kana-keyboard (typed)="insert($event)" (erase)="erase()" />
    </div>
  `,
})
export class RomajiKana {
  protected readonly speech = useSpeech();
  protected readonly script = signal<Script>('hiragana');
  protected readonly macrons = signal<boolean>(readStored('japonais:macrons', false));
  protected readonly romaji = signal(EXAMPLE);
  protected readonly kana = signal(romajiToKana(EXAMPLE));
  protected readonly copied = signal<'romaji' | 'kana' | null>(null);

  constructor() {
    loadJapaneseFont();
  }

  protected editRomaji(value: string): void {
    this.romaji.set(value);
    this.kana.set(romajiToKana(value, this.script()));
    this.copied.set(null);
  }

  protected editKana(value: string): void {
    this.kana.set(value);
    this.romaji.set(kanaToRomaji(value, { macrons: this.macrons() }));
    this.copied.set(null);
  }

  protected setScript(script: Script): void {
    this.script.set(script);
    this.kana.set(romajiToKana(this.romaji(), script));
  }

  protected toggleMacrons(): void {
    this.macrons.set(!this.macrons());
    writeStored('japonais:macrons', this.macrons());
    this.romaji.set(kanaToRomaji(this.kana(), { macrons: this.macrons() }));
  }

  protected insert(text: string): void {
    this.editKana(this.kana() + text);
    this.speech.speak(text);
  }

  protected erase(): void {
    this.editKana([...this.kana()].slice(0, -1).join(''));
  }

  protected async copy(text: string, side: 'romaji' | 'kana'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(side);
    } catch {
      this.copied.set(null);
    }
  }
}
