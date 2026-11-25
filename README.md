# L'Établi

Boîte à outils et portfolio d'un dev bricoleur : des outils faits main pour le trail, la cuisine,
l'atelier et le code.

**En ligne :** https://henri-tranquil.github.io/tools-manager/

- **Une seule page**, une section par thème, et les outils se déplient sur place.
- **100 % local** : aucun compte, aucun serveur, aucun traceur. Tous les calculs se font dans le navigateur.
- **Lien direct vers un outil** : `?outil=<id>` (par ex. `?outil=lighthouse`).
- **Recherche** avec `Ctrl K` / `⌘ K`.

## Outils disponibles

| Outil | Ce qu'il fait |
|---|---|
| Score Lighthouse | Recalcule le score de performance (barème v10+, mobile) à partir de FCP, SI, LCP, TBT et CLS. |
| Km-effort trail | Calcule l'effort à partir de la distance et du dénivelé, puis le temps estimé et le ravitaillement. |
| Minuteur | Préréglages œufs, pâtes, riz, thé, avec un bip à la fin. |
| Conversions | in ↔ cm, mi ↔ km, lb ↔ kg, oz ↔ g, °F ↔ °C, gal US ↔ L. |

Les autres outils du catalogue sont annoncés « En construction ».

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
