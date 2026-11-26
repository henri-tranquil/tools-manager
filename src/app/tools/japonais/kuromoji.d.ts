// Déclarations minimales des modules internes de @sglkc/kuromoji utilisés par dictionary.ts :
// on fournit notre propre chargeur de fichiers à la place de celui du paquet.
declare module '@sglkc/kuromoji/src/loader/DictionaryLoader' {
  type Callback = (error: unknown, buffer: ArrayBuffer | null) => void;
  export default class DictionaryLoader {
    constructor(dicPath: string);
    loadArrayBuffer: (url: string, callback: Callback) => void;
    load(callback: (error: unknown, dic: unknown) => void): void;
  }
}

declare module '@sglkc/kuromoji/src/Tokenizer' {
  export default class Tokenizer {
    constructor(dic: unknown);
    tokenize(text: string): {
      surface_form: string;
      pos: string;
      pos_detail_1: string;
      basic_form: string;
      reading?: string;
    }[];
  }
}
