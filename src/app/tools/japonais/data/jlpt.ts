/**
 * Questions de l'examen blanc JLPT N5, écrites à la main sur le modèle des épreuves officielles
 * (aucune question officielle n'est reprise). Dans chaque liste de propositions, la première
 * est la bonne : elles sont mélangées à l'affichage. Kanji du N5 uniquement.
 */

export interface ChoiceItem {
  readonly id: string;
  /** Phrase japonaise ; `（　）` marque la case, `[[…]]` la partie soulignée. */
  readonly ja: string;
  readonly choices: readonly string[];
  readonly explanation: string;
}

/** 文脈規定 : le mot qui convient dans la phrase. */
export const CONTEXT_ITEMS: readonly ChoiceItem[] = [
  {
    id: 'shimete',
    ja: 'さむいですから、まどを （　） ください。',
    choices: ['しめて', 'あけて', 'つけて', 'きて'],
    explanation: 'Il fait froid, donc « fermez (しめて) la fenêtre ». あけて : ouvrez.',
  },
  {
    id: 'takai',
    ja: 'この りんごは 一つ 千円です。とても （　）ですね。',
    choices: ['たかい', 'やすい', 'みじかい', 'ひくい'],
    explanation: 'Mille yens la pomme : c’est très cher (たかい).',
  },
  {
    id: 'nomimashita',
    ja: 'あたまが いたいですから、くすりを （　）。',
    choices: ['のみました', 'ききました', 'ねました', 'あいました'],
    explanation: 'J’ai mal à la tête, donc « j’ai pris (のみました, litt. bu) un médicament ».',
  },
  {
    id: 'karimashita',
    ja: 'としょかんで 本を 三さつ （　）。',
    choices: ['かりました', 'おしえました', 'ならいました', 'ききました'],
    explanation:
      'À la bibliothèque, « j’ai emprunté (かりました) trois livres » (さつ : compteur des livres).',
  },
  {
    id: 'tsukete',
    ja: 'くらいですから、電気を （　） ください。',
    choices: ['つけて', 'けして', 'しめて', 'ぬいで'],
    explanation: 'Il fait sombre, donc « allumez (つけて) la lumière ». けして : éteignez.',
  },
  {
    id: 'tenki',
    ja: 'きのうは 雨でしたが、今日は いい （　）です。',
    choices: ['てんき', 'あめ', 'かさ', 'そら'],
    explanation: 'いい てんき : il fait beau (litt. « bon temps »).',
  },
  {
    id: 'tetsudatte',
    ja: 'にもつが おもいですから、（　） ください。',
    choices: ['てつだって', 'あそんで', 'およいで', 'わすれて'],
    explanation: 'Les bagages sont lourds : « aidez-moi (てつだって) ».',
  },
  {
    id: 'abimasu',
    ja: 'まいあさ シャワーを （　）。',
    choices: ['あびます', 'はいります', 'あらいます', 'のります'],
    explanation: 'On dit シャワーを あびる (prendre une douche) ; おふろに はいる pour le bain.',
  },
  {
    id: 'sai',
    ja: 'この 子どもは 五（　）です。',
    choices: ['さい', 'まい', 'ほん', 'だい'],
    explanation:
      'さい : compteur de l’âge (五さい, cinq ans). まい : objets plats, ほん : objets longs, だい : machines.',
  },
  {
    id: 'machimashita',
    ja: '駅の 前で 友だちを 三十分 （　）。',
    choices: ['まちました', 'ききました', 'かきました', 'よびました'],
    explanation: '« J’ai attendu (まちました) mon ami trente minutes devant la gare. »',
  },

  {
    id: 'akemashou',
    ja: 'へやが あついですから、まどを （　）。',
    choices: ['あけましょう', 'しめましょう', 'けしましょう', 'ぬぎましょう'],
    explanation: 'Il fait chaud dans la pièce : « ouvrons (あけましょう) la fenêtre ».',
  },
  {
    id: 'samui',
    ja: 'ちょっと （　）ですから、セーターを きます。',
    choices: ['さむい', 'あつい', 'あたたかい', 'おいしい'],
    explanation: 'On met un pull parce qu’il fait un peu froid (さむい).',
  },
  {
    id: 'kakimasu',
    ja: 'わたしは 毎日 えんぴつで にっきを （　）。',
    choices: ['かきます', 'よみます', 'ききます', 'みがきます'],
    explanation: 'Avec un crayon (えんぴつで), on écrit (かきます) son journal (にっき).',
  },
  {
    id: 'soku',
    ja: 'デパートで くつを 一（　） かいました。',
    choices: ['そく', 'まい', 'ほん', 'さつ'],
    explanation: 'そく : compteur des paires de chaussures et de chaussettes (一そく, いっそく).',
  },
  {
    id: 'abunai',
    ja: 'この みちは 車が 多くて （　）です。',
    choices: ['あぶない', 'しずか', 'ひま', 'やさしい'],
    explanation: 'Beaucoup de voitures : la rue est dangereuse (あぶない).',
  },
  {
    id: 'kaze',
    ja: '（　）を ひいて、ねつが あります。',
    choices: ['かぜ', 'あめ', 'はな', 'みみ'],
    explanation: 'かぜを ひく : attraper un rhume. ねつ : de la fièvre.',
  },
  {
    id: 'shizukani',
    ja: 'としょかんでは （　） して ください。',
    choices: ['しずかに', 'にぎやかに', 'げんきに', 'じょうずに'],
    explanation: 'À la bibliothèque : « soyez silencieux » (しずかに する).',
  },
  {
    id: 'dashimashita',
    ja: '友だちに てがみを （　）。',
    choices: ['だしました', 'とりました', 'ぬぎました', 'のりました'],
    explanation: 'てがみを だす : envoyer (poster) une lettre.',
  },
];

