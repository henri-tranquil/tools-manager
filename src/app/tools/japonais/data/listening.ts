/**
 * Exercices d'écoute (niveau N5), écrits à la main sur le modèle du JLPT : mini-dialogues avec
 * une question, et répliques auxquelles il faut choisir la bonne réponse (即時応答).
 * Japonais écrit avec des kanji du N5 seulement (le reste en kana).
 */

/** 0 : homme (男), 1 : femme (女) : deux voix différentes à l'écoute. */
export type Speaker = 0 | 1;

export interface DialogueLine {
  readonly s: Speaker;
  readonly ja: string;
}

export interface Dialogue {
  readonly id: string;
  /** Situation lue avant le dialogue (en français, comme la consigne). */
  readonly situation: string;
  readonly question: string;
  readonly lines: readonly DialogueLine[];
  /** Propositions ; la première est la bonne (elles sont mélangées à l'affichage). */
  readonly choices: readonly string[];
  readonly explanation: string;
}

export const DIALOGUES: readonly Dialogue[] = [
  {
    id: 'pommes',
    situation: 'Dans un magasin, une femme achète des pommes.',
    question: 'Combien la femme paie-t-elle ?',
    lines: [
      { s: 1, ja: 'すみません、りんごは いくらですか。' },
      { s: 0, ja: '一つ 百円です。' },
      { s: 1, ja: 'じゃあ、五つ ください。' },
      { s: 0, ja: 'はい、ありがとうございます。' },
    ],
    choices: ['500 yens', '100 yens', '150 yens', '1 000 yens'],
    explanation: '一つ 百円 : 100 yens la pomme ; 五つ : cinq pommes. 5 × 100 = 500 yens (五百円).',
  },
  {
    id: 'rendez-vous',
    situation: 'Un homme et une femme fixent un rendez-vous.',
    question: 'À quelle heure se retrouvent-ils demain ?',
    lines: [
      { s: 0, ja: 'あした、何時に 会いましょうか。' },
      { s: 1, ja: '十時は どうですか。' },
      { s: 0, ja: '十時は ちょっと…。十一時は どうですか。' },
      { s: 1, ja: 'いいですよ。じゃあ、十一時に 駅で。' },
    ],
    choices: ['À 11 heures', 'À 10 heures', 'À 10 h 30', 'À 1 heure'],
    explanation:
      '« 十時は ちょっと… » est un refus poli : 10 h ne va pas. Il propose 十一時 (11 h) et elle accepte (いいですよ).',
  },
  {
    id: 'montagne',
    situation: 'Deux amis parlent du week-end.',
    question: "Où l'homme est-il allé hier ?",
    lines: [
      { s: 1, ja: 'きのう、どこへ 行きましたか。' },
      { s: 0, ja: '友だちと 山へ 行きました。' },
      { s: 1, ja: 'いいですね。川へも 行きましたか。' },
      { s: 0, ja: 'いいえ、川へは 行きませんでした。雨が ふりましたから。' },
    ],
    choices: ['À la montagne', 'À la rivière', 'À la mer', 'Au magasin'],
    explanation:
      '山へ 行きました : il est allé à la montagne. 川へは 行きませんでした : il n’est pas allé à la rivière, à cause de la pluie.',
  },
  {
    id: 'bureau',
    situation: 'Au bureau, une femme demande quelque chose à M. Mori.',
    question: 'Que va faire M. Mori ?',
    lines: [
      { s: 1, ja: 'もりさん、すみませんが、まどを あけて ください。' },
      { s: 0, ja: 'はい。電気も つけましょうか。' },
      { s: 1, ja: '電気は いいです。それから、コーヒーを おねがいします。' },
    ],
    choices: [
      'Ouvrir la fenêtre, puis faire du café',
      'Allumer la lumière, puis faire du café',
      'Ouvrir la fenêtre et allumer la lumière',
      'Fermer la fenêtre',
    ],
    explanation:
      'まどを あけて : ouvrir la fenêtre. 電気は いいです : « pas la peine pour la lumière » (いいです refuse ici). Puis コーヒーを おねがいします.',
  },
  {
    id: 'transport',
    situation: "Deux étudiants parlent devant l'école.",
    question: "Comment la femme est-elle venue aujourd'hui ?",
    lines: [
      { s: 0, ja: '学校まで 何で 来ますか。' },
      { s: 1, ja: 'いつもは バスで 来ます。' },
      { s: 1, ja: 'でも、今日は 雨でしたから、母の 車で 来ました。' },
    ],
    choices: ['En voiture', 'En bus', 'À pied', 'En train'],
    explanation:
      'いつもは バスで : d’habitude en bus. Mais 今日は… 母の 車で 来ました : aujourd’hui, avec la voiture de sa mère. Piège : la première info n’est pas la réponse.',
  },
  {
    id: 'fete',
    situation: 'Un homme et une femme parlent d’une fête.',
    question: 'Quel jour a lieu la fête ?',
    lines: [
      { s: 0, ja: 'パーティーは どようびですか。' },
      { s: 1, ja: 'いいえ、にちようびです。' },
      { s: 1, ja: 'どようびは みんな しごとが ありますから。' },
    ],
    choices: ['Dimanche', 'Samedi', 'Vendredi', 'Lundi'],
    explanation:
      'いいえ、にちようびです : non, c’est dimanche (どようび = samedi, にちようび = dimanche).',
  },
  {
    id: 'livre',
    situation: 'Dans une librairie, un homme choisit un livre.',
    question: "Combien coûte le livre que l'homme achète ?",
    lines: [
      { s: 0, ja: 'すみません、この 本は いくらですか。' },
      { s: 1, ja: '千二百円です。' },
      { s: 0, ja: 'じゃあ、この 小さい 本は？' },
      { s: 1, ja: 'そちらは 八百円です。' },
      { s: 0, ja: 'じゃあ、小さい 本を ください。' },
    ],
    choices: ['800 yens', '1 200 yens', '2 000 yens', '600 yens'],
    explanation:
      'Le grand livre coûte 千二百円 (1 200 yens), le petit 八百円 (800 yens, はっぴゃく). Il prend le petit : 小さい 本を ください.',
  },
  {
    id: 'boisson',
    situation: 'Une femme reçoit un ami chez elle.',
    question: "Que va boire l'homme ?",
    lines: [
      { s: 1, ja: '何を 飲みますか。コーヒーですか、おちゃですか。' },
      { s: 0, ja: 'コーヒーは あまり すきじゃ ありません。' },
      { s: 0, ja: 'おちゃを ください。' },
    ],
    choices: ['Du thé', 'Du café', "De l'eau", 'Du jus de fruits'],
    explanation:
      'あまり すきじゃ ありません : « je n’aime pas trop » (le café). Il demande du thé : おちゃを ください.',
  },
  {
    id: 'sac',
    situation: 'Un garçon cherche son sac.',
    question: 'Où était le sac ?',
    lines: [
      { s: 0, ja: 'ぼくの かばんは どこですか。' },
      { s: 1, ja: 'つくえの 上に ありませんか。' },
      { s: 0, ja: 'ありません。' },
      { s: 1, ja: 'じゃあ、いすの 下を 見て ください。' },
      { s: 0, ja: 'あ、ありました。' },
    ],
    choices: ['Sous la chaise', 'Sur le bureau', 'Dans la chambre', 'Devant la porte'],
    explanation:
      'つくえの 上 (sur le bureau) : non, ありません. いすの 下 (sous la chaise) : あ、ありました, il l’a trouvé.',
  },
  {
    id: 'invites',
    situation: "Deux personnes parlent d'une fête qui a eu lieu hier.",
    question: 'Combien de personnes sont venues en tout ?',
    lines: [
      { s: 0, ja: 'きのうの パーティーに 何人 来ましたか。' },
      { s: 1, ja: '学生が 八人と、先生が 二人 来ました。' },
    ],
    choices: ['10 personnes', '8 personnes', '2 personnes', '6 personnes'],
    explanation:
      '学生が 八人 (8 étudiants) と 先生が 二人 (2 professeurs, ふたり) : 10 personnes en tout.',
  },
  {
    id: 'etude',
    situation: 'Un homme pose une question à une étudiante.',
    question: "Combien d'heures par jour étudie-t-elle le japonais ?",
    lines: [
      { s: 0, ja: '毎日 何時間 日本語を べんきょうしますか。' },
      { s: 1, ja: '学校で 二時間、うちで 一時間 べんきょうします。' },
    ],
    choices: ['3 heures', '2 heures', '1 heure', '4 heures'],
    explanation:
      '学校で 二時間 (2 h à l’école) + うちで 一時間 (1 h à la maison) = 3 heures. 時間 (じかん) indique une durée, 時 (じ) une heure de la journée.',
  },
  {
    id: 'gare',
    situation: 'Une femme demande son chemin dans la rue.',
    question: 'Comment va-t-on à la gare ?',
    lines: [
      { s: 1, ja: 'すみません、駅は どこですか。' },
      { s: 0, ja: 'この 道を まっすぐ 行って、二つめの かどを 右です。' },
      { s: 1, ja: '二つめの かどを 右ですね。ありがとうございます。' },
    ],
    choices: [
      'Tout droit, puis à droite au 2e carrefour',
      'Tout droit, puis à droite au 1er carrefour',
      'Tout droit, puis à gauche au 2e carrefour',
      'À gauche, puis tout droit',
    ],
    explanation:
      'まっすぐ 行って : aller tout droit. 二つめの かど : le deuxième coin de rue. 右 : à droite. La femme répète l’indication pour confirmer.',
  },

  {
    id: 'week-end',
    situation: 'Deux collègues parlent de leur week-end.',
    question: "Qu'a fait l'homme dimanche ?",
    lines: [
      { s: 1, ja: 'しゅうまつは 何を しましたか。' },
      { s: 0, ja: '土ようびは テニスを しました。日ようびは うちで テレビを 見ました。' },
      { s: 1, ja: 'そうですか。わたしは 日ようびに テニスを しましたよ。' },
    ],
    choices: [
      'Il a regardé la télévision',
      'Il a joué au tennis',
      'Il a lu un livre',
      'Il est sorti',
    ],
    explanation:
      '日ようびは うちで テレビを 見ました : dimanche, télé à la maison. Le tennis, c’était samedi pour lui (et dimanche pour elle).',
  },
  {
    id: 'telephone',
    situation: 'Un homme demande un numéro de téléphone.',
    question: 'Quel est le numéro de la femme ?',
    lines: [
      { s: 0, ja: 'でんわばんごうを おしえて ください。' },
      { s: 1, ja: 'ゼロさんの、よん ご ろく なな の、はち きゅう ゼロ いち です。' },
      { s: 0, ja: 'ゼロさんの、よん ご ろく なな の、はち きゅう ゼロ いちですね。' },
    ],
    choices: ['03-4567-8901', '03-4567-8910', '03-5467-8901', '08-4567-8901'],
    explanation:
      'Les chiffres se lisent un par un : ゼロ さん、よん ご ろく なな、はち きゅう ゼロ いち.',
  },
  {
    id: 'billets',
    situation: 'Une femme achète des billets de train au guichet.',
    question: 'Combien la femme paie-t-elle en tout ?',
    lines: [
      { s: 1, ja: 'すみません、大人 二まい ください。' },
      { s: 0, ja: '一まい 三千円ですから、六千円です。' },
      { s: 1, ja: 'あ、子どもも 一まい おねがいします。' },
      { s: 0, ja: '子どもは 千五百円です。' },
    ],
    choices: ['7 500 yens', '6 000 yens', '3 000 yens', '4 500 yens'],
    explanation:
      'Deux adultes (大人, おとな) à 3 000 yens = 6 000, plus un enfant à 1 500 : 7 500 yens.',
  },
  {
    id: 'pique-nique',
    situation: 'Deux amis préparent un pique-nique.',
    question: "Qu'est-ce que l'homme va apporter ?",
    lines: [
      { s: 0, ja: 'あしたの ピクニック、何を もって 行きますか。' },
      { s: 1, ja: 'おべんとうと 水を もって 行きます。かさは いりませんよ。天気が いいですから。' },
      { s: 0, ja: 'じゃあ、ぼくは カメラを もって 行きます。' },
    ],
    choices: ['Un appareil photo', 'Un parapluie', 'Un bento', "De l'eau"],
    explanation:
      'Elle apporte le bento et l’eau ; pas besoin de parapluie (かさは いりません). Lui : カメラ, un appareil photo.',
  },
  {
    id: 'mori',
    situation: 'Un homme cherche M. Mori parmi des gens.',
    question: 'Comment est M. Mori ?',
    lines: [
      { s: 0, ja: 'あの 人が もりさんですか。' },
      { s: 1, ja: 'いいえ、もりさんは めがねを かけて いる 人です。' },
      { s: 0, ja: 'ああ、あの 白い シャツの 人ですね。' },
      { s: 1, ja: 'はい、そうです。' },
    ],
    choices: [
      'Lunettes et chemise blanche',
      'Chemise blanche, sans lunettes',
      'Lunettes et chemise noire',
      'Un chapeau',
    ],
    explanation:
      'めがねを かけて いる : il porte des lunettes. 白い シャツ : chemise blanche, et elle confirme (そうです).',
  },
  {
    id: 'cinema',
    situation: 'Un couple va au cinéma ce soir.',
    question: 'À quelle heure partent-ils de chez eux ?',
    lines: [
      { s: 1, ja: 'えいがは 何時からですか。' },
      { s: 0, ja: '七時からです。' },
      { s: 1, ja: 'じゃあ、六時半に うちを 出ましょう。' },
      { s: 0, ja: 'いいえ、駅まで 四十分 かかりますから、六時に 出ましょう。' },
      { s: 1, ja: 'わかりました。' },
    ],
    choices: ['À 18 h', 'À 18 h 30', 'À 19 h', 'À 18 h 40'],
    explanation:
      'Elle propose 6 h 30, mais il faut 40 minutes jusqu’à la gare : ils partent à 六時 (6 h, soit 18 h) et elle accepte (わかりました).',
  },
  {
    id: 'manteau',
    situation: 'Un homme va sortir.',
    question: "Qu'est-ce que l'homme met pour sortir ?",
    lines: [
      { s: 0, ja: 'そとは さむいですか。' },
      { s: 1, ja: 'ええ、とても さむいですよ。コートを きて 行って ください。' },
      { s: 0, ja: 'ぼうしも いりますか。' },
      { s: 1, ja: 'ぼうしは いいです。かぜが ありませんから。' },
    ],
    choices: [
      'Seulement un manteau',
      'Un manteau et un chapeau',
      'Seulement un chapeau',
      'Rien de plus',
    ],
    explanation:
      'コートを きて : mettez un manteau. ぼうしは いいです : pas la peine pour le chapeau, il n’y a pas de vent.',
  },
  {
    id: 'dejeuner',
    situation: 'Deux collègues commandent leur déjeuner.',
    question: "Qu'est-ce que l'homme commande ?",
    lines: [
      { s: 0, ja: 'ひるごはん、何に しますか。' },
      { s: 1, ja: 'わたしは カレーに します。' },
      { s: 0, ja: 'ぼくは ラーメンに します。それから、ジュースを 二つ ください。' },
    ],
    choices: [
      'Des ramen et deux jus',
      'Du curry et deux jus',
      'Des ramen et un jus',
      'Du curry et des ramen',
    ],
    explanation:
      '〜に します : choisir. Lui : ラーメン, et ジュースを 二つ (deux jus). Le curry est pour la femme.',
  },
  {
    id: 'lieu-rdv',
    situation: 'Deux amis fixent un lieu de rendez-vous.',
    question: 'Où se retrouvent-ils ?',
    lines: [
      { s: 1, ja: 'あしたは どこで 会いましょうか。駅の 中ですか。' },
      { s: 0, ja: '駅の 中は 人が 多いですから、駅の 前の ほんやは どうですか。' },
      { s: 1, ja: 'いいですね。じゃあ、ほんやの 前で。' },
    ],
    choices: [
      'Devant la librairie, face à la gare',
      'Dans la gare',
      'Dans la librairie',
      'Chez la femme',
    ],
    explanation:
      'Trop de monde dans la gare : ils choisissent ほんやの 前, devant la librairie qui est devant la gare.',
  },
];

