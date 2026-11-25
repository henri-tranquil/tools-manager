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
npm run build:pages       # build pour GitHub Pages en local (sans clé PageSpeed)
```

Le déploiement passe par `.github/workflows/deploy.yml` : à chaque push sur `main`, il lance `test:ci`, construit avec `--base-href /tools-manager/` et `--define PSI_API_KEY=…` (secret de dépôt `PAGESPEED_API_KEY`, facultatif), copie `index.html` en `404.html`, puis publie `dist/tools-manager/browser` sur GitHub Pages (source de Pages : « GitHub Actions », déjà activée).

## Règle absolue : aucune donnée personnelle

Le dépôt est **public**. Il ne doit contenir **aucune** donnée personnelle, ni dans le code, ni dans les fixtures, ni dans les commits, ni dans les captures :

- pas de nom réel, d'e-mail, de téléphone ni d'adresse ;
- pas de coordonnées GPS, de traces GPX ni de lieu de départ habituel ;
- pas de données de santé : FC max, poids, temps de course réels ;
- les valeurs par défaut des outils sont des exemples génériques.

Les outils calculent **tout dans le navigateur** : aucun compte, aucun traceur ni outil d'analyse d'audience. Si un outil doit mémoriser des réglages, il utilise `shared/storage.ts` (`localStorage`, clés préfixées `etabli:`), jamais un backend.

**Seule exception réseau** : l'analyse Lighthouse d'une URL (`tools/dev/lighthouse/psi.ts`) appelle l'API PageSpeed Insights de Google, uniquement au clic sur « Analyser », et l'outil le dit à l'écran. Le pied de page et l'accueil mentionnent cette exception : tout nouvel appel réseau doit être signalé de la même façon. La clé d'API n'est jamais écrite dans le code : elle est injectée au build (`declare const PSI_API_KEY` + `--define`). Sans clé, le quota anonyme partagé est souvent épuisé (erreur 429) : l'outil propose alors un lien vers pagespeed.web.dev.

## Concept clé : trois types d'outils

Chaque entrée d'une section appartient à l'un de ces trois types. Toute l'architecture s'organise autour de cette distinction :

| Type | Où se trouve le code | Comportement dans l'app |
|---|---|---|
| `internal` | Dans **ce** dépôt (ex. le minuteur) | Se **déplie sur place** dans sa section, sans changer de page (composant chargé à la demande) |
| `external` | Outil autonome dans **un autre dépôt** (ex. CartoCraft) | Lien sortant, ouvert dans un nouvel onglet (`target="_blank" rel="noopener"`) |
| `link` | Ressource simple (une recette, un article) | Lien sortant, ouvert dans un nouvel onglet |

Les projets de la section « Mes réalisations » sont de type `external`, accompagnés de métadonnées de portfolio : description, capture d'écran, technologies, URL.

## Architecture

Le registre `src/app/core/registry/tools.registry.ts` (types dans `models.ts`) est la **source unique** :
- `SECTIONS` : chaque section a un `id`, un `title`, une `color`, des `tags`, un `defaultOpen` et ses outils.
- `WORKS` : les réalisations.
- `ACTIVITIES` : les mots du bandeau défilant.
- `REPOSITORY_URL` : l'adresse du dépôt.

À partir de ce registre sont générés le menu (`layout/site-header`), les compteurs et les autocollants de l'accueil (`sections/hero`), les sections (`sections/tool-section`), les réalisations (`sections/realisations`) et la palette de recherche (`layout/search-dialog`). `tools.registry.spec.ts` vérifie la cohérence du registre : identifiants uniques, `defaultOpen` valides, URL présentes, et un panneau chargeable pour chaque outil interne.

- **Une seule page.** `App` empile l'accueil, une `ToolSection` par entrée de `SECTIONS`, puis `Realisations`. Les liens de l'en-tête sont des ancres. Chaque section a `min-height: calc(100svh - var(--header-h))`. Le défilement s'aimante sur les sections grâce à `scroll-snap-type: y proximity` sur `html`. On utilise `proximity` et non `mandatory`, parce qu'un panneau déplié peut dépasser l'écran.
- **État des outils ouverts : le service `core/open-tools.ts`.**
  - Il garde au plus un outil ouvert par section, dans un signal.
  - Au démarrage, il ouvre le `defaultOpen` de chaque section, puis l'outil donné par `?outil=<id>` s'il y en a un.
  - Il écrit l'outil ouvert dans l'URL avec `history.replaceState`, sans navigation.
  - `App` fait défiler jusqu'à la section d'un lien direct, et gère le raccourci `Ctrl/⌘ K`.
- **Panneaux : `sections/tool-panel` + `tools/panels.ts`.**
  - `PANEL_LOADERS` associe chaque clé de panneau à un `import()` dynamique : un chunk par outil, téléchargé à l'ouverture. Le type `ToolPanel` est dérivé de ses clés.
  - `ToolPanel` charge le composant avec `resource()` et l'affiche avec `NgComponentOutlet`. Seul le convertisseur reçoit une entrée (`pairId`, depuis `tool.unitPair`).
  - **Pour ajouter un outil interne** : créer le composant dans `src/app/tools/<section>/<outil>/`, ajouter une entrée dans `PANEL_LOADERS`, puis `panel: '<clé>'` dans le registre. Un outil interne sans `panel` affiche « En construction » (filet de sécurité ; le test du registre l'interdit).
- **Logique séparée de l'affichage.** Les calculs sont des fonctions pures testées, regroupées par section : `dev/color.ts`, `dev/cron/cron-parser.ts`, `dev/budget-poids/load-time.ts`, `dev/lighthouse/{lighthouse-score,psi}.ts`, `sport/sport-math.ts`, `cuisine/kitchen-math.ts`, `atelier/workshop-math.ts`, `quotidien/daily-math.ts`, `conversion/convertisseur/unit-pairs.ts`. Les composants restent légers ; les nouveaux outils utilisent un `template`/`styles` inline.
- **Utilitaires partagés (`src/app/shared/`)** : `format.ts` (`parseDecimal` accepte la virgule, `formatDecimal` en fr-FR), `time.ts` (saisie et affichage de durées), `countdown.ts` (compte à rebours basé sur une échéance, pour minuteur, pomodoro, cyanotype ; appeler `dispose()` à la destruction), `beep.ts` (bips Web Audio), `random.ts` (`cryptoRandomInt` sans biais, injectable pour des tests déterministes), `storage.ts`.
- **Styles.** Les tokens et les utilitaires partagés (`.lift`, `.btn`, `.field`, `.tag`, `.pill`, `.kicker`, `.visually-hidden`) sont dans `src/styles.scss`, ainsi que la mise en page commune des outils : `.tool-layout` (saisies à gauche, résultats à droite), `.tile` (+ variantes de couleur, `--wide`), `.tile__value`, `.seg` (choix exclusif avec `aria-pressed`), `.table`, `.clock`, `.check`, `.swatch-input`, `.note`. Dans les `<select>`, utiliser `[selected]` sur les `<option>` plutôt que `[value]` sur le `<select>`. Un formulaire qui valide lui-même ses URL porte `novalidate`. Les composants n'utilisent que les variables CSS. Une section reçoit sa couleur via `[style.--section-color]`. Le budget est de 6 kB de style par composant (avertissement).

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

## Catalogue

Tous les outils listés sont de type `internal` et fonctionnent. Les ★ sont ouverts par défaut (`defaultOpen`) et servent de vitrine.

| # | Section | Couleur | Outils |
|---|---|---|---|
| 01 | Web & dev | `#FF9EC7` | ★ Score Lighthouse (analyse d'URL via PageSpeed Insights, ou calcul à la main), Budget de poids (temps de chargement 3G/4G/fibre), px ↔ rem, Contraste WCAG, Couleurs HEX↔RGB↔HSL, Cron en clair |
| 02 | Sport (trail, vélo, rando) | `#8FD3FF` | ★ Km-effort trail, Allure ↔ vitesse, Temps de rando (DIN 33466), Développement vélo, Zones cardio, Ravitaillement |
| 03 | Cuisine | `#FFE066` | ★ Minuteur (préréglages coque 3', mollet 6', dur 9', pâtes 10', riz 12', thé 4'), Mesures (tasses/cuillères → g), Portions, Taille du moule, Pourcentage du boulanger, Recettes favorites (carnet de liens en `localStorage`) |
| 04 | Atelier (bois, couture, marqueterie, cyanotype) | `#FFB38A` | Angle d'onglet, Débit de planches, Métrage de tissu, Cyanotype (dosage A/B et minuteur d'exposition), Nombre d'or, Niveau à bulle |
| 05 | Conversion | `#7CE0B5` | ★ in↔cm, mi↔km, lb↔kg, oz↔g, °F↔°C, gal US↔L |
| 06 | Quotidien | `#D9F99D` | Pomodoro, Chronomètre, Règle de trois, Mot de passe, Tirage au sort, QR code |
| 07 | Mes réalisations | `#B8A9FF` | Anne Fait Main, CartoCraft, Marqueterie de paille (`WORKS`, URL publiques) |

Formules de référence :
- **Score Lighthouse** (v10+, mobile) : chaque métrique est notée selon une courbe log-normale définie par son `p10` et sa médiane. Cela donne `score = ½·(1 − erf((ln x − ln médiane) / (σ√2)))` avec `σ = (ln médiane − ln p10) / 1,28155`. Poids : FCP 10 % (1800/3000 ms), SI 10 % (3387/5800 ms), LCP 25 % (2500/4000 ms), TBT 30 % (200/600 ms), CLS 25 % (0,1/0,25). Seuils de couleur : 90 et plus vert, 50 à 89 orange, moins de 50 rouge.
- **Km-effort** : `km + D+/100`. Le temps estimé vaut km-effort × allure sur le plat. Pour le ravitaillement, on compte 0,5 L d'eau et 60 g de glucides par heure.
- **Conversion** : un seul composant à deux champs bidirectionnels, paramétré par paire d'unités (fonctions `f`/`g`, valeur par défaut, formule affichée). Il accepte la virgule décimale.
