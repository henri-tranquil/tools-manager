import { Injectable, signal, WritableSignal } from '@angular/core';
import { findTool, SECTIONS } from './registry/tools.registry';

const URL_PARAM = 'outil';

/**
 * Outil déplié dans chaque section (au plus un par section).
 * Le dernier outil ouvert est reflété dans l'URL (`?outil=<id>`) pour les liens directs,
 * sans navigation : on reste sur une seule page.
 */
@Injectable({ providedIn: 'root' })
export class OpenTools {
  /** Section ciblée par un lien direct au chargement, pour y faire défiler la page. */
  readonly linkedSectionId: string | null;

  private readonly openBySection: WritableSignal<Readonly<Record<string, string>>>;

  constructor() {
    const initial: Record<string, string> = {};
    for (const section of SECTIONS) {
      if (section.defaultOpen) {
        initial[section.id] = section.defaultOpen;
      }
    }

    const linked = findTool(new URLSearchParams(window.location.search).get(URL_PARAM));
    if (linked?.tool.type === 'internal') {
      initial[linked.section.id] = linked.tool.id;
      this.linkedSectionId = linked.section.id;
    } else {
      this.linkedSectionId = null;
    }

    this.openBySection = signal<Readonly<Record<string, string>>>(initial);
  }

  openToolId(sectionId: string): string | null {
    return this.openBySection()[sectionId] ?? null;
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
    this.writeUrl(toolId);
  }

  close(sectionId: string): void {
    const closing = this.openToolId(sectionId);
    this.openBySection.update((state) => {
      const next = { ...state };
      delete next[sectionId];
      return next;
    });
    if (closing && new URLSearchParams(window.location.search).get(URL_PARAM) === closing) {
      this.writeUrl(null);
    }
  }

  private writeUrl(toolId: string | null): void {
    const url = new URL(window.location.href);
    if (toolId) {
      url.searchParams.set(URL_PARAM, toolId);
    } else {
      url.searchParams.delete(URL_PARAM);
    }
    window.history.replaceState(window.history.state, '', url);
  }
}
