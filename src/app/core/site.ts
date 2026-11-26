/** Identité publique du site, utilisée pour le référencement (balises meta, JSON-LD, sitemap). */
export const SITE_URL = 'https://henri-tranquil.github.io/tools-manager/';
export const SITE_NAME = "L'Établi";
export const SITE_TITLE = "L'Établi — boîte à outils & portfolio d'un dev bricoleur";
export const SITE_DESCRIPTION =
  "42 outils gratuits faits main pour le trail, la cuisine, l'atelier, le japonais et le code : Lighthouse, km-effort, minuteur, quiz kana… Sans compte.";
export const OG_IMAGE = `${SITE_URL}og-image.png`;

/** Chemin (relatif à la base) de la page d'un outil. */
export const toolPath = (toolId: string): string => `outils/${toolId}`;

/** URL absolue et canonique d'un chemin (GitHub Pages sert les dossiers avec un « / » final). */
export function absoluteUrl(path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `${SITE_URL}${clean}/` : SITE_URL;
}
