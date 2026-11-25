import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { readStored, writeStored } from '../../../shared/storage';

interface Recipe {
  readonly id: string;
  readonly title: string;
  readonly url: string;
}

const STORAGE_KEY = 'recettes';

function safeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
}

/** Carnet de liens de recettes, stocké uniquement dans le navigateur (localStorage). */
@Component({
  selector: 'app-recettes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 12px;
      background: var(--paper);
    }
    .item a {
      flex: 1;
      min-width: 0;
      font-weight: 700;
      text-decoration: none;
    }
    .item a span {
      display: block;
      font-family: var(--font-mono);
      font-weight: 400;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .remove {
      flex: none;
      width: 36px;
      height: 36px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 8px;
      background: var(--cream);
      font-size: 18px;
      cursor: pointer;
    }
    .remove:hover {
      background: var(--coral);
    }
  `,
  template: `
    <div class="tool-layout">
      <form class="tool-layout__inputs" novalidate (submit)="$event.preventDefault(); add()">
        <label class="label">
          Nom de la recette
          <input
            #t
            class="field field--compact"
            type="text"
            autocomplete="off"
            placeholder="Tarte aux pommes"
            [value]="title()"
            (input)="title.set(t.value)"
          />
        </label>
        <label class="label">
          Lien
          <input
            #u
            class="field field--compact"
            type="url"
            inputmode="url"
            autocomplete="off"
            placeholder="https://…"
            [value]="url()"
            (input)="url.set(u.value)"
          />
        </label>
        <button type="submit" class="btn btn--coral lift" [disabled]="!canAdd()">Ajouter</button>
        <p class="note">
          Vos liens restent dans ce navigateur, sur cet appareil : rien n'est envoyé ni publié.
        </p>
      </form>
      <div class="tool-layout__results">
        <div class="tile tile--wide">
          <span class="kicker">{{ recipes().length }} recette(s)</span>
          @if (recipes().length) {
            <ul class="list">
              @for (recipe of recipes(); track recipe.id) {
                <li class="item">
                  <a [href]="recipe.url" target="_blank" rel="noopener noreferrer">
                    {{ recipe.title }} ↗
                    <span>{{ recipe.url }}</span>
                  </a>
                  <button
                    type="button"
                    class="remove"
                    [attr.aria-label]="'Supprimer ' + recipe.title"
                    (click)="remove(recipe.id)"
                  >
                    ×
                  </button>
                </li>
              }
            </ul>
          } @else {
            <p>Aucune recette pour l'instant. Ajoutez votre premier lien à gauche.</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class Recettes {
  protected readonly recipes = signal<readonly Recipe[]>(readStored<Recipe[]>(STORAGE_KEY, []));
  protected readonly title = signal('');
  protected readonly url = signal('');
  protected readonly canAdd = computed(
    () => this.title().trim() !== '' && safeUrl(this.url()) !== null,
  );

  protected add(): void {
    const url = safeUrl(this.url());
    const title = this.title().trim();
    if (!url || !title) {
      return;
    }
    this.save([...this.recipes(), { id: crypto.randomUUID(), title, url }]);
    this.title.set('');
    this.url.set('');
  }

  protected remove(id: string): void {
    this.save(this.recipes().filter((r) => r.id !== id));
  }

  private save(recipes: readonly Recipe[]): void {
    this.recipes.set(recipes);
    writeStored(STORAGE_KEY, recipes);
  }
}
