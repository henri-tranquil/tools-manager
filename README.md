# L'Établi

Boîte à outils et portfolio d'un dev bricoleur : des outils faits main pour le trail, la cuisine,
l'atelier, le japonais et le code.

**En ligne :** https://henri-tranquil.github.io/tools-manager/

- **Une seule page**, une section par thème, et les outils se déplient sur place.
- **Calculs locaux** : aucun compte, aucun serveur, aucun traceur. Seule exception : l'analyse
  Lighthouse d'une URL, qui interroge l'API PageSpeed Insights de Google au clic.
- **Une URL par outil**, prérendue et indexable : `/outils/<id>/` (par ex. [`/outils/lighthouse/`](https://henri-tranquil.github.io/tools-manager/outils/lighthouse/)), avec sitemap, données structurées et image de partage.
- **Recherche** avec `Ctrl K` / `⌘ K`.

## Outils (42)

| Section | Outils |
|---|---|
| Web & dev | Score Lighthouse (par URL ou à la main), budget de poids, px ↔ rem, contraste WCAG, couleurs, cron en clair |
| Sport | Km-effort trail, allure ↔ vitesse, temps de rando (DIN 33466), développement vélo, zones cardio, ravitaillement |
| Cuisine | Minuteur, mesures américaines, portions, taille du moule, pourcentage du boulanger, carnet de recettes |
| Atelier | Angle d'onglet, débit de planches, métrage de tissu, cyanotype, nombre d'or, niveau à bulle |
| Conversion | in ↔ cm, mi ↔ km, lb ↔ kg, oz ↔ g, °F ↔ °C, gal US ↔ L |
| Quotidien | Pomodoro, chronomètre, règle de trois, mot de passe, tirage au sort, QR code |
| Japonais | Quiz kana, lecture de phrases, quiz kanji (JLPT N5/N4), dessin de kana reconnu à la souris, rōmaji ↔ kana, traduction mot à mot avec furigana (saisie au clavier kana, au dessin ou en rōmaji) |

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

### Données des outils de japonais

Les données sont générées par les scripts de `scripts/japonais/` à partir de sources libres
(voir l'en-tête de chaque script pour l'usage) :

- tracés des kana et des kanji N5/N4 : [KanjiVG](https://kanjivg.tagaini.net), © Ulrich Apel, CC BY-SA 3.0 ;
- kanji N5/N4 et dictionnaire (`public/japonais/dico.json`) : KANJIDIC2 et JMdict, © EDRDG,
  CC BY-SA 4.0, via [jmdict-simplified](https://github.com/scriptin/jmdict-simplified) ;
- découpage des phrases : [kuromoji](https://github.com/sglkc/kuromoji.js) (Apache 2.0) et son
  dictionnaire IPAdic, copié dans le build depuis `node_modules`.

Ces dictionnaires sont servis par le site lui-même et ne sont téléchargés qu'à l'ouverture de
l'outil concerné : aucun texte n'est envoyé à un service tiers.

Le déploiement est automatique à chaque push sur `main` (voir `.github/workflows/deploy.yml`).
