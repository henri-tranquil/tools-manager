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
        type: 'internal',
        panel: 'lighthouse',
      },
      {
        id: 'budget-poids',
        title: 'Budget de poids',
        description: "Temps de chargement d'une page selon le réseau : 3G, 4G, fibre.",
        mono: 'kB',
        type: 'internal',
      },
      {
        id: 'px-rem',
        title: 'px ↔ rem',
        description: 'Conversion selon la taille de police racine.',
        mono: 'rem',
        type: 'internal',
      },
      {
        id: 'contraste',
        title: 'Contraste WCAG',
        description: 'Ratio texte / fond et niveaux AA / AAA.',
        mono: 'Aa',
        type: 'internal',
      },
      {
        id: 'couleurs',
        title: 'Couleurs',
        description: 'HEX ↔ RGB ↔ HSL, avec aperçu et palette.',
        mono: '#',
        type: 'internal',
      },
      {
        id: 'cron',
        title: 'Cron en clair',
        description: 'Traduit une expression cron en français.',
        mono: '*/5',
        type: 'internal',
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
        type: 'internal',
        panel: 'km-effort',
      },
      {
        id: 'allure',
        title: 'Allure ↔ vitesse',
        description: 'min/km ↔ km/h et temps de passage.',
        mono: 'km/h',
        type: 'internal',
      },
      {
        id: 'temps-rando',
        title: 'Temps de rando',
        description: 'Durée de marche selon distance et dénivelé (DIN 33466).',
        mono: 'h:m',
        type: 'internal',
      },
      {
        id: 'developpement-velo',
        title: 'Développement vélo',
        description: 'Plateau, pignon, roue → mètres par tour et vitesse.',
        mono: '52/11',
        type: 'internal',
      },
      {
        id: 'zones-cardio',
        title: 'Zones cardio',
        description: "Zones d'entraînement depuis la FC max et la FC de repos.",
        mono: 'FC',
        type: 'internal',
      },
      {
        id: 'ravitaillement',
        title: 'Ravitaillement',
        description: 'Eau, sel et glucides à emporter selon la durée.',
        mono: 'H₂O',
        type: 'internal',
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
        type: 'internal',
        panel: 'minuteur',
      },
      {
        id: 'mesures',
        title: 'Mesures',
        description: "Tasses et cuillères en grammes, selon l'ingrédient.",
        mono: 'cup',
        type: 'internal',
      },
      {
        id: 'portions',
        title: 'Portions',
        description: 'Recalcule une recette pour 2, 4 ou 10 personnes.',
        mono: '×2',
        type: 'internal',
      },
      {
        id: 'taille-moule',
        title: 'Taille du moule',
        description: "Adapte les quantités d'un moule rond à un carré.",
        mono: 'Ø',
        type: 'internal',
      },
      {
        id: 'pourcentage-boulanger',
        title: 'Pourcentage du boulanger',
        description: "Farine, eau, sel, levain : l'hydratation d'une pâte.",
        mono: '%',
        type: 'internal',
      },
      {
        id: 'recettes',
        title: 'Recettes favorites',
        description: 'Les recettes que je refais souvent, en liens directs.',
        mono: 'Re',
        type: 'internal',
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
        type: 'internal',
      },
      {
        id: 'debit-planches',
        title: 'Débit de planches',
        description: 'Liste de coupes optimisée pour limiter les chutes.',
        mono: 'cut',
        type: 'internal',
      },
      {
        id: 'metrage-tissu',
        title: 'Métrage de tissu',
        description: 'Longueur à acheter selon le patron et la laize.',
        mono: 'm',
        type: 'internal',
      },
      {
        id: 'cyanotype',
        title: 'Cyanotype',
        description: "Dosage des solutions A et B, minuteur d'exposition aux UV.",
        mono: 'UV',
        type: 'internal',
      },
      {
        id: 'nombre-or',
        title: "Nombre d'or",
        description: 'Proportions harmonieuses pour un cadre ou un motif.',
        mono: 'φ',
        type: 'internal',
      },
      {
        id: 'niveau',
        title: 'Niveau à bulle',
        description: "Utilise le capteur d'inclinaison du téléphone.",
        mono: '0°',
        type: 'internal',
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
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'pouces-cm',
      },
      {
        id: 'miles-km',
        title: 'Distances',
        description: 'Miles ↔ kilomètres',
        mono: 'mi',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'miles-km',
      },
      {
        id: 'livres-kg',
        title: 'Poids',
        description: 'Livres ↔ kilogrammes',
        mono: 'lb',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'livres-kg',
      },
      {
        id: 'onces-g',
        title: 'Onces',
        description: 'Onces ↔ grammes',
        mono: 'oz',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'onces-g',
      },
      {
        id: 'fahrenheit-celsius',
        title: 'Températures',
        description: 'Fahrenheit ↔ Celsius',
        mono: '°F',
        type: 'internal',
        panel: 'convertisseur',
        unitPair: 'fahrenheit-celsius',
      },
      {
        id: 'gallons-litres',
        title: 'Volumes',
        description: 'Gallons US ↔ litres',
        mono: 'gal',
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
        type: 'internal',
      },
      {
        id: 'chronometre',
        title: 'Chronomètre',
        description: 'Avec tours et temps intermédiaires.',
        mono: '0:00',
        type: 'internal',
      },
      {
        id: 'regle-de-trois',
        title: 'Règle de trois',
        description: "Trouve la valeur manquante d'une proportion.",
        mono: '÷',
        type: 'internal',
      },
      {
        id: 'mot-de-passe',
        title: 'Mot de passe',
        description: 'Génère des mots de passe solides, localement.',
        mono: '***',
        type: 'internal',
      },
      {
        id: 'tirage-au-sort',
        title: 'Tirage au sort',
        description: 'Dé, pile ou face, un nom au hasard.',
        mono: '?',
        type: 'internal',
      },
      {
        id: 'qr-code',
        title: 'QR code',
        description: 'Transforme un lien ou un texte en QR code.',
        mono: 'QR',
        type: 'internal',
      },
    ],
  },
];

export const WORKS_SECTION_ID = 'realisations';

/** TODO : renseigner les URL publiques, descriptions et technos de chaque réalisation. */
export const WORKS: readonly Work[] = [
  {
    id: 'anne-fait-main',
    title: 'Anne Fait Main',
    description: 'Description à venir.',
    url: '',
    color: '#7CE0B5',
    techs: [],
  },
  {
    id: 'cartography',
    title: 'Cartography',
    description: 'Description à venir.',
    url: '',
    color: '#FFD23F',
    techs: [],
  },
  {
    id: 'marqueterie-de-paille',
    title: 'Marqueterie de paille',
    description: 'Description à venir.',
    url: '',
    color: '#FF6B6B',
    techs: [],
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
