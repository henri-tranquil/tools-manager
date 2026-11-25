# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Le projet

**tools-manager** (nom affiché : **L'Établi**, provisoire) est une application Angular qui sert à la fois de **boîte à outils personnelle** et de **portfolio** pour un développeur bricoleur. Elle est publiée sur **GitHub Pages** depuis le dépôt public `henri-tranquil/tools-manager`, à l'adresse `https://henri-tranquil.github.io/tools-manager/`.

Le site a deux publics :
- **le propriétaire**, qui s'en sert au quotidien (sport, cuisine, atelier, développement) ;
- **les visiteurs et recruteurs** : c'est une vitrine. La qualité visuelle et la finition comptent autant que les fonctionnalités.

Stack : Angular 22 (zoneless, composants standalone, signals, `@defer`, `OnPush` partout), SCSS, Vitest via `ng test`, polices auto-hébergées avec Fontsource (déclarées dans `angular.json` → `styles`). Il n'y a pas de routeur.

## Commandes

```bash
npm start                 # ng serve sur http://localhost:4200
npm test                  # Vitest en mode watch
npm run test:ci           # une seule passe (utilisé par la CI)
npx ng test --watch=false --include src/app/tools/dev/lighthouse/lighthouse-score.spec.ts   # un seul fichier
npm run build             # build de production
npm run build:pages       # build avec --base-href /tools-manager/ + copie index.html → 404.html
```

Le déploiement passe par `.github/workflows/deploy.yml` : à chaque push sur `main`, il lance `test:ci` puis `build:pages`, et publie `dist/tools-manager/browser` sur GitHub Pages. Dans les réglages du dépôt, la source de Pages doit être « GitHub Actions ».

## Règle absolue : aucune donnée personnelle

Le dépôt est **public**. Il ne doit contenir **aucune** donnée personnelle, ni dans le code, ni dans les fixtures, ni dans les commits, ni dans les captures :

- pas de nom réel, d'e-mail, de téléphone ni d'adresse ;
- pas de coordonnées GPS, de traces GPX ni de lieu de départ habituel ;
- pas de données de santé : FC max, poids, temps de course réels ;
- les valeurs par défaut des outils sont des exemples génériques.

Les outils calculent **tout dans le navigateur**. Aucun appel réseau, aucun compte, aucun traceur ni outil d'analyse d'audience. Si un outil doit mémoriser des réglages, il utilise `localStorage`, jamais un backend. La promesse « 100 % local, 0 compte requis » est affichée sur le site et doit rester vraie.

## Concept clé : trois types d'outils

Chaque entrée d'une section appartient à l'un de ces trois types. Toute l'architecture s'organise autour de cette distinction :

| Type | Où se trouve le code | Comportement dans l'app |
|---|---|---|
| `internal` | Dans **ce** dépôt (ex. le minuteur) | Se **déplie sur place** dans sa section, sans changer de page (composant chargé avec `@defer`) |
| `external` | Outil autonome dans **un autre dépôt** (ex. Cartography) | Lien sortant, ouvert dans un nouvel onglet (`target="_blank" rel="noopener"`) |
| `link` | Ressource simple (une recette, un article) | Lien sortant, ouvert dans un nouvel onglet |

Les projets de la section « Mes réalisations » sont de type `external`, accompagnés de métadonnées de portfolio : description, capture d'écran, technologies, URL.

## Architecture

Le registre `src/app/core/registry/tools.registry.ts` (types dans `models.ts`) est la **source unique** :
- `SECTIONS` : chaque section a un `id`, un `title`, une `color`, des `tags`, un `defaultOpen` et ses outils.
- `WORKS` : les réalisations.
- `ACTIVITIES` : les mots du bandeau défilant.
- `REPOSITORY_URL` : l'adresse du dépôt.

À partir de ce registre sont générés le menu (`layout/site-header`), les compteurs et les autocollants de l'accueil (`sections/hero`), les sections (`sections/tool-section`), les réalisations (`sections/realisations`) et la palette de recherche (`layout/search-dialog`). `tools.registry.spec.ts` vérifie la cohérence du registre : identifiants uniques, `defaultOpen` valides, URL présentes.

- **Une seule page.** `App` empile l'accueil, une `ToolSection` par entrée de `SECTIONS`, puis `Realisations`. Les liens de l'en-tête sont des ancres. Chaque section a `min-height: calc(100svh - var(--header-h))`. Le défilement s'aimante sur les sections grâce à `scroll-snap-type: y proximity` sur `html`. On utilise `proximity` et non `mandatory`, parce qu'un panneau déplié peut dépasser l'écran.
- **État des outils ouverts : le service `core/open-tools.ts`.**
  - Il garde au plus un outil ouvert par section, dans un signal.
  - Au démarrage, il ouvre le `defaultOpen` de chaque section, puis l'outil donné par `?outil=<id>` s'il y en a un.
  - Il écrit l'outil ouvert dans l'URL avec `history.replaceState`, sans navigation.
  - `App` fait défiler jusqu'à la section d'un lien direct, et gère le raccourci `Ctrl/⌘ K`.
- **Panneaux : `sections/tool-panel`.**
  - Le panneau aiguille sur `tool.panel` (`minuteur`, `convertisseur`, `lighthouse`, `km-effort`), et chaque composant est chargé avec `@defer`.
  - Un outil interne sans `panel` affiche « En construction ».
  - **Pour ajouter un outil interne** : créer le composant dans `src/app/tools/<section>/<outil>/`, ajouter sa valeur à `ToolPanel` dans `models.ts`, ajouter un `@case` + `@defer` dans `tool-panel.html`, puis renseigner `panel` dans le registre.
- **Logique séparée de l'affichage.** Chaque outil met ses calculs dans un fichier de fonctions pures avec ses tests (`lighthouse-score.ts`, `trail-estimate.ts`, `unit-pairs.ts`, `presets.ts`) et garde un composant léger. La saisie de nombres passe par `shared/format.ts` : `parseDecimal` accepte la virgule, et `formatDecimal` affiche en fr-FR.
- **Styles.** Les tokens et les utilitaires partagés (`.lift`, `.btn`, `.field`, `.tag`, `.pill`, `.kicker`, `.visually-hidden`) sont dans `src/styles.scss`. Les composants n'utilisent que les variables CSS. Une section reçoit sa couleur via `[style.--section-color]`. Le budget est de 6 kB de style par composant (avertissement).

## Design : neo-brutalisme « Atelier + Pop »

C'est ce que voient les recruteurs : chaque écran doit être soigné.

- **Couleurs (tokens CSS sur `:root`)** :
  - fond crème `#FFF4E0` avec une trame de points ;
  - encre `#111` ;
  - en-tête jaune `#FFD23F` ;
  - accents corail `#FF6B6B` et menthe `#7CE0B5` ;
  - les couleurs de section viennent du registre (voir le catalogue).
- **Formes** :
  - bordures `#111` de 3 à 4 px ;
  - ombres portées **nettes**, sans flou (`6px 6px 0 #111`, et 10 px pour les panneaux) ;
  - arrondis de 8 à 18 px ;
  - pastilles en forme de pilule.
- **Typographie** : titres en **Archivo Black** (resserrés, letter-spacing négatif), texte courant en **Space Grotesk**, étiquettes et chiffres techniques en **Space Mono** (majuscules).
- **Signatures visuelles** :
  - numéro de section géant en contour (`-webkit-text-stroke`) ;
  - mot surligné dans un bloc corail incliné dans le titre principal ;
  - bandeau défilant noir et jaune ;
  - autocollant rond qui oscille ;
  - cartes de réalisations présentées comme des fenêtres de navigateur.
- **Micro-interactions** :
  - au survol, une carte se soulève (`translate(-3px,-3px)` et l'ombre grandit) ;
  - au clic, elle s'enfonce (`translate(3px,3px)` et l'ombre rétrécit) ;
  - une carte ouverte reste enfoncée.
  - Toutes les animations sont coupées sous `prefers-reduced-motion`.
- **Accessibilité** : de vrais `<button>` et `<a>`, `aria-expanded` sur les cartes dépliables, `aria-pressed` sur les préréglages, `role="timer"`, un focus visible (contour de 4 px), et un contraste d'au moins 4.5:1 (texte toujours `#111` sur les couleurs vives).

## Catalogue prévu

Sauf mention contraire, les outils sont de type `internal`. Les outils marqués ★ sont ceux qui fonctionnent déjà dans la maquette et qui servent de vitrine.

| # | Section | Couleur | Outils |
|---|---|---|---|
| 01 | Web & dev | `#FF9EC7` | ★ Score Lighthouse, Budget de poids (temps de chargement 3G/4G/fibre), px ↔ rem, Contraste WCAG, Couleurs HEX↔RGB↔HSL, Cron en clair |
| 02 | Sport (trail, vélo, rando) | `#8FD3FF` | ★ Km-effort trail, Allure ↔ vitesse, Temps de rando (DIN 33466), Développement vélo, Zones cardio, Ravitaillement |
| 03 | Cuisine | `#FFE066` | ★ Minuteur (préréglages coque 3', mollet 6', dur 9', pâtes 10', riz 12', thé 4'), Mesures (tasses/cuillères → g), Portions, Taille du moule, Pourcentage du boulanger, Recettes favorites (`link`) |
| 04 | Atelier (bois, couture, marqueterie, cyanotype) | `#FFB38A` | Angle d'onglet, Débit de planches, Métrage de tissu, Cyanotype (dosage A/B et minuteur d'exposition), Nombre d'or, Niveau à bulle |
| 05 | Conversion | `#7CE0B5` | ★ in↔cm, mi↔km, lb↔kg, oz↔g, °F↔°C, gal US↔L |
| 06 | Quotidien | `#D9F99D` | Pomodoro, Chronomètre, Règle de trois, Mot de passe, Tirage au sort, QR code |
| 07 | Mes réalisations | `#B8A9FF` | Anne Fait Main, Cartography, Marqueterie de paille (`external`) |

Formules de référence :
- **Score Lighthouse** (v10+, mobile) : chaque métrique est notée selon une courbe log-normale définie par son `p10` et sa médiane. Cela donne `score = ½·(1 − erf((ln x − ln médiane) / (σ√2)))` avec `σ = (ln médiane − ln p10) / 1,28155`. Poids : FCP 10 % (1800/3000 ms), SI 10 % (3387/5800 ms), LCP 25 % (2500/4000 ms), TBT 30 % (200/600 ms), CLS 25 % (0,1/0,25). Seuils de couleur : 90 et plus vert, 50 à 89 orange, moins de 50 rouge.
- **Km-effort** : `km + D+/100`. Le temps estimé vaut km-effort × allure sur le plat. Pour le ravitaillement, on compte 0,5 L d'eau et 60 g de glucides par heure.
- **Conversion** : un seul composant à deux champs bidirectionnels, paramétré par paire d'unités (fonctions `f`/`g`, valeur par défaut, formule affichée). Il accepte la virgule décimale.
