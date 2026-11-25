import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { cryptoRandomInt } from '../../../shared/random';
import {
  characterSets,
  entropyBits,
  generatePassword,
  PasswordOptions,
  strengthLabel,
} from '../daily-math';

type Flag = 'lower' | 'upper' | 'digits' | 'symbols' | 'avoidAmbiguous';

const STRENGTH_COLORS: Readonly<Record<string, string>> = {
  Faible: 'var(--coral)',
  Moyen: 'var(--peach)',
  Fort: 'var(--mint)',
  'Très fort': 'var(--mint)',
};

@Component({
  selector: 'app-mot-de-passe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .pwd {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: clamp(18px, 3vw, 26px);
      overflow-wrap: anywhere;
      user-select: all;
    }
    input[type='range'] {
      width: 100%;
      accent-color: var(--ink);
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Longueur : {{ options().length }}
          <input
            #len
            type="range"
            min="8"
            max="64"
            [value]="options().length"
            (input)="set('length', +len.value)"
          />
        </label>
        @for (flag of flags; track flag.key) {
          <label class="check">
            <input type="checkbox" [checked]="options()[flag.key]" (change)="toggle(flag.key)" />
            {{ flag.label }}
          </label>
        }
        <p class="note">
          Généré localement avec crypto.getRandomValues : le mot de passe ne quitte jamais votre
          navigateur.
        </p>
      </div>
      <div class="tool-layout__results">
        <div class="tile tile--wide tile--cream">
          <span class="kicker">Mot de passe</span>
          <output class="pwd" aria-live="polite">{{
            password() || 'Choisissez au moins un type de caractère.'
          }}</output>
          <div class="row">
            <button type="button" class="btn btn--coral lift" (click)="regenerate()">
              Générer ↻
            </button>
            <button type="button" class="btn lift" (click)="copy()" [disabled]="!password()">
              {{ copied() ? 'Copié ✓' : 'Copier' }}
            </button>
          </div>
        </div>
        <div class="tile" [style.background]="strength().color">
          <span class="kicker">Robustesse</span>
          <span class="tile__value">{{ strength().label }}</span>
        </div>
        <div class="tile">
          <span class="kicker">Entropie</span>
          <span class="tile__value">{{ strength().bits }} bits</span>
        </div>
      </div>
    </div>
  `,
})
export class MotDePasse {
  protected readonly flags: readonly { key: Flag; label: string }[] = [
    { key: 'lower', label: 'Minuscules (a-z)' },
    { key: 'upper', label: 'Majuscules (A-Z)' },
    { key: 'digits', label: 'Chiffres (0-9)' },
    { key: 'symbols', label: 'Symboles (!#$…)' },
    { key: 'avoidAmbiguous', label: 'Éviter les caractères ambigus (0/O, 1/l/I)' },
  ];
  protected readonly options = signal<PasswordOptions>({
    length: 20,
    lower: true,
    upper: true,
    digits: true,
    symbols: true,
    avoidAmbiguous: false,
  });
  private readonly seed = signal(0);
  protected readonly copied = signal(false);

  protected readonly password = computed(() => {
    this.seed();
    return generatePassword(this.options(), cryptoRandomInt);
  });

  protected readonly strength = computed(() => {
    const size = characterSets(this.options()).join('').length;
    const bits = entropyBits(this.options().length, size);
    const label = strengthLabel(bits);
    return { bits: Math.round(bits), label, color: STRENGTH_COLORS[label] };
  });

  protected set(key: 'length', value: number): void {
    this.options.update((o) => ({ ...o, [key]: value }));
    this.copied.set(false);
  }

  protected toggle(key: Flag): void {
    this.options.update((o) => ({ ...o, [key]: !o[key] }));
    this.copied.set(false);
  }

  protected regenerate(): void {
    this.seed.update((s) => s + 1);
    this.copied.set(false);
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.password());
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}