/** 言い換え類義 : la phrase qui a le même sens. */
export interface ParaphraseItem {
  readonly id: string;
  readonly ja: string;
  readonly choices: readonly string[];
  readonly explanation: string;
}

export const PARAPHRASE_ITEMS: readonly ParaphraseItem[] = [
  {
    id: 'kurai',
    ja: 'この へやは くらいです。',
    choices: [
      'この へやは あかるくないです。',
      'この へやは あかるいです。',
      'この へやは しずかです。',
      'この へやは ひろくないです。',
    ],
    explanation: 'くらい (sombre) = あかるくない (pas clair).',
  },
  {
    id: 'naraimashita',
    ja: 'わたしは 先生に 日本語を ならいました。',
    choices: [
      '先生は わたしに 日本語を おしえました。',
      'わたしは 先生に 日本語を おしえました。',
      '先生は わたしに 日本語を ならいました。',
      '先生と わたしは 日本語を 話しました。',
    ],
    explanation:
      'ならう (apprendre de quelqu’un) est l’inverse de おしえる (enseigner) : le professeur m’a enseigné.',
  },
  {
    id: 'jouzu',
    ja: 'あには りょうりが じょうずです。',
    choices: [
      'あには りょうりが へたじゃ ありません。',
      'あには りょうりが すきじゃ ありません。',
      'あには りょうりが へたです。',
      'あには りょうりを しません。',
    ],
    explanation: 'じょうず (doué) = へたじゃない (pas maladroit).',
  },
  {
    id: 'ototoi',
    ja: 'おととい デパートへ 行きました。',
    choices: [
      '二日 前に デパートへ 行きました。',
      'きのう デパートへ 行きました。',
      'あさって デパートへ 行きます。',
      '三日 前に デパートへ 行きました。',
    ],
    explanation: 'おととい : avant-hier, c’est-à-dire il y a deux jours (二日 前).',
  },
  {
    id: 'suite',
    ja: 'この みせは いつも すいて います。',
    choices: [
      'この みせは いつも 人が すくないです。',
      'この みせは いつも 人が おおいです。',
      'この みせは いつも たかいです。',
      'この みせは いつも やすいです。',
    ],
    explanation: 'すいて いる : il y a peu de monde (人が すくない). L’inverse : こんで いる.',
  },
  {
    id: 'kaigi',
    ja: 'かいぎは 九時に はじまって、十一時に おわりました。',
    choices: [
      'かいぎは 二時間 でした。',
      'かいぎは 三時間 でした。',
      'かいぎは 一時間 でした。',
      'かいぎは 十一時間 でした。',
    ],
    explanation: 'De 9 h à 11 h : la réunion a duré deux heures (二時間).',
  },

  {
    id: 'semai',
    ja: 'この へやは せまいです。',
    choices: [
      'この へやは ひろくないです。',
      'この へやは ひろいです。',
      'この へやは あかるくないです。',
      'この へやは 高くないです。',
    ],
    explanation: 'せまい (étroit, petit) = ひろくない (pas spacieux).',
  },
  {
    id: 'hima',
    ja: '今日は ひまです。',
    choices: [
      '今日は いそがしくないです。',
      '今日は いそがしいです。',
      '今日は 休みじゃ ありません。',
      '今日は げんきです。',
    ],
    explanation: 'ひま (libre, désœuvré) = いそがしくない (pas occupé).',
  },
  {
    id: 'oji',
    ja: 'たなかさんは わたしの 父の あにです。',
    choices: [
      'たなかさんは わたしの おじです。',
      'たなかさんは わたしの あにです。',
      'たなかさんは わたしの 父です。',
      'たなかさんは わたしの おばです。',
    ],
    explanation: 'Le grand frère du père (父の あに) est l’oncle : おじ. おば : la tante.',
  },
];

