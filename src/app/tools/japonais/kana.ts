/**
 * Kana et rōmaji (Hepburn) : tables, conversion dans les deux sens et comparaison « au son ».
 * Fonctions pures, sans dépendance au navigateur.
 */

export type KanaGroup = 'base' | 'dakuten' | 'combo';
export type Script = 'hiragana' | 'katakana';

export interface KanaEntry {
  /** Hiragana ; le katakana s'en déduit avec `toKatakana`. */
  readonly kana: string;
  readonly romaji: string;
  readonly group: KanaGroup;
}

/** Tableau des 46 kana de base, rangée par rangée (une case vide = ''). */
export const GOJUON_ROWS: readonly (readonly string[])[] = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '', 'ゆ', '', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', '', '', '', 'を'],
  ['ん', '', '', '', ''],
];

export const DAKUTEN_ROWS: readonly (readonly string[])[] = [
  ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  ['だ', 'ぢ', 'づ', 'で', 'ど'],
  ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
];

export const COMBO_ROWS: readonly (readonly string[])[] = [
  ['きゃ', 'きゅ', 'きょ'],
  ['しゃ', 'しゅ', 'しょ'],
  ['ちゃ', 'ちゅ', 'ちょ'],
  ['にゃ', 'にゅ', 'にょ'],
  ['ひゃ', 'ひゅ', 'ひょ'],
  ['みゃ', 'みゅ', 'みょ'],
  ['りゃ', 'りゅ', 'りょ'],
  ['ぎゃ', 'ぎゅ', 'ぎょ'],
  ['じゃ', 'じゅ', 'じょ'],
  ['びゃ', 'びゅ', 'びょ'],
  ['ぴゃ', 'ぴゅ', 'ぴょ'],
];

/** Syllabes simples (hiragana → Hepburn). */
const SINGLE: Readonly<Record<string, string>> = {
  あ: 'a',
  い: 'i',
  う: 'u',
  え: 'e',
  お: 'o',
  か: 'ka',
  き: 'ki',
  く: 'ku',
  け: 'ke',
  こ: 'ko',
  さ: 'sa',
  し: 'shi',
  す: 'su',
  せ: 'se',
  そ: 'so',
  た: 'ta',
  ち: 'chi',
  つ: 'tsu',
  て: 'te',
  と: 'to',
  な: 'na',
  に: 'ni',
  ぬ: 'nu',
  ね: 'ne',
  の: 'no',
  は: 'ha',
  ひ: 'hi',
  ふ: 'fu',
  へ: 'he',
  ほ: 'ho',
  ま: 'ma',
  み: 'mi',
  む: 'mu',
  め: 'me',
  も: 'mo',
  や: 'ya',
  ゆ: 'yu',
  よ: 'yo',
  ら: 'ra',
  り: 'ri',
  る: 'ru',
  れ: 're',
  ろ: 'ro',
  わ: 'wa',
  ゐ: 'wi',
  ゑ: 'we',
  を: 'wo',
  ん: 'n',
  が: 'ga',
  ぎ: 'gi',
  ぐ: 'gu',
  げ: 'ge',
  ご: 'go',
  ざ: 'za',
  じ: 'ji',
  ず: 'zu',
  ぜ: 'ze',
  ぞ: 'zo',
  だ: 'da',
  ぢ: 'ji',
  づ: 'zu',
  で: 'de',
  ど: 'do',
  ば: 'ba',
  び: 'bi',
  ぶ: 'bu',
  べ: 'be',
  ぼ: 'bo',
  ぱ: 'pa',
  ぴ: 'pi',
  ぷ: 'pu',
  ぺ: 'pe',
  ぽ: 'po',
  ゔ: 'vu',
  ぁ: 'a',
  ぃ: 'i',
  ぅ: 'u',
  ぇ: 'e',
  ぉ: 'o',
  ゃ: 'ya',
  ゅ: 'yu',
  ょ: 'yo',
  ゎ: 'wa',
};

