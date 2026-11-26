import { Type } from '@angular/core';

/**
 * Un chargeur par outil interne. Chaque `import()` produit un chunk séparé :
 * le code d'un outil n'est téléchargé que lorsqu'on le déplie.
 *
 * Pour ajouter un outil : une entrée ici, puis `panel: '<clé>'` dans le registre.
 */
export const PANEL_LOADERS = {
  // Web & dev
  lighthouse: () => import('./dev/lighthouse/lighthouse').then((m) => m.Lighthouse),
  'budget-poids': () => import('./dev/budget-poids/budget-poids').then((m) => m.BudgetPoids),
  'px-rem': () => import('./dev/px-rem/px-rem').then((m) => m.PxRem),
  contraste: () => import('./dev/contraste/contraste').then((m) => m.Contraste),
  couleurs: () => import('./dev/couleurs/couleurs').then((m) => m.Couleurs),
  cron: () => import('./dev/cron/cron').then((m) => m.Cron),
  // Sport
  'km-effort': () => import('./sport/km-effort/km-effort').then((m) => m.KmEffort),
  allure: () => import('./sport/allure/allure').then((m) => m.Allure),
  'temps-rando': () => import('./sport/temps-rando/temps-rando').then((m) => m.TempsRando),
  'developpement-velo': () =>
    import('./sport/developpement-velo/developpement-velo').then((m) => m.DeveloppementVelo),
  'zones-cardio': () => import('./sport/zones-cardio/zones-cardio').then((m) => m.ZonesCardio),
  ravitaillement: () =>
    import('./sport/ravitaillement/ravitaillement').then((m) => m.Ravitaillement),
  // Cuisine
  minuteur: () => import('./cuisine/minuteur/minuteur').then((m) => m.Minuteur),
  mesures: () => import('./cuisine/mesures/mesures').then((m) => m.Mesures),
  portions: () => import('./cuisine/portions/portions').then((m) => m.Portions),
  'taille-moule': () => import('./cuisine/taille-moule/taille-moule').then((m) => m.TailleMoule),
  'pourcentage-boulanger': () =>
    import('./cuisine/pourcentage-boulanger/pourcentage-boulanger').then(
      (m) => m.PourcentageBoulanger,
    ),
  recettes: () => import('./cuisine/recettes/recettes').then((m) => m.Recettes),
  // Atelier
  'angle-onglet': () => import('./atelier/angle-onglet/angle-onglet').then((m) => m.AngleOnglet),
  'debit-planches': () =>
    import('./atelier/debit-planches/debit-planches').then((m) => m.DebitPlanches),
  'metrage-tissu': () =>
    import('./atelier/metrage-tissu/metrage-tissu').then((m) => m.MetrageTissu),
  cyanotype: () => import('./atelier/cyanotype/cyanotype').then((m) => m.Cyanotype),
  'nombre-or': () => import('./atelier/nombre-or/nombre-or').then((m) => m.NombreOr),
  niveau: () => import('./atelier/niveau/niveau').then((m) => m.Niveau),
  // Conversion
  convertisseur: () =>
    import('./conversion/convertisseur/convertisseur').then((m) => m.Convertisseur),
  // Quotidien
  pomodoro: () => import('./quotidien/pomodoro/pomodoro').then((m) => m.Pomodoro),
  chronometre: () => import('./quotidien/chronometre/chronometre').then((m) => m.Chronometre),
  'regle-de-trois': () =>
    import('./quotidien/regle-de-trois/regle-de-trois').then((m) => m.RegleDeTrois),
  'mot-de-passe': () => import('./quotidien/mot-de-passe/mot-de-passe').then((m) => m.MotDePasse),
  'tirage-au-sort': () =>
    import('./quotidien/tirage-au-sort/tirage-au-sort').then((m) => m.TirageAuSort),
  'qr-code': () => import('./quotidien/qr-code/qr-code').then((m) => m.QrCode),
  // Japonais
  'quiz-kana': () => import('./japonais/quiz-kana/quiz-kana').then((m) => m.QuizKana),
  lecture: () => import('./japonais/lecture/lecture').then((m) => m.Lecture),
  'jeu-traduction': () =>
    import('./japonais/jeu-traduction/jeu-traduction').then((m) => m.JeuTraduction),
  'quiz-kanji': () => import('./japonais/quiz-kanji/quiz-kanji').then((m) => m.QuizKanji),
  exercices: () => import('./japonais/exercices/exercices').then((m) => m.Exercices),
  ecoute: () => import('./japonais/ecoute/ecoute').then((m) => m.Ecoute),
  oral: () => import('./japonais/oral/oral').then((m) => m.Oral),
  jlpt: () => import('./japonais/jlpt/jlpt').then((m) => m.Jlpt),
  dessin: () => import('./japonais/dessin/dessin').then((m) => m.Dessin),
  'romaji-kana': () => import('./japonais/romaji-kana/romaji-kana').then((m) => m.RomajiKana),
  traduction: () => import('./japonais/traduction/traduction').then((m) => m.Traduction),
} satisfies Record<string, () => Promise<Type<unknown>>>;

export type ToolPanel = keyof typeof PANEL_LOADERS;
