/**
 * Données des exercices de grammaire (niveau N5), écrites à la main : verbes à conjuguer et
 * modèles de phrases à particule manquante. Japonais écrit avec des kanji du N5 uniquement.
 */

/** 1 : godan (groupe 1), 2 : ichidan (groupe 2), 3 : irrégulier. */
export type VerbGroup = 1 | 2 | 3;

export interface Verb {
  /** Forme du dictionnaire, écrite (kanji du N5 seulement). */
  readonly w: string;
  /** Forme du dictionnaire en hiragana. */
  readonly r: string;
  readonly group: VerbGroup;
  readonly fr: string;
}

export const VERBS: readonly Verb[] = [
  { w: '行く', r: 'いく', group: 1, fr: 'aller' },
  { w: '書く', r: 'かく', group: 1, fr: 'écrire' },
  { w: '聞く', r: 'きく', group: 1, fr: 'écouter' },
  { w: 'あるく', r: 'あるく', group: 1, fr: 'marcher' },
  { w: 'およぐ', r: 'およぐ', group: 1, fr: 'nager' },
  { w: '話す', r: 'はなす', group: 1, fr: 'parler' },
  { w: 'まつ', r: 'まつ', group: 1, fr: 'attendre' },
  { w: '立つ', r: 'たつ', group: 1, fr: 'se lever' },
  { w: '読む', r: 'よむ', group: 1, fr: 'lire' },
  { w: '飲む', r: 'のむ', group: 1, fr: 'boire' },
  { w: '休む', r: 'やすむ', group: 1, fr: 'se reposer' },
  { w: 'あそぶ', r: 'あそぶ', group: 1, fr: "s'amuser" },
  { w: '買う', r: 'かう', group: 1, fr: 'acheter' },
  { w: '会う', r: 'あう', group: 1, fr: 'rencontrer' },
  { w: '言う', r: 'いう', group: 1, fr: 'dire' },
  { w: 'つくる', r: 'つくる', group: 1, fr: 'fabriquer, cuisiner' },
  { w: '入る', r: 'はいる', group: 1, fr: 'entrer' },
  { w: 'かえる', r: 'かえる', group: 1, fr: 'rentrer' },
  { w: '分かる', r: 'わかる', group: 1, fr: 'comprendre' },
  { w: 'ある', r: 'ある', group: 1, fr: 'y avoir (objet)' },
  { w: '食べる', r: 'たべる', group: 2, fr: 'manger' },
  { w: '見る', r: 'みる', group: 2, fr: 'regarder' },
  { w: 'おきる', r: 'おきる', group: 2, fr: 'se lever (du lit)' },
  { w: 'ねる', r: 'ねる', group: 2, fr: 'dormir, se coucher' },
  { w: '出る', r: 'でる', group: 2, fr: 'sortir' },
  { w: 'きる', r: 'きる', group: 2, fr: 'porter (un vêtement)' },
  { w: 'いる', r: 'いる', group: 2, fr: 'y avoir (être vivant)' },
  { w: 'おしえる', r: 'おしえる', group: 2, fr: 'enseigner' },
  { w: 'あける', r: 'あける', group: 2, fr: 'ouvrir' },
  { w: 'する', r: 'する', group: 3, fr: 'faire' },
  { w: '来る', r: 'くる', group: 3, fr: 'venir' },
  { w: 'べんきょうする', r: 'べんきょうする', group: 3, fr: 'étudier' },
];

/** Verbes du groupe 1 qui ressemblent à des verbes du groupe 2 (finale -iru / -eru). */
export const FALSE_ICHIDAN: ReadonlySet<string> = new Set(['はいる', 'かえる']);

/** Un mot qui remplit une case d'un modèle de phrase. */
export interface Slot {
  readonly ja: string;
  readonly fr: string;
}

/**
 * Modèle de phrase à particule manquante. `ja` contient `＿` à la place de la particule et
 * des cases `{nom}` ; `fr` est le sens, avec les mêmes cases (valeur `fr` du mot).
 */
export interface ParticleTemplate {
  readonly id: string;
  readonly ja: string;
  readonly fr: string;
  /** Particules acceptées (la première est celle des manuels). */
  readonly answers: readonly string[];
  readonly rule: string;
  /** Erreurs classiques : particule → explication. Elles servent d'intrus dans le QCM. */
  readonly traps?: Readonly<Record<string, string>>;
  /**
   * Particules qui seraient aussi correctes ici et ne doivent jamais servir d'intrus.
   * は et も (qui peuvent remplacer を ou が presque partout) sont toujours exclues.
   */
  readonly exclude?: readonly string[];
}