/** 文法形式の判断 : la forme grammaticale qui convient. */
export const GRAMMAR_ITEMS: readonly ChoiceItem[] = [
  {
    id: 'deshou',
    ja: 'あしたは 雨が ふる （　）。',
    choices: ['でしょう', 'ください', 'ましょう', 'ません'],
    explanation: 'Forme neutre + でしょう : supposition (« il pleuvra sans doute »).',
  },
  {
    id: 'temoii',
    ja: 'この ケーキ、食べて（　） いいですか。',
    choices: ['も', 'は', 'が', 'を'],
    explanation: '〜ても いいですか : demander la permission (« je peux le manger ? »).',
  },
  {
    id: 'atode',
    ja: 'ごはんを 食べた （　）、はを みがきます。',
    choices: ['あとで', 'まえに', 'ながら', 'ましょう'],
    explanation:
      'Forme en た + あとで : « après avoir mangé ». まえに demande la forme du dictionnaire (食べる まえに).',
  },
  {
    id: 'maeni',
    ja: 'ねる （　）、本を 読みます。',
    choices: ['まえに', 'あとで', 'ながら', 'たり'],
    explanation:
      'Forme du dictionnaire + まえに : « avant de dormir ». あとで suivrait la forme en た (ねた あとで).',
  },
  {
    id: 'akete',
    ja: 'まどを （　） ください。',
    choices: ['あけて', 'あける', 'あけた', 'あけ'],
    explanation: 'Forme en て + ください : demande polie (« ouvrez la fenêtre, s’il vous plaît »).',
  },
  {
    id: 'mini',
    ja: 'いっしょに えいがを 見に （　）。',
    choices: ['行きませんか', '見ませんか', '食べませんか', '飲みませんか'],
    explanation:
      'Radical du verbe + に + 行く : aller faire quelque chose (見に 行く : aller voir).',
  },
  {
    id: 'samukunakatta',
    ja: 'きのうは さむく （　）。',
    choices: ['なかったです', 'ないです', 'じゃなかったです', 'でした'],
    explanation:
      'Adjectif en い au passé négatif : さむい → さむくなかったです. きのう impose le passé ; じゃ est réservé aux adjectifs en な et aux noms.',
  },
  {
    id: 'hirokute',
    ja: 'この へやは ひろくて、（　）です。',
    choices: ['あかるい', 'あかるくて', 'あかるかった', 'あかるく'],
    explanation:
      '〜くて relie deux adjectifs ; le dernier garde sa forme normale devant です : ひろくて、あかるいです.',
  },

  {
    id: 'tai',
    ja: 'あしたは 休みですから、どこかへ 行き（　）。',
    choices: ['たいです', 'ないです', 'てです', 'るです'],
    explanation:
      'Radical du verbe + たい : exprimer un souhait (行きたいです, « j’ai envie d’aller »).',
  },
];

