import { Location } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { findTool, SECTIONS } from './registry/tools.registry';
import { toolPath } from './site';

/**
 * Outil déplié dans chaque section (au plus un par section).
 * Le dernier outil ouvert donne l'URL de la page (`/outils/<id>`), mise à jour avec
 * `replaceState` : aucune navigation, on reste sur une seule page.
 */
@Injectable({ providedIn: 'root' })
export class OpenTools {
  private readonly location = inject(Location);
  private readonly openBySection = signal<Readonly<Record<string, string>>>(
    Object.fromEntries(SECTIONS.filter((s) => s.defaultOpen).map((s) => [s.id, s.defaultOpen!])),
  );
  /** Outil reflété dans l'URL (page courante), ou null pour l'accueil. */
  private readonly urlToolId = signal<string | null>(null);

  /** L'outil et la section de la page courante. */
  readonly current = computed(() => findTool(this.urlToolId()));

  openToolId(sectionId: string): string | null {
    return this.openBySection()[sectionId] ?? null;
  }

  /**
   * Ouvre l'outil d'une URL (page prérendue ou ancien lien `?outil=`), sans réécrire l'URL.
   * Seul cet outil est déplié : chaque page d'outil a ainsi un contenu qui lui est propre.
   */
  openFromUrl(toolId: string | null | undefined): void {
    const found = findTool(toolId ?? null);
    if (found?.tool.type === 'internal') {
      this.openBySection.set({ [found.section.id]: found.tool.id });
      this.urlToolId.set(found.tool.id);
    }
  }

  toggle(sectionId: string, toolId: string): void {
    if (this.openToolId(sectionId) === toolId) {
      this.close(sectionId);
    } else {
      this.open(sectionId, toolId);
    }
  }

  open(sectionId: string, toolId: string): void {
    this.openBySection.update((state) => ({ ...state, [sectionId]: toolId }));
    this.setUrlTool(toolId);
  }

  close(sectionId: string): void {
    const closing = this.openToolId(sectionId);
    this.openBySection.update((state) => {
      const next = { ...state };
      delete next[sectionId];
      return next;
    });
    if (closing && closing === this.urlToolId()) {
      this.setUrlTool(null);
    }
  }

  private setUrlTool(toolId: string | null): void {
    this.urlToolId.set(toolId);
    this.location.replaceState(toolId ? toolPath(toolId) : '');
  }
}