/** Syllabes de deux kana : combinaisons (yōon) et sons étendus des emprunts. */
const DOUBLE: Readonly<Record<string, string>> = {
  きゃ: 'kya',
  きゅ: 'kyu',
  きょ: 'kyo',
  しゃ: 'sha',
  しゅ: 'shu',
  しょ: 'sho',
  しぇ: 'she',
  ちゃ: 'cha',
  ちゅ: 'chu',
  ちょ: 'cho',
  ちぇ: 'che',
  にゃ: 'nya',
  にゅ: 'nyu',
  にょ: 'nyo',
  ひゃ: 'hya',
  ひゅ: 'hyu',
  ひょ: 'hyo',
  みゃ: 'mya',
  みゅ: 'myu',
  みょ: 'myo',
  りゃ: 'rya',
  りゅ: 'ryu',
  りょ: 'ryo',
  ぎゃ: 'gya',
  ぎゅ: 'gyu',
  ぎょ: 'gyo',
  じゃ: 'ja',
  じゅ: 'ju',
  じょ: 'jo',
  じぇ: 'je',
  ぢゃ: 'ja',
  ぢゅ: 'ju',
  ぢょ: 'jo',
  びゃ: 'bya',
  びゅ: 'byu',
  びょ: 'byo',
  ぴゃ: 'pya',
  ぴゅ: 'pyu',
  ぴょ: 'pyo',
  ふぁ: 'fa',
  ふぃ: 'fi',
  ふぇ: 'fe',
  ふぉ: 'fo',
  ふゅ: 'fyu',
  てぃ: 'ti',
  でぃ: 'di',
  とぅ: 'tu',
  どぅ: 'du',
  でゅ: 'dyu',
  うぃ: 'wi',
  うぇ: 'we',
  うぉ: 'wo',
  いぇ: 'ye',
  つぁ: 'tsa',
  つぃ: 'tsi',
  つぇ: 'tse',
  つぉ: 'tso',
  ゔぁ: 'va',
  ゔぃ: 'vi',
  ゔぇ: 've',
  ゔぉ: 'vo',
};

/** Rōmaji → hiragana, avec les variantes courantes (Kunrei, saisie clavier). */
const ROMAJI_TO_KANA: Readonly<Record<string, string>> = (() => {
  const table: Record<string, string> = {};
  for (const [kana, romaji] of Object.entries(SINGLE)) {
    if (!'ぁぃぅぇぉゃゅょゎゐゑぢづ'.includes(kana)) {
      table[romaji] = kana;
    }
  }
  for (const [kana, romaji] of Object.entries(DOUBLE)) {
    if (!kana.startsWith('ぢ')) {
      table[romaji] = kana;
    }
  }
  Object.assign(table, {
    si: 'し',
    ti: 'ち',
    tu: 'つ',
    hu: 'ふ',
    zi: 'じ',
    di: 'ぢ',
    du: 'づ',
    sya: 'しゃ',
    syu: 'しゅ',
    syo: 'しょ',
    sye: 'しぇ',
    tya: 'ちゃ',
    tyu: 'ちゅ',
    tyo: 'ちょ',
    cya: 'ちゃ',
    cyu: 'ちゅ',
    cyo: 'ちょ',
    zya: 'じゃ',
    zyu: 'じゅ',
    zyo: 'じょ',
    jya: 'じゃ',
    jyu: 'じゅ',
    jyo: 'じょ',
    dya: 'ぢゃ',
    dyu: 'ぢゅ',
    dyo: 'ぢょ',
    thi: 'てぃ',
    dhi: 'でぃ',
    twu: 'とぅ',
    dwu: 'どぅ',
    xa: 'ぁ',
    xi: 'ぃ',
    xu: 'ぅ',
    xe: 'ぇ',
    xo: 'ぉ',
    la: 'ぁ',
    li: 'ぃ',
    lu: 'ぅ',
    le: 'ぇ',
    lo: 'ぉ',
    xya: 'ゃ',
    xyu: 'ゅ',
    xyo: 'ょ',
    lya: 'ゃ',
    lyu: 'ゅ',
    lyo: 'ょ',
    xtu: 'っ',
    ltu: 'っ',
    xtsu: 'っ',
    ltsu: 'っ',
    xwa: 'ゎ',
    lwa: 'ゎ',
    wo: 'を',
    vu: 'ゔ',
  });
  // « ti » et « di » donnent ち / ぢ à la saisie (usage des claviers japonais).
  table['ti'] = 'ち';
  table['di'] = 'ぢ';
  table['wi'] = 'うぃ';
  table['we'] = 'うぇ';
  return table;
})();