export interface Reply {
  readonly id: string;
  readonly prompt: string;
  /** Réponses possibles ; la première est la bonne. */
  readonly choices: readonly string[];
  readonly explanation: string;
}

export const REPLIES: readonly Reply[] = [
  {
    id: 'genki',
    prompt: 'おげんきですか。',
    choices: ['はい、げんきです。', 'はい、おねがいします。', 'いいえ、どういたしまして。'],
    explanation: '« Vous allez bien ? » → « Oui, je vais bien. »',
  },
  {
    id: 'merci',
    prompt: 'ありがとうございました。',
    choices: ['どういたしまして。', 'いただきます。', 'はじめまして。'],
    explanation: '« Merci beaucoup. » → « Je vous en prie. »',
  },
  {
    id: 'douzo',
    prompt: 'これ、どうぞ。',
    choices: ['ありがとうございます。', 'ごちそうさまでした。', 'おやすみなさい。'],
    explanation: '« Tenez, c’est pour vous. » → « Merci. »',
  },
  {
    id: 'nom',
    prompt: 'お名前は？',
    choices: ['もりです。', '二十さいです。', 'フランスからです。'],
    explanation:
      '« Votre nom ? » → « Je m’appelle Mori. » (二十さい : l’âge ; フランスから : l’origine)',
  },
  {
    id: 'origine',
    prompt: 'どこから 来ましたか。',
    choices: ['フランスから 来ました。', '電車で 来ました。', 'きのう 来ました。'],
    explanation:
      '« D’où venez-vous ? » (どこから) → « De France. » Les autres répondent à « comment » et « quand ».',
  },
  {
    id: 'lever',
    prompt: '何時に おきますか。',
    choices: ['六時に おきます。', '六時間 ねます。', '毎日 おきます。'],
    explanation: '« À quelle heure vous levez-vous ? » → « À 6 heures. » 六時間 est une durée.',
  },
  {
    id: 'invitation',
    prompt: 'いっしょに 行きませんか。',
    choices: ['ええ、行きましょう。', 'いいえ、行きませんでした。', 'はい、行きました。'],
    explanation:
      '〜ませんか est une invitation : « Vous venez avec moi ? » → « Oui, allons-y. » Ce n’est pas une question au passé.',
  },
  {
    id: 'encore',
    prompt: 'コーヒー、もう 一ぱい いかがですか。',
    choices: ['いいえ、けっこうです。', 'いいえ、まだです。', 'はい、どういたしまして。'],
    explanation:
      '« Encore une tasse de café ? » → « Non merci, ça ira. » (けっこうです : refus poli)',
  },
  {
    id: 'depart',
    prompt: 'いってきます。',
    choices: ['いってらっしゃい。', 'おかえりなさい。', 'ただいま。'],
    explanation:
      'En partant : いってきます (« j’y vais ») → いってらっしゃい (« à tout à l’heure »).',
  },
  {
    id: 'retour',
    prompt: 'ただいま。',
    choices: ['おかえりなさい。', 'いってらっしゃい。', 'いただきます。'],
    explanation: 'En rentrant : ただいま (« je suis rentré ») → おかえりなさい (« bon retour »).',
  },
  {
    id: 'stylo',
    prompt: 'この ペン、かりても いいですか。',
    choices: ['ええ、どうぞ。', 'はい、かりました。', 'いいえ、ペンです。'],
    explanation:
      '« Je peux emprunter ce stylo ? » (〜ても いいですか : demande de permission) → « Oui, je vous en prie. »',
  },
  {
    id: 'devoirs',
    prompt: 'しゅくだいは もう おわりましたか。',
    choices: ['いいえ、まだです。', 'はい、まだです。', 'いいえ、もうです。'],
    explanation:
      '« Tu as déjà fini tes devoirs ? » (もう : déjà) → « Non, pas encore. » (まだ : pas encore)',
  },
  {
    id: 'faim',
    prompt: 'おなかが すきましたね。',
    choices: ['そうですね。何か 食べましょう。', 'はい、おなかです。', 'いいえ、すきです。'],
    explanation: '« On a faim, hein ? » → « Oui, mangeons quelque chose. »',
  },

  {
    id: 'hajimemashite',
    prompt: 'はじめまして。',
    choices: ['はじめまして。どうぞ よろしく。', 'おかえりなさい。', 'いってきます。'],
    explanation: '« Enchanté. » → « Enchanté, ravi de vous connaître. »',
  },
  {
    id: 'heure',
    prompt: 'すみません、今 何時ですか。',
    choices: ['三時十分です。', '三時間です。', '三日です。'],
    explanation:
      '« Quelle heure est-il ? » (何時) → « Trois heures dix. » 三時間 est une durée, 三日 une date.',
  },
];
