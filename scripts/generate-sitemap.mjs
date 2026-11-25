#!/usr/bin/env node
/**
 * Génère sitemap.xml à partir des pages réellement prérendues : chaque dossier contenant
 * un index.html devient une URL. Aucune liste à tenir à jour à la main.
 *
 * Usage : node scripts/generate-sitemap.mjs [dossier du build] [URL du site]
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const outDir = process.argv[2] ?? 'dist/tools-manager/browser';
const siteUrl = (process.argv[3] ?? 'https://henri-tranquil.github.io/tools-manager/').replace(
  /\/?$/,
  '/',
);
const today = new Date().toISOString().slice(0, 10);

function findPages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return findPages(path);
    }
    return name === 'index.html' ? [relative(outDir, dir)] : [];
  });
}

const escapeXml = (text) =>
  text.replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  );

const pages = findPages(outDir)
  .map((dir) => dir.split(sep).filter(Boolean).join('/'))
  .sort((a, b) => a.length - b.length || a.localeCompare(b));

if (pages.length === 0) {
  console.error(`Aucune page prérendue trouvée dans ${outDir}.`);
  process.exit(1);
}

const urls = pages.map((path) => {
  const loc = path ? `${siteUrl}${path}/` : siteUrl;
  const priority = path ? '0.8' : '1.0';
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
writeFileSync(join(outDir, 'sitemap.xml'), xml);
console.log(`sitemap.xml : ${pages.length} URL.`);
