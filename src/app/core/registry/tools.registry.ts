import { Section, Tool, Work } from './models';

/**
 * Registre unique du site : l'accueil, le menu, les sections, la recherche et les
 * compteurs sont générés à partir d'ici.
 *
 * Dépôt public : aucune donnée personnelle ici (nom, lieux, traces, données de santé).
 */
export const SECTIONS: readonly Section[] = [
  {
    id: 'dev',
    title: 'Web & dev',
    color: '#FF9EC7',
    tags: ['Performance', 'Accessibilité', 'Front-end'],
    description:
      "Les calculettes que j'ouvre tous les jours en développant : performance, couleurs, unités CSS.",
    defaultOpen: 'lighthouse',
    tools: [
      {
        id: 'lighthouse',
        title: 'Score Lighthouse',
        description: 'Recalcule le score de performance à partir des métriques.',
        mono: 'LH',
        about:
          "Analysez la performance d'une page web avec Lighthouse : score sur 100, LCP, CLS, TBT, FCP et Speed Index, ou recalculez le score à partir de vos métriques.",
        type: 'internal',
        panel: 'lighthouse',
      },
      {
        id: 'budget-poids',
        title: 'Budget de poids',
        description: "Temps de chargement d'une page selon le réseau : 3G, 4G, fibre.",
        mono: 'kB',
        about:
          "Estimez le temps de chargement d'une page selon son poids et le réseau (3G, 4G, ADSL, fibre), et le poids maximal pour tenir un objectif de vitesse.",
        type: 'internal',
        panel: 'budget-poids',
      },
      {
        id: 'px-rem',
        title: 'px ↔ rem',
        description: 'Conversion selon la taille de police racine.',
        mono: 'rem',
        about:
          'Convertissez des pixels en rem et inversement selon la taille de police racine, avec une table des tailles courantes prête à copier dans votre CSS.',
        type: 'internal',
        panel: 'px-rem',
      },
      {
        id: 'contraste',
        title: 'Contraste WCAG',
        description: 'Ratio texte / fond et niveaux AA / AAA.',
        mono: 'Aa',
        about:
          'Vérifiez le contraste entre une couleur de texte et une couleur de fond : ratio WCAG et niveaux AA et AAA pour le texte courant et le grand texte.',
        type: 'internal',
        panel: 'contraste',
      },
      {
        id: 'couleurs',
        title: 'Couleurs',
        description: 'HEX ↔ RGB ↔ HSL, avec aperçu et palette.',
        mono: '#',
        about:
          'Convertissez une couleur entre HEX, RGB et HSL, et générez ses teintes et nuances en un clic pour construire une palette cohérente.',
        type: 'internal',
        panel: 'couleurs',
      },
      {
        id: 'cron',
        title: 'Cron en clair',
        description: 'Traduit une expression cron en français.',
        mono: '*/5',
        about:
          'Traduisez une expression cron en français clair et affichez ses prochaines exécutions. Gère les intervalles, les listes, les pas et les macros @daily.',
        type: 'internal',
        panel: 'cron',
      },
    ],
  },
  {
    id: 'sport',
    title: 'Sport',
    color: '#8FD3FF',
    tags: ['Trail', 'Vélo', 'Rando'],
    description:
      'Préparer une sortie : effort, allure, temps de marche, développement et ravitaillement.',
    defaultOpen: 'km-effort',
    tools: [
      {
        id: 'km-effort',
        title: 'Km-effort trail',
        description: 'Distance + dénivelé → effort, temps et ravito.',
        mono: 'D+',
        about:
          "Calculez le kilomètre-effort d'un trail à partir de la distance et du dénivelé positif, puis le temps de course estimé et l'eau et les glucides à prévoir.",
        type: 'internal',
        panel: 'km-effort',
      },
      {
        id: 'allure',
        title: 'Allure ↔ vitesse',
        description: 'min/km ↔ km/h et temps de passage.',
        mono: 'km/h',
        about:
          'Convertissez une allure de course en min/km en vitesse en km/h, et obtenez les temps de passage sur 5 km, 10 km, semi-marathon et marathon.',
        type: 'internal',
        panel: 'allure',
      },
      {
        id: 'temps-rando',
        title: 'Temps de rando',
        description: 'Durée de marche selon distance et dénivelé (DIN 33466).',
        mono: 'h:m',
        about:
          "Estimez la durée d'une randonnée selon la distance, la montée et la descente avec la norme DIN 33466, pauses comprises.",
        type: 'internal',
        panel: 'temps-rando',
      },
      {
        id: 'developpement-velo',
        title: 'Développement vélo',
        description: 'Plateau, pignon, roue → mètres par tour et vitesse.',
        mono: '52/11',
        about:
          "Calculez le développement d'un vélo selon le plateau, le pignon et la roue, et la vitesse obtenue à chaque cadence de pédalage.",
        type: 'internal',
        panel: 'developpement-velo',
      },
      {
        id: 'zones-cardio',
        title: 'Zones cardio',
        description: "Zones d'entraînement depuis la FC max et la FC de repos.",
        mono: 'FC',
        about:
          'Calculez vos cinq zones de fréquence cardiaque avec la méthode de Karvonen, à partir de la FC max et de la FC de repos.',
        type: 'internal',
        panel: 'zones-cardio',
      },
      {
        id: 'ravitaillement',
        title: 'Ravitaillement',
        description: 'Eau, sel et glucides à emporter selon la durée.',
        mono: 'H₂O',
        about:
          "Planifiez l'eau, le sodium et les glucides à emporter pour un effort d'endurance selon sa durée et la chaleur.",
        type: 'internal',
        panel: 'ravitaillement',
      },
    ],
  },
  {
    id: 'cuisine',
    title: 'Cuisine',
    color: '#FFE066',
    tags: ['Minuteurs', 'Dosages', 'Pain'],
    description: "Pour ne plus jamais rater un œuf mollet, et adapter n'importe quelle recette.",
    defaultOpen: 'minuteur',
    tools: [
      {
        id: 'minuteur',
        title: 'Minuteur',
        description: 'Préréglages œufs, pâtes, riz, thé.',
        mono: "6'",
        about:
          "Minuteur de cuisine avec préréglages : œuf à la coque, œuf mollet, œuf dur, pâtes, riz et thé. Un bip prévient quand c'est prêt.",
        type: 'internal',
        panel: 'minuteur',
      },
      {
        id: 'mesures',
        title: 'Mesures',
        description: "Tasses et cuillères en grammes, selon l'ingrédient.",
        mono: 'cup',
        about:
          "Convertissez les tasses (cups) et cuillères des recettes américaines en grammes et en millilitres selon l'ingrédient : farine, sucre, beurre…",
        type: 'internal',
        panel: 'mesures',
      },
      {
        id: 'portions',
        title: 'Portions',
        description: 'Recalcule une recette pour 2, 4 ou 10 personnes.',
        mono: '×2',
        about:
          'Adaptez une recette au nombre de personnes : collez la liste des ingrédients et toutes les quantités sont recalculées, fractions comprises.',
        type: 'internal',
        panel: 'portions',
      },
      {
        id: 'taille-moule',
        title: 'Taille du moule',
        description: "Adapte les quantités d'un moule rond à un carré.",
        mono: 'Ø',
        about:
          "Adaptez les quantités d'une recette à la taille de votre moule : rond, carré ou rectangulaire, le coefficient est calculé à partir des surfaces.",
        type: 'internal',
        panel: 'taille-moule',
      },
      {
        id: 'pourcentage-boulanger',
        title: 'Pourcentage du boulanger',
        description: "Farine, eau, sel, levain : l'hydratation d'une pâte.",
        mono: '%',
        about:
          "Calculez une pâte à pain avec le pourcentage du boulanger : eau, sel, levain et levure à partir de la farine, ou d'un poids de pâte visé.",
        type: 'internal',
        panel: 'pourcentage-boulanger',
      },
      {
        id: 'recettes',
        title: 'Recettes favorites',
        description: 'Votre carnet de liens vers des recettes, gardé sur cet appareil.',
        mono: 'Re',
        about:
          'Gardez vos liens de recettes favorites dans un carnet personnel, enregistré uniquement dans votre navigateur.',
        type: 'internal',
        panel: 'recettes',
      },
    ],
  },
  {
    id: 'atelier',
    title: 'Atelier',
    color: '#FFB38A',
    tags: ['Bois', 'Couture', 'Marqueterie', 'Cyanotype'],
    description:
      'Des calculs pour les projets manuels : découpe, tissu, proportions, chimie du cyanotype.',
    tools: [
      {
        id: 'angle-onglet',
        title: "Angle d'onglet",
        description: 'Angle de coupe pour un cadre à n côtés.',
        mono: '45°',
        about:
          "Trouvez l'angle de coupe d'onglet pour un cadre à n côtés et la longueur des montants et de baguette d'un cadre rectangulaire.",
        type: 'internal',
        panel: 'angle-onglet',
      },
      {
        id: 'debit-planches',
        title: 'Débit de planches',
        description: 'Liste de coupes optimisée pour limiter les chutes.',
        mono: 'cut',
        about:
          "Optimisez le débit de vos planches : saisissez les pièces à couper, l'outil répartit les coupes en comptant le trait de scie pour limiter les chutes.",
        type: 'internal',
        panel: 'debit-planches',
      },
      {
        id: 'metrage-tissu',
        title: 'Métrage de tissu',
        description: 'Longueur à acheter selon le patron et la laize.',
        mono: 'm',
        about:
          'Calculez le métrage de tissu à acheter selon la laize et les pièces du patron, avec ou sans rotation des pièces et une marge de sécurité.',
        type: 'internal',
        panel: 'metrage-tissu',
      },
      {
        id: 'cyanotype',
        title: 'Cyanotype',
        description: "Dosage des solutions A et B, minuteur d'exposition aux UV.",
        mono: 'UV',
        about:
          "Préparez les solutions A et B du cyanotype selon la surface à enduire, puis lancez un minuteur d'exposition adapté aux conditions de lumière.",
        type: 'internal',
        panel: 'cyanotype',
      },
      {
        id: 'nombre-or',
        title: "Nombre d'or",
        description: 'Proportions harmonieuses pour un cadre ou un motif.',
        mono: 'φ',
        about:
          "Divisez une longueur selon le nombre d'or (φ ≈ 1,618) et trouvez les proportions d'un rectangle d'or pour un cadre, un meuble ou un motif.",
        type: 'internal',
        panel: 'nombre-or',
      },
      {
        id: 'niveau',
        title: 'Niveau à bulle',
        description: "Utilise le capteur d'inclinaison du téléphone.",
        mono: '0°',
        about:
          "Transformez votre téléphone en niveau à bulle grâce à son capteur d'inclinaison, avec mise à zéro pour compenser une coque.",
        type: 'internal',
        panel: 'niveau',
      },
    ],
  },
  {
    id: 'conversion',
    title: 'Conversion',
    color: '#7CE0B5',
    tags: ['Impérial', 'Métrique'],
    description:
      "Pour les patrons, recettes et fiches techniques américains : on tape dans un champ, l'autre suit.",
    defaultOpen: 'pouces-cm',
    tools: [
      {
        id: 'pouces-cm',
        title: 'Longueurs',
        description: 'Pouces ↔ centimètres',
        mono: 'in',
        about:
          'Convertissez des pouces (inches) en centimètres et inversement : 1 in = 2,54 cm. Pratique pour les patrons, écrans et plans américains.',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'pouces-cm',
      },
      {
        id: 'miles-km',
        title: 'Distances',
        description: 'Miles ↔ kilomètres',
        mono: 'mi',
        about:
          'Convertissez des miles en kilomètres et inversement : 1 mile = 1,609 km. Pour les courses, itinéraires et compteurs anglo-saxons.',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'miles-km',
      },
      {
        id: 'livres-kg',
        title: 'Poids',
        description: 'Livres ↔ kilogrammes',
        mono: 'lb',
        about:
          'Convertissez des livres (lb) en kilogrammes et inversement : 1 lb = 0,454 kg. Pour les recettes, charges et équipements.',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'livres-kg',
      },
      {
        id: 'onces-g',
        title: 'Onces',
        description: 'Onces ↔ grammes',
        mono: 'oz',
        about:
          'Convertissez des onces (oz) en grammes et inversement : 1 oz = 28,35 g. Indispensable pour les recettes américaines.',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'onces-g',
      },
      {
        id: 'fahrenheit-celsius',
        title: 'Températures',
        description: 'Fahrenheit ↔ Celsius',
        mono: '°F',
        about:
          'Convertissez des degrés Fahrenheit en Celsius et inversement, par exemple 350 °F ≈ 177 °C pour régler un four.',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'fahrenheit-celsius',
      },
      {
        id: 'gallons-litres',
        title: 'Volumes',
        description: 'Gallons US ↔ litres',
        mono: 'gal',
        about:
          'Convertissez des gallons américains en litres et inversement : 1 gallon US = 3,785 L.',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'gallons-litres',
      },
    ],
  },
  {
    id: 'quotidien',
    title: 'Quotidien',
    color: '#D9F99D',
    tags: ['Focus', 'Hasard', 'Partage'],
    description: "Les petits utilitaires qu'on cherche toujours au mauvais moment.",
    tools: [
      {
        id: 'pomodoro',
        title: 'Pomodoro',
        description: '25 minutes de travail, 5 minutes de pause.',
        mono: '25',
        about:
          'Minuteur Pomodoro : 25 minutes de travail, 5 minutes de pause et une pause longue toutes les 4 séances, avec des durées réglables.',
        type: 'internal',
        panel: 'pomodoro',
      },
      {
        id: 'chronometre',
        title: 'Chronomètre',
        description: 'Avec tours et temps intermédiaires.',
        mono: '0:00',
        about:
          'Chronomètre au centième avec tours et temps intermédiaires ; le meilleur tour est mis en évidence.',
        type: 'internal',
        panel: 'chronometre',
      },
      {
        id: 'regle-de-trois',
        title: 'Règle de trois',
        description: "Trouve la valeur manquante d'une proportion.",
        mono: '÷',
        about:
          "Calculez une règle de trois en un instant : trouvez la valeur manquante d'une proportion, pour une recette, un prix ou une échelle.",
        type: 'internal',
        panel: 'regle-de-trois',
      },
      {
        id: 'mot-de-passe',
        title: 'Mot de passe',
        description: 'Génère des mots de passe solides, localement.',
        mono: '***',
        about:
          "Générez des mots de passe solides et aléatoires dans votre navigateur : longueur, majuscules, chiffres, symboles et estimation de l'entropie.",
        type: 'internal',
        panel: 'mot-de-passe',
      },
      {
        id: 'tirage-au-sort',
        title: 'Tirage au sort',
        description: 'Dé, pile ou face, un nom au hasard.',
        mono: '?',
        about:
          "Tirez au sort en toute équité : lancer de dés, pile ou face, nombre aléatoire entre deux bornes ou noms tirés d'une liste.",
        type: 'internal',
        panel: 'tirage-au-sort',
      },
      {
        id: 'qr-code',
        title: 'QR code',
        description: 'Transforme un lien ou un texte en QR code.',
        mono: 'QR',
        about:
          "Créez un QR code à partir d'un lien ou d'un texte, choisissez le niveau de correction d'erreur et téléchargez-le en SVG ou en PNG.",
        type: 'internal',
        panel: 'qr-code',
      },
    ],
  },
  {
    id: 'japonais',
    title: 'Japonais',
    color: '#FCA5A5',
    tags: ['Kana', 'Kanji', 'Écoute', 'JLPT'],
    description:
      "J'apprends le japonais : des jeux pour lire les kana et les kanji, des exercices corrigés, de l'écoute et un examen blanc du JLPT N5.",
    defaultOpen: 'quiz-kana',
    tools: [
      {
        id: 'quiz-kana',
        title: 'Quiz kana',
        description: 'Un kana, sa lecture : hiragana et katakana.',
        mono: 'あ',
        about:
          'Apprenez les hiragana et les katakana en jouant : un kana s’affiche, tapez sa lecture en rōmaji. Les kana ratés reviennent plus souvent.',
        type: 'internal',
        kind: 'exercice',
        panel: 'quiz-kana',
      },
      {
        id: 'lecture-phrases',
        title: 'Lecture de phrases',
        description: 'Transcrire une phrase japonaise en rōmaji.',
        mono: '読',
        about:
          'Entraînez-vous à lire le japonais : transcrivez des phrases en kanji et kana en rōmaji, avec furigana en indice et traduction française.',
        type: 'internal',
        kind: 'exercice',
        panel: 'lecture',
      },
      {
        id: 'jeu-traduction',
        title: 'Jeu de traduction',
        description: 'Du japonais au français, et inversement.',
        mono: '⇄',
        about:
          'Traduisez des phrases japonaises en français, ou assemblez la phrase japonaise à partir du français : un jeu pour apprendre le vocabulaire et l’ordre des mots.',
        type: 'internal',
        kind: 'exercice',
        panel: 'jeu-traduction',
      },
      {
        id: 'quiz-kanji',
        title: 'Quiz kanji',
        description: 'Sens et lectures des kanji JLPT N5.',
        mono: '漢',
        about:
          'Révisez les 103 kanji du JLPT N5, le niveau débutant : trouvez leur sens parmi quatre choix ou tapez une lecture on’yomi ou kun’yomi.',
        type: 'internal',
        kind: 'exercice',
        panel: 'quiz-kanji',
      },
      {
        id: 'exercices-japonais',
        title: 'Exercices de grammaire',
        description: 'Particules, conjugaison, nombres : fiches corrigées.',
        mono: '練',
        about:
          'Fiches d’exercices de japonais N5 générées au hasard : particules, conjugaison, compteurs et kanji, corrigées avec la règle et les erreurs classiques.',
        type: 'internal',
        kind: 'exercice',
        panel: 'exercices',
      },
      {
        id: 'ecoute-japonais',
        title: 'Compréhension orale',
        description: 'Dictée, son → kana, dialogues et réponses.',
        mono: '聴',
        about:
          'Entraînez votre oreille au japonais : dictée, kana et kanji à reconnaître au son, dialogues et réponses façon JLPT N5, vitesse réglable.',
        type: 'internal',
        kind: 'exercice',
        panel: 'ecoute',
      },
      {
        id: 'jlpt-n5',
        title: 'Examen blanc JLPT N5',
        description: 'Les trois épreuves, chronométrées et notées.',
        mono: 'N5',
        about:
          'Passez un examen blanc du JLPT N5 : vocabulaire, grammaire et lecture, écoute, chronométrés et notés sur 180 avec les seuils officiels. Le JLPT expliqué.',
        type: 'internal',
        kind: 'examen',
        panel: 'jlpt',
      },
      {
        id: 'dessin-kana',
        title: 'Dessin de kana',
        description: 'Tracez un kana, il devine lequel.',
        mono: '✎',
        about:
          'Dessinez un hiragana ou un katakana à la souris ou au doigt : l’outil le reconnaît, donne un pourcentage de ressemblance et l’ordre des traits.',
        type: 'internal',
        kind: 'exercice',
        panel: 'dessin',
      },
      {
        id: 'romaji-kana',
        title: 'Rōmaji ↔ kana',
        description: 'Conversion dans les deux sens et tableau des kana.',
        mono: 'ka',
        about:
          'Convertissez le rōmaji en hiragana ou katakana et inversement (Hepburn), avec un tableau des kana cliquable pour écrire en japonais.',
        type: 'internal',
        kind: 'outil',
        panel: 'romaji-kana',
      },
      {
        id: 'traduction-japonais',
        title: 'Traduire une phrase',
        description: 'Furigana, rōmaji et sens de chaque mot.',
        mono: '訳',
        about:
          'Collez une phrase japonaise : furigana sur les kanji, lecture en rōmaji et sens de chaque mot en français, calculés dans votre navigateur.',
        type: 'internal',
        kind: 'outil',
        panel: 'traduction',
      },
    ],
    upcoming: [
      {
        id: 'jlpt-n4',
        title: 'Examen blanc JLPT N4',
        description: 'Niveau élémentaire.',
        mono: 'N4',
        kind: 'examen',
      },
      {
        id: 'jlpt-n3',
        title: 'Examen blanc JLPT N3',
        description: 'Niveau intermédiaire.',
        mono: 'N3',
        kind: 'examen',
      },
      {
        id: 'jlpt-n2',
        title: 'Examen blanc JLPT N2',
        description: 'Niveau avancé.',
        mono: 'N2',
        kind: 'examen',
      },
      {
        id: 'jlpt-n1',
        title: 'Examen blanc JLPT N1',
        description: 'Niveau courant.',
        mono: 'N1',
        kind: 'examen',
      },
    ],
  },
];

