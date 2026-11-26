import { DIALOGUES, REPLIES } from './data/listening';
import { dialogueLines, replyLines, shuffleChoices, soundQuestion } from './listening';
import { soundKey, toHiragana } from './kana';
import { beyondLevel } from './phrases';

const seeded = () => {
  let s = 3;
  return (max: number) => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s % max;
  };
};

describe('compréhension orale', () => {
  it("le japonais n'utilise que des kanji du N5", () => {
    for (const d of DIALOGUES) {
      for (const l of d.lines) {
        expect(beyondLevel(l.ja), `${d.id} : ${l.ja}`).toBe(false);
      }
    }
    for (const r of REPLIES) {
      for (const text of [r.prompt, ...r.choices]) {
        expect(beyondLevel(text), `${r.id} : ${text}`).toBe(false);
      }
    }
  });

  it('identifiants uniques et propositions distinctes', () => {
    expect(new Set(DIALOGUES.map((d) => d.id)).size).toBe(DIALOGUES.length);
    expect(new Set(REPLIES.map((r) => r.id)).size).toBe(REPLIES.length);
    for (const item of [...DIALOGUES, ...REPLIES]) {
      expect(new Set(item.choices).size, item.id).toBe(item.choices.length);
      expect(item.choices.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('retrouve la bonne réponse après mélange', () => {
    const random = seeded();
    for (const d of DIALOGUES) {
      const q = shuffleChoices(d.choices, random);
      expect(q.options[q.answer]).toBe(d.choices[0]);
    }
  });

  it('prépare les pistes : deux voix, propositions numérotées', () => {
    expect(dialogueLines(DIALOGUES[0]).map((l) => l.speaker)).toEqual([1, 0, 1, 0]);
    const lines = replyLines(REPLIES[0], ['a', 'b', 'c']);
    expect(lines.map((l) => l.text)).toEqual(['おげんきですか。', 'いち。a', 'に。b', 'さん。c']);
  });

  it('son → caractère : quatre propositions qui se prononcent toutes différemment', () => {
    const random = seeded();
    for (const target of ['kana', 'kanji'] as const) {
      for (let i = 0; i < 60; i++) {
        const q = soundQuestion(target, random);
        expect(q.options).toHaveLength(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        if (target === 'kana') {
          const sounds = q.options.map((o) => soundKey(toHiragana(o)));
          expect(new Set(sounds).size, q.options.join(',')).toBe(4);
          expect(soundKey(toHiragana(q.options[q.answer]))).toBe(soundKey(q.spoken));
        } else {
          expect(new Set(q.options).size).toBe(4);
        }
      }
    }
  });
});
