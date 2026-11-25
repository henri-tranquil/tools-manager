import {
  formatClock,
  formatDuration,
  formatHms,
  formatMinSec,
  parseHoursMinutes,
  parseMinSec,
} from './time';

describe('parseMinSec', () => {
  it('lit les formats min:s, min’s et minutes décimales', () => {
    expect(parseMinSec('6:30')).toBe(390);
    expect(parseMinSec("5'05")).toBe(305);
    expect(parseMinSec('7:')).toBe(420);
    expect(parseMinSec('6,5')).toBe(390);
  });

  it('rejette les saisies invalides', () => {
    expect(parseMinSec('6:75')).toBeNaN();
    expect(parseMinSec('abc')).toBeNaN();
    expect(parseMinSec('1:2:3')).toBeNaN();
  });
});

describe('parseHoursMinutes', () => {
  it('lit h:mm, 2h30 et les heures décimales', () => {
    expect(parseHoursMinutes('2:30')).toBe(9000);
    expect(parseHoursMinutes('2h30')).toBe(9000);
    expect(parseHoursMinutes('1,5')).toBe(5400);
  });

  it('rejette les minutes hors bornes', () => {
    expect(parseHoursMinutes('2:75')).toBeNaN();
  });
});

describe('formatages', () => {
  it('formatDuration', () => {
    expect(formatDuration(19500)).toBe('5 h 25');
    expect(formatDuration(3600)).toBe('1 h 00');
    expect(formatDuration(2700)).toBe('45 min');
    expect(formatDuration(Number.NaN)).toBe('—');
  });

  it('formatClock', () => {
    expect(formatClock(360)).toBe('06:00');
    expect(formatClock(-4)).toBe('00:00');
  });

  it('formatMinSec', () => {
    expect(formatMinSec(312)).toBe('5:12');
    expect(formatMinSec(0)).toBe('—');
  });

  it('formatHms', () => {
    expect(formatHms(3725)).toBe('1:02:05');
    expect(formatHms(725)).toBe('12:05');
    expect(formatHms(65)).toBe('1:05');
  });
});