export const WORKS_SECTION_ID = 'realisations';

export const WORKS: readonly Work[] = [
  {
    id: 'anne-fait-main',
    title: 'Anne Fait Main',
    description:
      "Site vitrine d'une artisane : créations en lin brodé main, catalogue, marchés et salons.",
    url: 'https://www.anne-faitmain.fr/',
    color: '#7CE0B5',
    techs: ['Site vitrine', 'PHP'],
  },
  {
    id: 'cartocraft',
    title: 'CartoCraft',
    description:
      'Éditeur de cartes de mondes imaginaires : relief, rivières, climats et toponymes, directement dans le navigateur.',
    url: 'https://henri-tranquil.github.io/cartocraft/',
    color: '#FFD23F',
    techs: ['Angular', 'Web Workers', 'IndexedDB'],
  },
  {
    id: 'atelier-paille',
    title: 'Marqueterie de paille',
    description:
      'Configurateur pour concevoir une marqueterie de paille et prévisualiser son rendu en 3D.',
    url: 'https://henri-tranquil.github.io/marquetry-configurator/',
    color: '#FF6B6B',
    techs: ['Angular', 'Three.js'],
  },
];

/** Bandeau défilant de l'accueil. */
export const ACTIVITIES: readonly string[] = [
  'Web & dev',
  'Trail',
  'Vélo',
  'Rando',
  'Cuisine',
  'Bois',
  'Couture',
  'Marqueterie',
  'Cyanotype',
  'Conversions',
  'Japonais',
  'Open source',
];

export const REPOSITORY_URL = 'https://github.com/henri-tranquil/tools-manager';

export interface ToolLocation {
  readonly section: Section;
  readonly tool: Tool;
}

export function findTool(toolId: string | null): ToolLocation | null {
  if (!toolId) {
    return null;
  }
  for (const section of SECTIONS) {
    const tool = section.tools.find((t) => t.id === toolId);
    if (tool) {
      return { section, tool };
    }
  }
  return null;
}
