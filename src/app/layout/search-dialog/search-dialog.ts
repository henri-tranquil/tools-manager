import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { OpenTools } from '../../core/open-tools';
import { SECTIONS, WORKS, WORKS_SECTION_ID } from '../../core/registry/tools.registry';

interface SearchItem {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly sectionTitle: string;
  readonly color: string;
  readonly mono: string;
  readonly sectionId: string;
  /** Outil interne à déplier ; sinon on ouvre `url` ou on fait défiler jusqu'à la section. */
  readonly toolId?: string;
  readonly url?: string;
  readonly haystack: string;
}

const MAX_RESULTS = 8;

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

const ITEMS: readonly SearchItem[] = [
  ...SECTIONS.flatMap((section) =>
    section.tools.map((tool) => ({
      key: tool.id,
      title: tool.title,
      description: tool.description,
      sectionTitle: section.title,
      color: section.color,
      mono: tool.mono,
      sectionId: section.id,
      toolId: tool.type === 'internal' ? tool.id : undefined,
      url: tool.type === 'internal' ? undefined : tool.url,
      haystack: normalize([tool.title, tool.description, section.title, ...section.tags].join(' ')),
    })),
  ),
  ...WORKS.map((work) => ({
    key: work.id,
    title: work.title,
    description: work.description,
    sectionTitle: 'Réalisations',
    color: '#B8A9FF',
    mono: '↗',
    sectionId: WORKS_SECTION_ID,
    url: work.url || undefined,
    haystack: normalize([work.title, work.description, 'réalisations', ...work.techs].join(' ')),
  })),
];

/** Palette de recherche (Ctrl/⌘ K), construite sur l'élément natif <dialog>. */
@Component({
  selector: 'app-search-dialog',
  templateUrl: './search-dialog.html',
  styleUrl: './search-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDialog {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly openTools = inject(OpenTools);

  protected readonly query = signal('');
  protected readonly active = signal(0);
  protected readonly results = computed(() => {
    const terms = normalize(this.query()).split(/\s+/).filter(Boolean);
    const matches = terms.length
      ? ITEMS.filter((item) => terms.every((term) => item.haystack.includes(term)))
      : ITEMS;
    return matches.slice(0, MAX_RESULTS);
  });

  open(): void {
    this.query.set('');
    this.active.set(0);
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
    this.input().nativeElement.focus();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected onQuery(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    if (event.key === 'ArrowDown' && count) {
      event.preventDefault();
      this.active.update((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp' && count) {
      event.preventDefault();
      this.active.update((i) => (i - 1 + count) % count);
    } else if (event.key === 'Enter') {
      const item = this.results()[this.active()];
      if (item) {
        event.preventDefault();
        this.select(item);
      }
    }
  }

  /** Un clic sur le fond (hors de la boîte) ferme la palette. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  protected select(item: SearchItem): void {
    this.close();
    if (item.toolId) {
      this.openTools.open(item.sectionId, item.toolId);
    }
    if (item.url) {
      window.open(item.url, '_blank', 'noopener');
      return;
    }
    // Laisse le panneau se rendre avant de faire défiler jusqu'à lui.
    requestAnimationFrame(() => {
      const target =
        (item.toolId && document.getElementById(`panel-${item.toolId}`)) ||
        document.getElementById(item.sectionId);
      target?.scrollIntoView({ block: 'start' });
    });
  }
}
