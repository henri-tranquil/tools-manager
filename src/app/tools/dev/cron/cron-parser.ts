/**
 * Expressions cron standard à 5 champs : minute heure jour-du-mois mois jour-de-la-semaine.
 * Gère *, listes (1,15), intervalles (1-5), pas (*\/15, 0-30/10), noms (jan, mon) et macros (@daily…).
 */

interface FieldSpec {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly names?: readonly string[];
}

const FIELDS: readonly FieldSpec[] = [
  { label: 'minute', min: 0, max: 59 },
  { label: 'heure', min: 0, max: 23 },
  { label: 'jour du mois', min: 1, max: 31 },
  {
    label: 'mois',
    min: 1,
    max: 12,
    names: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
  },
  {
    label: 'jour de la semaine',
    min: 0,
    max: 7,
    names: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  },
];

const MACROS: Readonly<Record<string, string>> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export interface CronField {
  /** Valeurs autorisées, triées. */
  readonly values: readonly number[];
  /** Le champ vaut « * ». */
  readonly any: boolean;
  /** Pas d'une forme « *\/n », sinon null. */
  readonly everyStep: number | null;
}

export interface Cron {
  readonly minute: CronField;
  readonly hour: CronField;
  readonly dayOfMonth: CronField;
  readonly month: CronField;
  readonly dayOfWeek: CronField;
}

export type CronParseResult =
  { readonly ok: true; readonly cron: Cron } | { readonly ok: false; readonly error: string };

function parseValue(token: string, spec: FieldSpec): number {
  const index = spec.names?.indexOf(token.toLowerCase()) ?? -1;
  if (index >= 0) {
    return index + (spec.min === 1 ? 1 : 0);
  }
  if (!/^\d+$/.test(token)) {
    return Number.NaN;
  }
  return Number(token);
}

function parseField(text: string, spec: FieldSpec): CronField | string {
  const values = new Set<number>();
  let everyStep: number | null = null;
  for (const part of text.split(',')) {
    const [range, stepText, extra] = part.split('/');
    if (extra !== undefined || range === '') {
      return `${spec.label} : « ${part} » est invalide`;
    }
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!Number.isInteger(step) || step < 1) {
      return `${spec.label} : pas « ${stepText} » invalide`;
    }
    let from: number;
    let to: number;
    if (range === '*') {
      [from, to] = [spec.min, spec.max];
      if (stepText !== undefined && text.split(',').length === 1) {
        everyStep = step;
      }
    } else {
      const [a, b] = range.split('-');
      from = parseValue(a, spec);
      to = b === undefined ? (stepText === undefined ? from : spec.max) : parseValue(b, spec);
    }
    if (Number.isNaN(from) || Number.isNaN(to) || from < spec.min || to > spec.max || from > to) {
      return `${spec.label} : « ${part} » est hors limites (${spec.min}–${spec.max})`;
    }
    for (let v = from; v <= to; v += step) {
      values.add(v);
    }
  }
  return { values: [...values].sort((x, y) => x - y), any: text === '*', everyStep };
}

export function parseCron(expression: string): CronParseResult {
  const trimmed = expression.trim().toLowerCase();
  const expanded = MACROS[trimmed] ?? trimmed;
  const parts = expanded.split(/\s+/).filter(Boolean);
  if (parts.length !== 5) {
    return {
      ok: false,
      error: `Il faut 5 champs (minute heure jour mois jour-semaine), ${parts.length} trouvé(s).`,
    };
  }
  const fields: CronField[] = [];
  for (let i = 0; i < 5; i += 1) {
    const field = parseField(parts[i], FIELDS[i]);
    if (typeof field === 'string') {
      return { ok: false, error: field.charAt(0).toUpperCase() + field.slice(1) + '.' };
    }
    fields.push(field);
  }
  // Le dimanche peut s'écrire 0 ou 7.
  const dow = fields[4];
  const weekdays = [...new Set(dow.values.map((d) => d % 7))].sort((a, b) => a - b);
  return {
    ok: true,
    cron: {
      minute: fields[0],
      hour: fields[1],
      dayOfMonth: fields[2],
      month: fields[3],
      dayOfWeek: { ...dow, values: weekdays },
    },
  };
}

// ---------------------------------------------------------------- Description en français

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTH_NAMES = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

function joinFr(items: readonly string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}

const pad = (n: number) => String(n).padStart(2, '0');
const isContiguous = (values: readonly number[]) =>
  values.length > 2 && values.every((v, i) => i === 0 || v === values[i - 1] + 1);

