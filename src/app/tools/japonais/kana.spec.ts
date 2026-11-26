import {
  kanaEntries,
  kanaToRomaji,
  looseRomaji,
  matchesReading,
  romajiToKana,
  soundKey,
  toHiragana,
  toKatakana,
} from './kana';

describe('kanaToRomaji (Hepburn)', () => {
  it('transcrit les syllabes simples et particulières', () => {
    expect(kanaToRomaji('める')).toBe('meru');
    expect(kanaToRomaji('しちつふじ')).toBe('shichitsufuji');
    expect(kanaToRomaji('すし')).toBe('sushi');
  });

  it('gère les combinaisons, le petit tsu et ん', () => {
    expect(kanaToRomaji('きょうと')).toBe('kyouto');
    expect(kanaToRomaji('きって')).toBe('kitte');
    expect(kanaToRomaji('まっちゃ')).toBe('matcha');
    expect(kanaToRomaji('きんえん')).toBe("kin'en");
    expect(kanaToRomaji('ほんや')).toBe("hon'ya");
    expect(kanaToRomaji('しんぶん')).toBe('shinbun');
  });

  it('lit les katakana, le trait d’allongement et les sons étendus', () => {
    expect(kanaToRomaji('コーヒー')).toBe('koohii');
    expect(kanaToRomaji('パーティー')).toBe('paatii');
    expect(kanaToRomaji('ファイル')).toBe('fairu');
  });

  it('peut noter les voyelles longues avec des macrons', () => {
    expect(kanaToRomaji('とうきょう', { macrons: true })).toBe('tōkyō');
    expect(kanaToRomaji('コーヒー', { macrons: true })).toBe('kōhī');
    expect(kanaToRomaji('おかあさん', { macrons: true })).toBe('okāsan');
  });

  it('garde la ponctuation lisible', () => {
    expect(kanaToRomaji('はい。')).toBe('hai.');
  });
});

describe('romajiToKana', () => {
  it('convertit comme un clavier japonais', () => {
    expect(romajiToKana('sushi')).toBe('すし');
    expect(romajiToKana('konnichiwa')).toBe('こんにちわ');
    expect(romajiToKana('kitte')).toBe('きって');
    expect(romajiToKana('matcha')).toBe('まっちゃ');
    expect(romajiToKana("kin'en")).toBe('きんえん');
    expect(romajiToKana('shinbun')).toBe('しんぶん');
    expect(romajiToKana('shimbun')).toBe('しんぶん');
    expect(romajiToKana('hon')).toBe('ほん');
  });

  it('accepte les variantes Kunrei et les majuscules', () => {
    expect(romajiToKana('SI TI TU HU ZI')).toBe('し ち つ ふ じ');
    expect(romajiToKana('tyotto')).toBe('ちょっと');
  });

  it('écrit en katakana avec le trait d’allongement', () => {
    expect(romajiToKana('ko-hi-', 'katakana')).toBe('コーヒー');
    expect(romajiToKana('fairu', 'katakana')).toBe('ファイル');
  });

  it('comprend les macrons', () => {
    expect(romajiToKana('tōkyō')).toBe('とうきょう');
  });

  it('fait l’aller-retour sur les kana du quiz', () => {
    for (const { kana } of kanaEntries(['base', 'dakuten', 'combo'])) {
      expect(soundKey(romajiToKana(kanaToRomaji(kana))), kana).toBe(soundKey(kana));
    }
  });
});

describe('comparaison des réponses', () => {
  it('passe d’une écriture à l’autre', () => {
    expect(toKatakana('かたかな')).toBe('カタカナ');
    expect(toHiragana('カタカナー')).toBe('かたかなー');
  });

  it('accepte toutes les orthographes d’un même son', () => {
    expect(matchesReading('shi', 'し')).toBe(true);
    expect(matchesReading('si', 'シ')).toBe(true);
    expect(matchesReading('o', 'を')).toBe(true);
    expect(matchesReading('wo', 'を')).toBe(true);
    expect(matchesReading('ji', 'ぢ')).toBe(true);
    expect(matchesReading('n', 'ん')).toBe(true);
    expect(matchesReading('kyo', 'きょ')).toBe(true);
    expect(matchesReading('Watashi wa', 'わたしわ')).toBe(true);
  });

  it('refuse une mauvaise réponse ou une saisie vide', () => {
    expect(matchesReading('su', 'し')).toBe(false);
    expect(matchesReading('', 'し')).toBe(false);
    expect(matchesReading('ki', 'きょ')).toBe(false);
  });

  it('tolère les voyelles longues en mode souple', () => {
    expect(looseRomaji('Tōkyō')).toBe(looseRomaji('tokyo'));
    expect(looseRomaji('toukyou')).toBe(looseRomaji('tokyo'));
    expect(looseRomaji('sensei')).toBe(looseRomaji('sense'));
  });

  it('compte 46 kana de base, 25 avec dakuten et 33 combinaisons', () => {
    expect(kanaEntries(['base'])).toHaveLength(46);
    expect(kanaEntries(['dakuten'])).toHaveLength(25);
    expect(kanaEntries(['combo'])).toHaveLength(33);
  });
});
