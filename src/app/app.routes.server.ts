import { RenderMode, ServerRoute } from '@angular/ssr';
import { SECTIONS } from './core/registry/tools.registry';

/** Prérendu au build : l'accueil et une page HTML statique par outil interne. */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  {
    path: 'outils/:outil',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      SECTIONS.flatMap((s) => s.tools)
        .filter((t) => t.type === 'internal')
        .map((t) => ({ outil: t.id })),
  },
  { path: '**', renderMode: RenderMode.Client },
];