function describeTime(minute: CronField, hour: CronField): string {
  const m = minute.values;
  const h = hour.values;
  if (minute.any && hour.any) {
    return 'toutes les minutes';
  }
  if (minute.everyStep && hour.any) {
    return `toutes les ${minute.everyStep} minutes`;
  }
  if (m.length === 1 && hour.any) {
    return m[0] === 0 ? 'toutes les heures pile' : `toutes les heures à la minute ${m[0]}`;
  }
  if (m.length === 1 && hour.everyStep) {
    return `toutes les ${hour.everyStep} heures, à la minute ${m[0]}`;
  }
  if (m.length === 1 && h.length <= 6) {
    return `à ${joinFr(h.map((x) => `${pad(x)}:${pad(m[0])}`))}`;
  }
  if (m.length === 1 && isContiguous(h)) {
    return `toutes les heures de ${h[0]} h à ${h[h.length - 1]} h, à la minute ${m[0]}`;
  }
  const minutes = minute.any
    ? 'chaque minute'
    : minute.everyStep
      ? `toutes les ${minute.everyStep} minutes`
      : `aux minutes ${joinFr(m.map(String))}`;
  const hours = hour.any
    ? 'de chaque heure'
    : isContiguous(h)
      ? `de ${h[0]} h à ${h[h.length - 1]} h`
      : `à ${joinFr(h.map((x) => `${x} h`))}`;
  return `${minutes}, ${hours}`;
}

function describeWeekdays(days: readonly number[]): string {
  const key = days.join(',');
  if (key === '1,2,3,4,5') {
    return 'du lundi au vendredi';
  }
  if (key === '0,6') {
    return 'le week-end';
  }
  // Lundi en premier, dimanche en dernier.
  const ordered = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  return `le ${joinFr(ordered.map((d) => DAY_NAMES[d]))}`;
}

function describeDaysOfMonth(field: CronField): string {
  if (field.everyStep) {
    return `tous les ${field.everyStep} jours du mois`;
  }
  const labels = field.values.map((d) => (d === 1 ? '1er' : String(d)));
  return `${field.values.length > 1 ? 'les' : 'le'} ${joinFr(labels)} du mois`;
}

export function describeCron(cron: Cron): string {
  const parts = [describeTime(cron.minute, cron.hour)];
  const domAny = cron.dayOfMonth.any;
  const dowAny = cron.dayOfWeek.any;
  if (domAny && dowAny) {
    parts.push('tous les jours');
  } else if (domAny) {
    parts.push(describeWeekdays(cron.dayOfWeek.values));
  } else if (dowAny) {
    parts.push(describeDaysOfMonth(cron.dayOfMonth));
  } else {
    // Quand les deux sont restreints, cron déclenche si l'un OU l'autre correspond.
    parts.push(
      `${describeDaysOfMonth(cron.dayOfMonth)} ou ${describeWeekdays(cron.dayOfWeek.values)}`,
    );
  }
  if (!cron.month.any) {
    parts.push(`en ${joinFr(cron.month.values.map((mo) => MONTH_NAMES[mo - 1]))}`);
  }
  const text = parts.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

// ---------------------------------------------------------------- Prochaines exécutions

function dayMatches(cron: Cron, date: Date): boolean {
  const domOk = cron.dayOfMonth.values.includes(date.getDate());
  const dowOk = cron.dayOfWeek.values.includes(date.getDay());
  if (cron.dayOfMonth.any && cron.dayOfWeek.any) {
    return true;
  }
  if (cron.dayOfMonth.any) {
    return dowOk;
  }
  if (cron.dayOfWeek.any) {
    return domOk;
  }
  return domOk || dowOk;
}

/** Les `count` prochaines exécutions strictement après `from` (heure locale), sur 5 ans au plus. */
export function nextRuns(cron: Cron, from: Date, count = 5): Date[] {
  const runs: Date[] = [];
  const date = new Date(from);
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() + 1);
  const limit = new Date(from);
  limit.setFullYear(limit.getFullYear() + 5);

  while (runs.length < count && date <= limit) {
    if (!cron.month.values.includes(date.getMonth() + 1) || !dayMatches(cron, date)) {
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      continue;
    }
    if (!cron.hour.values.includes(date.getHours())) {
      date.setHours(date.getHours() + 1, 0, 0, 0);
      continue;
    }
    if (cron.minute.values.includes(date.getMinutes())) {
      runs.push(new Date(date));
    }
    date.setMinutes(date.getMinutes() + 1);
  }
  return runs;
}
