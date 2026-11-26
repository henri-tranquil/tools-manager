/**
 * Phrases du jeu de lecture. Syntaxe : mots séparés par des espaces, lecture des kanji entre
 * crochets (`学生[がくせい]`), particule prononcée autrement que son kana précédée de `_`
 * (`_は` se lit wa, `_へ` e, `_を` o).
 */
export type PhraseLevel = 1 | 2 | 3;

export interface PhraseSource {
  readonly text: string;
  readonly fr: string;
  readonly level: PhraseLevel;
}

export const PHRASES: readonly PhraseSource[] = [
  // Niveau 1 : kana seulement
  { level: 1, text: 'おはよう ございます 。', fr: 'Bonjour (le matin).' },
  { level: 1, text: 'ありがとう ございます 。', fr: 'Merci beaucoup.' },
  { level: 1, text: 'すみません 。', fr: 'Excusez-moi.' },
  { level: 1, text: 'これ _は ペン です 。', fr: "C'est un stylo." },
  { level: 1, text: 'それ _は なん です か 。', fr: "Qu'est-ce que c'est ?" },
  { level: 1, text: 'コーヒー _を ください 。', fr: "Un café, s'il vous plaît." },
  { level: 1, text: 'いただきます 。', fr: 'Bon appétit (avant de manger).' },
  { level: 1, text: 'トイレ _は どこ です か 。', fr: 'Où sont les toilettes ?' },
  { level: 1, text: 'ねこ が います 。', fr: 'Il y a un chat.' },
  { level: 1, text: 'おいしい です ね 。', fr: "C'est bon, hein !" },
  { level: 1, text: 'また あした 。', fr: 'À demain.' },
  { level: 1, text: 'わたし _は パン が すき です 。', fr: "J'aime le pain." },
  // Niveau 2 : premiers kanji
  { level: 2, text: '私[わたし] _は 学生[がくせい] です 。', fr: 'Je suis étudiant.' },
  {
    level: 2,
    text: '今日[きょう] _は いい 天気[てんき] です ね 。',
    fr: "Il fait beau aujourd'hui, n'est-ce pas ?",
  },
  { level: 2, text: '水[みず] _を 飲[の]みます 。', fr: "Je bois de l'eau." },
  { level: 2, text: '駅[えき] _は どこ です か 。', fr: 'Où est la gare ?' },
  {
    level: 2,
    text: '日本語[にほんご] _を 勉強[べんきょう] して います 。',
    fr: "J'étudie le japonais.",
  },
  { level: 2, text: '山[やま] が 好[す]き です 。', fr: "J'aime la montagne." },
  { level: 2, text: '毎朝[まいあさ] 走[はし]ります 。', fr: 'Je cours tous les matins.' },
  {
    level: 2,
    text: '友達[ともだち] と 映画[えいが] _を 見[み]ました 。',
    fr: 'J’ai vu un film avec des amis.',
  },
  {
    level: 2,
    text: '明日[あした] 東京[とうきょう] _へ 行[い]きます 。',
    fr: 'Demain, je vais à Tōkyō.',
  },
  { level: 2, text: 'この 本[ほん] _は 高[たか]い です 。', fr: 'Ce livre est cher.' },
  {
    level: 2,
    text: '猫[ねこ] _は 犬[いぬ] より 小[ちい]さい です 。',
    fr: 'Le chat est plus petit que le chien.',
  },
  { level: 2, text: '魚[さかな] _を 食[た]べます か 。', fr: 'Vous mangez du poisson ?' },
  { level: 2, text: '何時[なんじ] です か 。', fr: 'Quelle heure est-il ?' },
  { level: 2, text: '雨[あめ] が 降[ふ]って います 。', fr: 'Il pleut.' },
  { level: 2, text: '先生[せんせい] _は 優[やさ]しい です 。', fr: 'Le professeur est gentil.' },
  { level: 2, text: 'お茶[おちゃ] _を どうぞ 。', fr: 'Je vous en prie, prenez du thé.' },
  // Niveau 3 : phrases plus longues
  {
    level: 3,
    text: '週末[しゅうまつ] _は 山[やま] で トレイル ランニング _を します 。',
    fr: 'Le week-end, je fais du trail en montagne.',
  },
  { level: 3, text: 'パン _を 焼[や]く の が 好[す]き です 。', fr: "J'aime faire du pain." },
  {
    level: 3,
    text: '木[き] で 小[ちい]さな 箱[はこ] _を 作[つく]りました 。',
    fr: "J'ai fabriqué une petite boîte en bois.",
  },
  {
    level: 3,
    text: '自転車[じてんしゃ] で 会社[かいしゃ] _へ 行[い]きます 。',
    fr: 'Je vais au travail à vélo.',
  },
  {
    level: 3,
    text: '日本[にほん] _へ 行[い]った こと が あります か 。',
    fr: 'Êtes-vous déjà allé au Japon ?',
  },
  {
    level: 3,
    text: 'もう 少[すこ]し ゆっくり 話[はな]して ください 。',
    fr: "Parlez un peu plus lentement, s'il vous plaît.",
  },
  {
    level: 3,
    text: '漢字[かんじ] _は 難[むずか]しい です が 、 面白[おもしろ]い です 。',
    fr: 'Les kanji sont difficiles, mais intéressants.',
  },
  {
    level: 3,
    text: '昨日[きのう] _は 早[はや]く 寝[ね]ました 。',
    fr: 'Hier, je me suis couché tôt.',
  },
  {
    level: 3,
    text: '図書館[としょかん] で 本[ほん] _を 借[か]りたい です 。',
    fr: 'Je voudrais emprunter un livre à la bibliothèque.',
  },
  {
    level: 3,
    text: '晩ご飯[ばんごはん] _は カレー に しましょう 。',
    fr: 'Pour le dîner, faisons un curry.',
  },
  {
    level: 3,
    text: '写真[しゃしん] _を 撮[と]って も いい です か 。',
    fr: 'Puis-je prendre une photo ?',
  },
  {
    level: 3,
    text: '窓[まど] _を 開[あ]けて ください 。',
    fr: "Ouvrez la fenêtre, s'il vous plaît.",
  },
];
