import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Section, Tool } from './registry/models';
import { SECTIONS } from './registry/tools.registry';
import {
  absoluteUrl,
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  toolPath,
} from './site';

export interface PageSeo {
  readonly title: string;
  readonly description: string;
  /** URL canonique absolue. */
  readonly url: string;
  readonly jsonLd: object;
}

const APP_CATEGORY: Readonly<Record<string, string>> = {
  dev: 'DeveloperApplication',
  sport: 'HealthApplication',
  cuisine: 'LifestyleApplication',
  atelier: 'DesignApplication',
  conversion: 'UtilitiesApplication',
  quotidien: 'UtilitiesApplication',
};

/** Métadonnées de la page d'accueil. */
export function homeSeo(): PageSeo {
  const tools = SECTIONS.flatMap((section) => section.tools);
  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}#site`,
          name: SITE_NAME,
          url: SITE_URL,
          description: SITE_DESCRIPTION,
          inLanguage: 'fr-FR',
        },
        {
          '@type': 'ItemList',
          name: 'Outils',
          numberOfItems: tools.length,
          itemListElement: tools.map((tool, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: tool.title,
            url: absoluteUrl(toolPath(tool.id)),
          })),
        },
      ],
    },
  };
}

/** Métadonnées de la page d'un outil (`/outils/<id>/`). */
export function toolSeo(section: Section, tool: Tool): PageSeo {
  const url = absoluteUrl(toolPath(tool.id));
  const description = tool.about ?? tool.description;
  return {
    title: `${tool.title} — ${section.title} | ${SITE_NAME}`,
    description,
    url,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: tool.title,
          description,
          url,
          applicationCategory: APP_CATEGORY[section.id] ?? 'UtilitiesApplication',
          operatingSystem: 'Tous (navigateur web)',
          browserRequirements: 'JavaScript requis',
          inLanguage: 'fr-FR',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          isPartOf: { '@id': `${SITE_URL}#site` },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
            {
              '@type': 'ListItem',
              position: 2,
              name: section.title,
              item: `${SITE_URL}#${section.id}`,
            },
            { '@type': 'ListItem', position: 3, name: tool.title, item: url },
          ],
        },
      ],
    },
  };
}

/**
 * Applique titre, description, URL canonique, Open Graph, Twitter et JSON-LD.
 * Fonctionne au prérendu (HTML statique indexé) comme dans le navigateur.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  apply(page: PageSeo): void {
    this.title.setTitle(page.title);
    const tags: Record<string, string> = {
      description: page.description,
      'og:title': page.title,
      'og:description': page.description,
      'og:url': page.url,
      'og:type': 'website',
      'og:site_name': SITE_NAME,
      'og:locale': 'fr_FR',
      'og:image': OG_IMAGE,
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': `${SITE_NAME} : des outils faits main`,
      'twitter:card': 'summary_large_image',
      'twitter:title': page.title,
      'twitter:description': page.description,
      'twitter:image': OG_IMAGE,
    };
    for (const [key, content] of Object.entries(tags)) {
      const attr = key.startsWith('og:') ? 'property' : 'name';
      this.meta.updateTag({ [attr]: key, content }, `${attr}="${key}"`);
    }
    this.setCanonical(page.url);
    this.setJsonLd(page.jsonLd);
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data: object): void {
    let script = this.document.head.querySelector<HTMLScriptElement>('script#ld-json');
    if (!script) {
      script = this.document.createElement('script');
      script.id = 'ld-json';
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    // « < » échappé : le contenu ne peut pas fermer la balise script.
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }
}