export const SLOTS: Readonly<Record<string, readonly Slot[]>> = {
  destination: [
    { ja: '学校', fr: "à l'école" },
    { ja: '駅', fr: 'à la gare' },
    { ja: '日本', fr: 'au Japon' },
    { ja: '店', fr: 'au magasin' },
    { ja: 'としょかん', fr: 'à la bibliothèque' },
    { ja: '会社', fr: "à l'entreprise" },
  ],
  lieu: [
    { ja: '学校', fr: "à l'école" },
    { ja: 'こうえん', fr: 'au parc' },
    { ja: '店', fr: 'au magasin' },
    { ja: 'うち', fr: 'à la maison' },
    { ja: '駅', fr: 'à la gare' },
  ],
  nourriture: [
    { ja: 'パン', fr: 'du pain' },
    { ja: '魚', fr: 'du poisson' },
    { ja: 'ごはん', fr: 'du riz' },
    { ja: 'りんご', fr: 'une pomme' },
    { ja: 'すし', fr: 'des sushis' },
  ],
  boisson: [
    { ja: '水', fr: "de l'eau" },
    { ja: 'コーヒー', fr: 'du café' },
    { ja: 'おちゃ', fr: 'du thé' },
  ],
  lecture: [
    { ja: '本', fr: 'un livre' },
    { ja: '新聞', fr: 'le journal' },
    { ja: 'てがみ', fr: 'une lettre' },
  ],
  heure: [
    { ja: '六時', fr: '6 heures' },
    { ja: '七時', fr: '7 heures' },
    { ja: '七時半', fr: '7 h 30' },
    { ja: '八時', fr: '8 heures' },
  ],
  personne: [
    { ja: '友だち', fr: 'un ami' },
    { ja: '母', fr: 'ma mère' },
    { ja: '先生', fr: 'le professeur' },
    { ja: '父', fr: 'mon père' },
  ],
  proprio: [
    { ja: '先生', fr: 'du professeur' },
    { ja: '父', fr: 'de mon père' },
    { ja: '母', fr: 'de ma mère' },
    { ja: '友だち', fr: 'de mon ami' },
  ],
  moyen: [
    { ja: '車', fr: 'en voiture' },
    { ja: '電車', fr: 'en train' },
    { ja: 'バス', fr: 'en bus' },
    { ja: 'じてんしゃ', fr: 'à vélo' },
  ],
  objet: [
    { ja: '本', fr: 'un livre' },
    { ja: 'ペン', fr: 'un stylo' },
    { ja: 'かばん', fr: 'un sac' },
    { ja: 'ねこ', fr: 'un chat' },
  ],
  place: [
    { ja: 'つくえの上', fr: 'sur le bureau' },
    { ja: 'いすの下', fr: 'sous la chaise' },
    { ja: 'へやの中', fr: 'dans la chambre' },
  ],
};