const PUNCTUATION: Readonly<Record<string, string>> = {
  '.': '。',
  ',': '、',
  '?': '？',
  '!': '！',
  '-': 'ー',
  '~': '〜',
  '[': '「',
  ']': '」',
};

const VOWELS = 'aeiou';
const SOKUON_CONSONANTS = 'bcdfghjkmpqrstvwxyz';

/** Katakana → hiragana (ー et les autres caractères sont conservés). */
export function toHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** Hiragana → katakana. */
export function toKatakana(text: string): string {
  return text.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

export function isKana(char: string): boolean {
  return /^[ぁ-ゖァ-ヺー]$/.test(char);
}

export function isKanji(char: string): boolean {
  return /^[㐀-䶿一-鿿豈-﫿々〆ヵヶ]$/u.test(char);
}

/**
 * Rōmaji → hiragana, comme un clavier japonais : « nn » ou « n' » pour ん, consonne doublée
 * pour っ (« kitte »), « - » pour ー. « konnichiwa » donne bien こんにちわ.
 * Les caractères inconnus sont laissés tels quels.
 */
export function romajiToKana(input: string, script: Script = 'hiragana'): string {
  const text = input
    .toLowerCase()
    .normalize('NFC')
    .replace(/[āâ]/g, 'aa')
    .replace(/[īî]/g, 'ii')
    .replace(/[ūû]/g, 'uu')
    .replace(/[ēê]/g, 'ee')
    .replace(/[ōô]/g, 'ou');
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1] ?? '';

    if (c === 'n') {
      if (next === "'") {
        out += 'ん';
        i += 2;
        continue;
      }
      if (next === 'n') {
        // « nna » → んな (plus fréquent que んあ) ; « nn » seul → ん.
        const after = text[i + 2] ?? '';
        out += 'ん';
        i += VOWELS.includes(after) || after === 'y' ? 1 : 2;
        continue;
      }
      if (!VOWELS.includes(next) && next !== 'y') {
        out += 'ん';
        i += 1;
        continue;
      }
    }
    // Hepburn : « m » devant b, m, p se lit ん (shimbun).
    if (c === 'm' && 'bmp'.includes(next) && next !== '') {
      out += 'ん';
      i += 1;
      continue;
    }
    if (c === 't' && next === 'c' && text[i + 2] === 'h') {
      out += 'っ';
      i += 1;
      continue;
    }
    if (c === next && SOKUON_CONSONANTS.includes(c)) {
      out += 'っ';
      i += 1;
      continue;
    }

    let matched = false;
    for (let len = 4; len >= 1; len--) {
      const chunk = text.slice(i, i + len);
      const kana = ROMAJI_TO_KANA[chunk];
      if (kana) {
        out += kana;
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += PUNCTUATION[c] ?? c;
      i += 1;
    }
  }
  return script === 'katakana' ? toKatakana(out) : out;
}

export interface RomajiOptions {
  /** Voyelles longues avec macron (Tōkyō) plutôt que doublées (Toukyou). */
  readonly macrons?: boolean;
}

const MACRON: Readonly<Record<string, string>> = { a: 'ā', i: 'ī', u: 'ū', e: 'ē', o: 'ō' };
const KANA_PUNCTUATION: Readonly<Record<string, string>> = {
  '。': '.',
  '、': ',',
  '？': '?',
  '！': '!',
  '「': '"',
  '」': '"',
  '　': ' ',
  '・': ' ',
  '〜': '~',
};

