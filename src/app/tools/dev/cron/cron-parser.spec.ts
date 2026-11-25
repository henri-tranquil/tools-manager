import { Cron, describeCron, nextRuns, parseCron } from './cron-parser';

function parse(expression: string): Cron {
  const result = parseCron(expression);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.cron;
}

describe('parseCron', () => {
  it('développe pas, intervalles et listes', () => {
    const cron = parse('*/15 9-11 1,15 * mon-fri');
    expect(cron.minute.values).toEqual([0, 15, 30, 45]);
    expect(cron.hour.values).toEqual([9, 10, 11]);
    expect(cron.dayOfMonth.values).toEqual([1, 15]);
    expect(cron.dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
  });

  it('accepte le dimanche écrit 7 et les macros', () => {
    expect(parse('0 0 * * 7').dayOfWeek.values).toEqual([0]);
    expect(parse('@daily').hour.values).toEqual([0]);
  });

  it('signale les erreurs', () => {
    expect(parseCron('61 * * * *').ok).toBe(false);
    expect(parseCron('* * *').ok).toBe(false);
    expect(parseCron('*/0 * * * *').ok).toBe(false);
  });
});

describe('describeCron', () => {
  it.each([
    ['* * * * *', 'Toutes les minutes, tous les jours.'],
    ['*/15 * * * *', 'Toutes les 15 minutes, tous les jours.'],
    ['0 8 * * 1-5', 'À 08:00, du lundi au vendredi.'],
    ['30 6 1 * *', 'À 06:30, le 1er du mois.'],
    ['0 9,18 * * 0,6', 'À 09:00 et 18:00, le week-end.'],
    ['0 0 1 1 *', 'À 00:00, le 1er du mois, en janvier.'],
    ['0 */2 * * *', 'Toutes les 2 heures, à la minute 0, tous les jours.'],
  ])('%s → %s', (expression, expected) => {
    expect(describeCron(parse(expression))).toBe(expected);
  });
});

describe('nextRuns', () => {
  it('saute le week-end', () => {
    // Vendredi 27 novembre 2026, 9 h.
    const runs = nextRuns(parse('0 8 * * 1-5'), new Date(2026, 10, 27, 9, 0), 2);
    expect(runs[0]).toEqual(new Date(2026, 10, 30, 8, 0));
    expect(runs[1]).toEqual(new Date(2026, 11, 1, 8, 0));
  });

  it('renvoie des exécutions strictement futures', () => {
    const from = new Date(2026, 0, 1, 12, 0);
    expect(nextRuns(parse('0 12 * * *'), from, 1)[0]).toEqual(new Date(2026, 0, 2, 12, 0));
  });

  it('renvoie une liste vide pour une date impossible', () => {
    expect(nextRuns(parse('0 0 31 2 *'), new Date(2026, 0, 1), 3)).toEqual([]);
  });
});
