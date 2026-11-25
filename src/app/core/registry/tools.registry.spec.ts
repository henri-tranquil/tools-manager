import { PANEL_LOADERS } from '../../tools/panels';
import { findTool, SECTIONS, WORKS, WORKS_SECTION_ID } from './tools.registry';

describe('registre des outils', () => {
  const allTools = SECTIONS.flatMap((s) => s.tools);

  it('a des identifiants d’outils uniques (ils servent dans l’URL)', () => {
    const ids = allTools.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a des identifiants de section uniques, distincts de la section réalisations', () => {
    const ids = [...SECTIONS.map((s) => s.id), WORKS_SECTION_ID];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque outil ouvert par défaut existe dans sa section et est interne', () => {
    for (const section of SECTIONS.filter((s) => s.defaultOpen)) {
      const tool = section.tools.find((t) => t.id === section.defaultOpen);
      expect(tool?.type).toBe('internal');
    }
  });

  it('les outils externes et liens ont une URL', () => {
    for (const tool of allTools.filter((t) => t.type !== 'internal')) {
      expect(tool.url).toBeTruthy();
    }
  });

  it('les convertisseurs déclarent leur paire d’unités', () => {
    for (const tool of allTools.filter((t) => t.panel === 'convertisseur')) {
      expect(tool.unitPair).toBeTruthy();
    }
  });

  it('chaque outil interne a un panneau chargeable', () => {
    for (const tool of allTools.filter((t) => t.type === 'internal')) {
      expect(tool.panel, tool.id).toBeDefined();
      expect(PANEL_LOADERS[tool.panel!], tool.id).toBeTypeOf('function');
    }
  });

  it('chaque panneau se charge et fournit un composant', async () => {
    for (const load of Object.values(PANEL_LOADERS)) {
      expect(await load()).toBeTypeOf('function');
    }
  });

  it('les réalisations ont une URL publique', () => {
    for (const work of WORKS) {
      expect(work.url, work.id).toMatch(/^https:\/\//);
    }
  });

  it('les réalisations ont des identifiants uniques', () => {
    expect(new Set(WORKS.map((w) => w.id)).size).toBe(WORKS.length);
  });

  it('findTool retrouve un outil et sa section', () => {
    expect(findTool('minuteur')?.section.id).toBe('cuisine');
    expect(findTool('inconnu')).toBeNull();
    expect(findTool(null)).toBeNull();
  });
});
