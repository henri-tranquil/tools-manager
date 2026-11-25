# L'Établi

Boîte à outils et portfolio d'un dev bricoleur : des outils faits main pour le trail, la cuisine,
l'atelier et le code.

**En ligne :** https://henri-tranquil.github.io/tools-manager/

- **Une seule page**, une section par thème, et les outils se déplient sur place.
- **Calculs locaux** : aucun compte, aucun serveur, aucun traceur. Seule exception : l'analyse
  Lighthouse d'une URL, qui interroge l'API PageSpeed Insights de Google au clic.
- **Une URL par outil**, prérendue et indexable : `/outils/<id>/` (par ex. [`/outils/lighthouse/`](https://henri-tranquil.github.io/tools-manager/outils/lighthouse/)), avec sitemap, données structurées et image de partage.
- **Recherche** avec `Ctrl K` / `⌘ K`.

## Outils (36)

| Section | Outils |
|---|---|
| Web & dev | Score Lighthouse (par URL ou à la main), budget de poids, px ↔ rem, contraste WCAG, couleurs, cron en clair |
| Sport | Km-effort trail, allure ↔ vitesse, temps de rando (DIN 33466), développement vélo, zones cardio, ravitaillement |
| Cuisine | Minuteur, mesures américaines, portions, taille du moule, pourcentage du boulanger, carnet de recettes |
| Atelier | Angle d'onglet, débit de planches, métrage de tissu, cyanotype, nombre d'or, niveau à bulle |
| Conversion | in ↔ cm, mi ↔ km, lb ↔ kg, oz ↔ g, °F ↔ °C, gal US ↔ L |
| Quotidien | Pomodoro, chronomètre, règle de trois, mot de passe, tirage au sort, QR code |

### Clé PageSpeed Insights (facultative)

Sans clé, l'analyse Lighthouse utilise un quota anonyme partagé, souvent épuisé. Pour une clé dédiée :
créer une clé d'API Google Cloud restreinte à l'API PageSpeed Insights et au référent
`henri-tranquil.github.io/*`, puis l'ajouter aux secrets du dépôt sous le nom `PAGESPEED_API_KEY`.
Elle est injectée au build, jamais écrite dans le code source.

## Développement

```bash
npm install
npm start            # http://localhost:4200
npm test             # tests unitaires (Vitest)
npm run build:pages  # build pour GitHub Pages
```

Stack : Angular 22 (composants standalone, signals, `@defer`), SCSS, Vitest. Les polices sont
auto-hébergées via Fontsource.

Le déploiement est automatique à chaque push sur `main` (voir `.github/workflows/deploy.yml`).