/** Kana (hiragana ou katakana) → rōmaji Hepburn. Les kanji et autres caractères passent tels quels. */
export function kanaToRomaji(input: string, options: RomajiOptions = {}): string {
  const text = toHiragana(input);
  const syllables: string[] = [];
  let geminate = false;
  let afterN = false;

  for (let i = 0; i < text.length; i++) {
    const pair = text.slice(i, i + 2);
    const c = text[i];
    let romaji: string | undefined;
    let isSyllable = true;

    if (DOUBLE[pair]) {
      romaji = DOUBLE[pair];
      i++;
    } else if (c === 'っ') {
      geminate = true;
      continue;
    } else if (c === 'ー') {
      const prev = syllables.at(-1) ?? '';
      const vowel = prev.at(-1) ?? '';
      if (VOWELS.includes(vowel) && vowel !== '') {
        if (options.macrons) {
          syllables[syllables.length - 1] = prev.slice(0, -1) + MACRON[vowel];
          continue;
        }
        romaji = vowel;
      } else {
        romaji = '-';
      }
    } else if (SINGLE[c]) {
      romaji = SINGLE[c];
    } else {
      romaji = KANA_PUNCTUATION[c] ?? c;
      isSyllable = false;
    }

    if (geminate) {
      if (isSyllable && /^[a-z]/.test(romaji) && !VOWELS.includes(romaji[0])) {
        romaji = (romaji.startsWith('ch') ? 't' : romaji[0]) + romaji;
      } else {
        syllables.push("'");
      }
      geminate = false;
    }
    // ん devant une voyelle ou « y » : apostrophe pour lever l'ambiguïté (kin'en, hon'ya).
    if (afterN && isSyllable && /^[aeiouy]/.test(romaji)) {
      syllables[syllables.length - 1] = "n'";
    }
    afterN = c === 'ん';
    syllables.push(romaji);
  }

  if (!options.macrons) {
    return syllables.join('');
  }
  // Voyelles longues : o + u/o, u + u, a + a, e + e → macron.
  const merged: string[] = [];
  for (const s of syllables) {
    const prev = merged.at(-1) ?? '';
    const last = prev.at(-1) ?? '';
    const long =
      (last === 'o' && (s === 'u' || s === 'o')) ||
      (last === 'u' && s === 'u') ||
      (last === 'a' && s === 'a') ||
      (last === 'e' && s === 'e');
    if (long) {
      merged[merged.length - 1] = prev.slice(0, -1) + MACRON[last];
    } else {
      merged.push(s);
    }
  }
  return merged.join('');
}

/**
 * Forme « au son » d'un texte en kana, pour comparer une réponse : hiragana, sans espaces ni
 * ponctuation, ぢ/づ/を ramenés à じ/ず/お et ー à sa voyelle (même prononciation).
 */
export function soundKey(kana: string): string {
  const vowelKana: Readonly<Record<string, string>> = {
    a: 'あ',
    i: 'い',
    u: 'う',
    e: 'え',
    o: 'お',
  };
  // ー allonge la voyelle précédente : コーヒー se prononce comme こおひい.
  const chars = [...toHiragana(kana)];
  const expanded = chars.map((c, i) =>
    c === 'ー' && i > 0 ? (vowelKana[(SINGLE[chars[i - 1]] ?? '').at(-1) ?? ''] ?? c) : c,
  );
  return expanded
    .join('')
    .replace(/[ぢ]/g, 'じ')
    .replace(/[づ]/g, 'ず')
    .replace(/を/g, 'お')
    .replace(/[\s。、？！.,?!'"「」・〜~]/g, '');
}

/** La saisie en rōmaji `answer` se prononce-t-elle comme `kana` ? */
export function matchesReading(answer: string, kana: string): boolean {
  const typed = soundKey(romajiToKana(answer.trim()));
  return typed !== '' && /^[ぁ-ゖー]+$/.test(typed) && typed === soundKey(kana);
}

/** Comparaison tolérante sur les voyelles longues (おう ≈ お, ええ ≈ え…). */
export function looseRomaji(romaji: string): string {
  return romaji
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
    .replace(/ou/g, 'o')
    .replace(/([aeiou])\1+/g, '$1')
    .replace(/ei/g, 'e');
}

/** Toutes les entrées du quiz, regroupées. */
export function kanaEntries(groups: readonly KanaGroup[]): KanaEntry[] {
  const rows: Record<KanaGroup, readonly (readonly string[])[]> = {
    base: GOJUON_ROWS,
    dakuten: DAKUTEN_ROWS,
    combo: COMBO_ROWS,
  };
  return groups.flatMap((group) =>
    rows[group]
      .flat()
      .filter(Boolean)
      .map((kana) => ({ kana, romaji: kanaToRomaji(kana), group })),
  );
}