export const PARTICLE_TEMPLATES: readonly ParticleTemplate[] = [
  {
    id: 'destination',
    ja: 'あした {destination}＿ 行きます。',
    fr: 'Demain, je vais {destination}.',
    answers: ['へ', 'に'],
    rule: "へ (ou に) marque la destination d'un déplacement : 行く, 来る, かえる.",
    traps: {
      で: "で marque le lieu d'une action, pas la destination : pour aller quelque part, へ ou に.",
    },
    exclude: ['が', 'まで', 'から'],
  },
  {
    id: 'objet-manger',
    ja: '{nourriture}＿ 食べます。',
    fr: 'Je mange {nourriture}.',
    answers: ['を'],
    rule: "を marque le complément d'objet direct : ce qu'on mange, boit, lit, regarde.",
    exclude: ['と', 'が'],
  },
  {
    id: 'objet-boire',
    ja: 'まいあさ {boisson}＿ 飲みます。',
    fr: 'Tous les matins, je bois {boisson}.',
    answers: ['を'],
    rule: "を marque le complément d'objet direct : ce qu'on mange, boit, lit, regarde.",
    exclude: ['と', 'が'],
  },
  {
    id: 'objet-lire',
    ja: '電車で {lecture}＿ 読みます。',
    fr: 'Je lis {lecture} dans le train.',
    answers: ['を'],
    rule: "を marque le complément d'objet direct : ce qu'on mange, boit, lit, regarde.",
    exclude: ['と', 'が'],
  },
  {
    id: 'lieu-action',
    ja: '{lieu}＿ {nourriture}を 食べます。',
    fr: 'Je mange {nourriture} {lieu}.',
    answers: ['で'],
    rule: "で marque le lieu où se déroule une action (manger, étudier, travailler…), pas le lieu où l'on va.",
    traps: {
      に: "に indique où l'on va ou où l'on se trouve ; le lieu où l'on fait une action prend で.",
    },
    exclude: ['の', 'から', 'まで'],
  },
  {
    id: 'lieu-etude',
    ja: '{lieu}＿ 日本語を べんきょうします。',
    fr: "J'étudie le japonais {lieu}.",
    answers: ['で'],
    rule: "で marque le lieu où se déroule une action (manger, étudier, travailler…), pas le lieu où l'on va.",
    traps: {
      に: "に indique où l'on va ou où l'on se trouve ; le lieu où l'on fait une action prend で.",
    },
    exclude: ['の', 'から', 'まで'],
  },
  {
    id: 'heure',
    ja: '毎日 {heure}＿ おきます。',
    fr: 'Je me lève tous les jours à {heure}.',
    answers: ['に'],
    rule: 'に marque un moment précis (heure, date). Pas de に après 今日, 毎日 ou あした.',
    exclude: ['から', 'まで', 'が'],
  },
  {
    id: 'avec',
    ja: '{personne}＿ {destination}へ 行きます。',
    fr: 'Je vais {destination} avec {personne}.',
    answers: ['と'],
    rule: "と veut dire « avec » quelqu'un (et « et » entre deux noms).",
    exclude: ['が', 'の'],
  },
  {
    id: 'moyen',
    ja: '{moyen}＿ 学校へ 行きます。',
    fr: "Je vais à l'école {moyen}.",
    answers: ['で'],
    rule: 'で marque le moyen : en voiture, en train, avec des baguettes, en japonais.',
    exclude: ['が', 'から'],
  },
  {
    id: 'existence-lieu',
    ja: '{place}＿ {objet}が あります。',
    fr: 'Il y a {objet} {place}.',
    answers: ['に'],
    rule: 'に marque le lieu où quelque chose se trouve, avec あります (objets) et います (êtres vivants).',
    traps: { で: 'Avec あります / います, le lieu où se trouve la chose prend に, pas で.' },
    exclude: ['の', 'から'],
  },
  {
    id: 'existence-sujet',
    ja: '{place}に {objet}＿ あります。',
    fr: 'Il y a {objet} {place}.',
    answers: ['が'],
    rule: 'が marque ce qui existe ou se trouve quelque part, avec あります et います.',
    traps: { を: "あります n'a pas de complément d'objet : ce qui existe prend が." },
  },
  {
    id: 'aimer',
    ja: 'わたしは {nourriture}＿ すきです。',
    fr: "J'aime {nourriture}.",
    answers: ['が'],
    rule: "Avec すき (aimer), きらい, じょうず et 分かる, ce qu'on aime prend が, pas を.",
    traps: { を: "Avec すき, ce qu'on aime prend が, pas を : erreur très fréquente." },
  },
  {
    id: 'possession',
    ja: 'これは {proprio}＿ 本です。',
    fr: "C'est le livre {proprio}.",
    answers: ['の'],
    rule: 'の relie deux noms : possession ou appartenance (le livre du professeur).',
    exclude: ['と', 'が'],
  },
  {
    id: 'question',
    ja: 'あれは {objet}です＿。',
    fr: "Est-ce que c'est {objet} ?",
    answers: ['か'],
    rule: "か en fin de phrase en fait une question (pas besoin de point d'interrogation).",
    exclude: ['が', 'から', 'の', 'と'],
  },
  {
    id: 'depuis',
    ja: '九時＿ 五時まで はたらきます。',
    fr: 'Je travaille de 9 heures à 17 heures.',
    answers: ['から'],
    rule: "から : à partir de (heure, lieu) ; まで : jusqu'à.",
    exclude: ['に', 'と'],
  },
  {
    id: 'jusqua',
    ja: '九時から 五時＿ はたらきます。',
    fr: 'Je travaille de 9 heures à 17 heures.',
    answers: ['まで'],
    rule: "から : à partir de (heure, lieu) ; まで : jusqu'à.",
    exclude: ['に', 'と'],
  },
  {
    id: 'aussi',
    ja: 'わたしは 学生です。{personne}＿ 学生です。',
    fr: 'Je suis étudiant, et {personne} aussi.',
    answers: ['も'],
    rule: 'も remplace は ou が pour dire « aussi ».',
    exclude: ['が'],
  },
  {
    id: 'langue',
    ja: '日本語＿ 話して ください。',
    fr: 'Parlez en japonais, s’il vous plaît.',
    answers: ['で'],
    rule: 'で marque le moyen, y compris la langue utilisée : 日本語で 話す, parler en japonais.',
    exclude: ['を', 'が'],
  },
  {
    id: 'rencontre',
    ja: '駅で {personne}＿ 会います。',
    fr: 'Je retrouve {personne} à la gare.',
    answers: ['に', 'と'],
    rule: '会う se construit avec に (ou と) : on rencontre quelqu’un, jamais を.',
    traps: { を: '会う ne prend pas を : on dit 友だちに 会う (ou 友だちと 会う).' },
    exclude: ['が'],
  },
];

/** Particules proposées dans les QCM. */
export const PARTICLES = [
  'は',
  'が',
  'を',
  'に',
  'へ',
  'で',
  'と',
  'の',
  'も',
  'か',
  'から',
  'まで',
];
