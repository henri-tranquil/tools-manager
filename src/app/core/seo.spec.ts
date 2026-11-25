import { TestBed } from '@angular/core/testing';
import { findTool, SECTIONS } from './registry/tools.registry';
import { homeSeo, Seo, toolSeo } from './seo';
import { absoluteUrl, SITE_URL } from './site';

describe('absoluteUrl', () => {
  it('construit des URL canoniques avec « / » final', () => {
    expect(absoluteUrl()).toBe(SITE_URL);
    expect(absoluteUrl('outils/cron')).toBe(`${SITE_URL}outils/cron/`);
    expect(absoluteUrl('/outils/cron/')).toBe(`${SITE_URL}outils/cron/`);
  });
});

describe('métadonnées', () => {
  it('chaque page d’outil a un titre et une description uniques', () => {
    const pages = SECTIONS.flatMap((s) => s.tools.map((t) => toolSeo(s, t)));
    const all = [homeSeo(), ...pages];
    expect(new Set(all.map((p) => p.title)).size).toBe(all.length);
    expect(new Set(all.map((p) => p.description)).size).toBe(all.length);
    expect(new Set(all.map((p) => p.url)).size).toBe(all.length);
  });

  it('respecte les longueurs conseillées (titre ≤ 70, description 50–165)', () => {
    for (const page of [homeSeo(), ...SECTIONS.flatMap((s) => s.tools.map((t) => toolSeo(s, t)))]) {
      expect(page.title.length, page.title).toBeLessThanOrEqual(70);
      expect(page.description.length, page.url).toBeGreaterThanOrEqual(50);
      expect(page.description.length, page.url).toBeLessThanOrEqual(165);
    }
  });

  it('décrit un outil comme une WebApplication gratuite avec fil d’Ariane', () => {
    const { section, tool } = findTool('km-effort')!;
    const graph = (toolSeo(section, tool).jsonLd as { '@graph': { '@type': string }[] })['@graph'];
    expect(graph.map((n) => n['@type'])).toEqual(['WebApplication', 'BreadcrumbList']);
    expect(JSON.stringify(graph)).toContain('"price":"0"');
  });
});

describe('Seo.apply', () => {
  it('pose titre, description, canonique, Open Graph et JSON-LD sans doublon', () => {
    const seo = TestBed.inject(Seo);
    const { section, tool } = findTool('qr-code')!;
    seo.apply(homeSeo());
    seo.apply(toolSeo(section, tool));

    expect(document.title).toBe("QR code — Quotidien | L'Établi");
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      `${SITE_URL}outils/qr-code/`,
    );
    const ld = document.querySelector('script#ld-json')?.textContent ?? '';
    expect(JSON.parse(ld)['@graph'][0].name).toBe('QR code');
    expect(ld).not.toContain('<');
  });
});