/** 読解 : un court texte et une question. */
export interface ReadingItem {
  readonly id: string;
  readonly text: string;
  readonly question: string;
  /** Traduction de la question, pour les débutants. */
  readonly questionFr: string;
  readonly choices: readonly string[];
  readonly explanation: string;
}

export const READING_ITEMS: readonly ReadingItem[] = [
  {
    id: 'memo',
    text: 'もりさんへ\n今日は 先生が 休みですから、日本語の じゅぎょうは ありません。あしたは 九時から じゅぎょうが あります。あしたは きょうかしょを もって きて ください。\nたなか',
    question: 'もりさんは あした 何を もって いきますか。',
    questionFr: 'Qu’est-ce que M. Mori doit apporter demain ?',
    choices: ['きょうかしょ', 'ノート', 'えんぴつ', 'じしょ'],
    explanation:
      'あしたは きょうかしょを もって きて ください : apportez le manuel (きょうかしょ) demain.',
  },
  {
    id: 'trajet',
    text: 'わたしは 毎日 七時に おきます。あさごはんを 食べて、八時に うちを 出ます。学校まで バスで 三十分 かかります。でも、きのうは 雨でしたから、母が 車で 学校まで つれて 行きました。十分で つきました。',
    question: 'きのう、学校まで 何分 かかりましたか。',
    questionFr: 'Combien de temps a pris le trajet hier ?',
    choices: ['十分', '三十分', '八分', '四十分'],
    explanation:
      'En bus il faut 30 minutes, mais hier la mère l’a conduit en voiture : 十分で つきました (arrivé en 10 minutes).',
  },
  {
    id: 'piscine',
    text: 'こうえんの プール\nあいて いる 時間：午前九時から 午後五時まで\n月ようびは 休みです。\nおとな：五百円　子ども：二百円',
    question: 'おとな 一人と 子ども 二人で いくらですか。',
    questionFr: 'Combien paient un adulte et deux enfants ?',
    choices: ['九百円', '七百円', '千二百円', '五百円'],
    explanation: 'Adulte 500 yens + 2 enfants × 200 yens = 900 yens (九百円).',
  },
  {
    id: 'fete',
    text: 'リーさんは 来月 国へ かえります。それで、わたしたちは どようびに パーティーを します。リーさんは さかなが すきですから、すしを つくります。わたしは ケーキを かいます。',
    question: 'どうして すしを つくりますか。',
    questionFr: 'Pourquoi prépare-t-on des sushis ?',
    choices: [
      'リーさんが さかなが すきだから',
      'リーさんが 国へ かえるから',
      'すしが 安いから',
      'わたしが すしが すきだから',
    ],
    explanation:
      'リーさんは さかなが すきですから、すしを つくります : parce que Lee aime le poisson. Son départ explique la fête, pas les sushis.',
  },

  {
    id: 'chambre',
    text: 'わたしの へやには つくえと いすが あります。つくえの 上に 本が 三さつと、とけいが あります。ベッドは ありません。わたしは ふとんで ねます。',
    question: 'わたしの へやに ないものは どれですか。',
    questionFr: 'Qu’est-ce qui n’est pas dans la chambre ?',
    choices: ['ベッド', 'つくえ', 'とけい', '本'],
    explanation: 'ベッドは ありません : il n’y a pas de lit, la personne dort sur un futon.',
  },
  {
    id: 'rendez-vous',
    text: '山川さん\nあしたの 午後 三時に、駅の 前の きっさてんで 会いましょう。わたしは 先に 行って、店の 中で まって います。\nもり',
    question: 'もりさんは あした どこで まって いますか。',
    questionFr: 'Où M. Mori attendra-t-il demain ?',
    choices: ['きっさてんの 中', '駅の 中', '駅の 前の みち', 'もりさんの うち'],
    explanation:
      '店の 中で まって います : il attendra à l’intérieur du café (きっさてん), devant la gare.',
  },
  {
    id: 'courses',
    text: '今日 スーパーで たまごを 十こと、ぎゅうにゅうを 二本 かいました。たまごは 二百円、ぎゅうにゅうは 一本 百五十円でした。',
    question: 'ぜんぶで いくらでしたか。',
    questionFr: 'Combien tout cela a-t-il coûté ?',
    choices: ['五百円', '三百五十円', '四百円', '二百五十円'],
    explanation: 'Œufs 200 yens + 2 bouteilles de lait × 150 yens = 500 yens (五百円).',
  },
  {
    id: 'semaine',
    text: 'わたしは 月ようびと 水ようびに ピアノを ならって います。金ようびは テニスを します。土ようびと 日ようびは 休みます。',
    question: 'テニスは 何ようびですか。',
    questionFr: 'Quel jour est le tennis ?',
    choices: ['金ようび', '月ようび', '水ようび', '土ようび'],
    explanation: '金ようびは テニスを します : le tennis, c’est le vendredi (金ようび).',
  },
  {
    id: 'pluie',
    text: 'あしたは 山へ 行く つもりでした。でも、テレビの 天気よほうで「あしたは 雨です」と 言って いましたから、うちで 本を 読みます。',
    question: 'あした、この 人は 何を しますか。',
    questionFr: 'Que fera cette personne demain ?',
    choices: ['うちで 本を 読みます', '山へ 行きます', '雨の 中を あるきます', 'テレビを 見ます'],
    explanation:
      'Il pleuvra demain, donc au lieu d’aller à la montagne : うちで 本を 読みます (lire à la maison).',
  },
  {
    id: 'bibliotheque',
    text: 'としょかんの おしらせ\nかりる 本は 一人 五さつまで です。二週間 後に かえして ください。',
    question: '今日 本を かりました。いつ かえしますか。',
    questionFr: 'J’ai emprunté un livre aujourd’hui. Quand dois-je le rendre ?',
    choices: ['二週間 後', '五日 後', '一週間 後', '五週間 後'],
    explanation:
      '二週間 後に かえして ください : à rendre dans deux semaines. 五さつ est le nombre maximum de livres.',
  },
  {
    id: 'ken',
    text: 'わたしの 友だちの ケンさんは アメリカ人です。日本語が とても じょうずで、毎日 日本の 新聞を 読みます。でも、かんじを 書くのは まだ むずかしいと 言って います。',
    question: 'ケンさんが むずかしいと 言って いるのは 何ですか。',
    questionFr: 'Qu’est-ce que Ken trouve difficile ?',
    choices: ['かんじを 書くこと', '新聞を 読むこと', '日本語を 話すこと', 'アメリカへ かえること'],
    explanation:
      'かんじを 書くのは まだ むずかしい : écrire les kanji est encore difficile pour lui.',
  },
  {
    id: 'restaurant',
    text: 'この レストランは 午前 十一時から 午後 九時までです。月ようびは 休みです。ランチは 八百円で、コーヒーが つきます。',
    question: 'ランチを 二人分 たのむと、いくらですか。',
    questionFr: 'Combien coûtent deux menus du midi ?',
    choices: ['千六百円', '八百円', '千円', '千八百円'],
    explanation: 'Un menu coûte 800 yens, café compris : 2 × 800 = 1 600 yens (千六百円).',
  },
];

/**
 * Kanji du N5 faciles à confondre (par la forme ou le sens), pour les intrus de l'épreuve d'écriture (表記) : on remplace
 * un kanji du mot par un de ses voisins.
 */
export const CONFUSABLE: readonly (readonly string[])[] = [
  ['右', '左'],
  ['上', '下'],
  ['入', '人', '八'],
  ['日', '白', '目', '月'],
  ['大', '天', '木'],
  ['木', '本', '休'],
  ['千', '十', '午'],
  ['午', '年'],
  ['東', '車'],
  ['小', '少'],
  ['間', '聞'],
  ['語', '話', '読'],
  ['前', '後'],
  ['男', '女'],
  ['先', '生'],
  ['外', '名'],
  ['今', '会'],
  ['電', '雨'],
  ['社', '会'],
  ['山', '出'],
  ['飲', '食'],
  ['高', '安'],
];
