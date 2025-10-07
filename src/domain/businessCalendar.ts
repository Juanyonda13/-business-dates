import type { BusinessCalendarDeps } from './contracts.js';

const MS_PER_MINUTE: number = 60 * 1000;
const MS_PER_HOUR: number = 60 * MS_PER_MINUTE;
const MS_PER_DAY: number = 24 * MS_PER_HOUR;

export const DEFAULT_RULES = {
  timezone: 'America/Bogota',
  workdayStartHour: 8,
  lunchStartHour: 12,
  lunchEndHour: 13,
  workdayEndHour: 17,
} as const;

function formatYmdInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value ?? '0000';
  const month = parts.find(p => p.type === 'month')?.value ?? '00';
  const day = parts.find(p => p.type === 'day')?.value ?? '00';
  return `${year}-${month}-${day}`;
}

function getHourMinuteSecondInTimezone(date: Date, timeZone: string): { hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date);
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find(p => p.type === 'minute')?.value ?? '0');
  const second = Number(parts.find(p => p.type === 'second')?.value ?? '0');
  return { hour, minute, second };
}

function getWeekdayInTimezone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).formatToParts(date);
  const wk = parts.find(p => p.type === 'weekday')?.value ?? 'Sun';
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wk] ?? 0;
}

function setTimeInTimezone(date: Date, timeZone: string, hour: number, minute: number, second: number = 0): Date {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const year = Number(ymd.find(p => p.type === 'year')?.value ?? '1970');
  const month = Number(ymd.find(p => p.type === 'month')?.value ?? '01');
  const day = Number(ymd.find(p => p.type === 'day')?.value ?? '01');
  const local = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const { hour: h2, minute: m2, second: s2 } = getHourMinuteSecondInTimezone(local, timeZone);
  const deltaMs = ((hour - h2) * MS_PER_HOUR) + ((minute - m2) * MS_PER_MINUTE) + ((second - s2) * 1000);
  return new Date(local.getTime() + deltaMs);
}

function isHoliday(date: Date, deps: BusinessCalendarDeps): boolean {
  const ymd = formatYmdInTimezone(date, deps.rules.timezone);
  return deps.holidaySet.has(ymd);
}

function isBusinessDay(date: Date, deps: BusinessCalendarDeps): boolean {
  const weekday = getWeekdayInTimezone(date, deps.rules.timezone);
  if (weekday === 0 || weekday === 6) return false;
  if (isHoliday(date, deps)) return false;
  return true;
}

function advanceToNextBusinessStart(date: Date, deps: BusinessCalendarDeps): Date {
  const tz = deps.rules.timezone;
  let d = new Date(date.getTime() + MS_PER_DAY);
  while (!isBusinessDay(d, deps)) d = new Date(d.getTime() + MS_PER_DAY);
  return setTimeInTimezone(d, tz, deps.rules.workdayStartHour, 0, 0);
}

function backfillToNearestWorkingMoment(date: Date, deps: BusinessCalendarDeps): Date {
  const tz = deps.rules.timezone;
  if (!isBusinessDay(date, deps)) {
    let prev = new Date(date.getTime() - MS_PER_DAY);
    while (!isBusinessDay(prev, deps)) prev = new Date(prev.getTime() - MS_PER_DAY);
    return setTimeInTimezone(prev, tz, deps.rules.workdayEndHour, 0, 0);
  }
  const start = setTimeInTimezone(date, tz, deps.rules.workdayStartHour, 0, 0);
  const lunchStart = setTimeInTimezone(date, tz, deps.rules.lunchStartHour, 0, 0);
  const lunchEnd = setTimeInTimezone(date, tz, deps.rules.lunchEndHour, 0, 0);
  const end = setTimeInTimezone(date, tz, deps.rules.workdayEndHour, 0, 0);
  const t = date.getTime();
  if (t < start.getTime()) {
    let prev = new Date(date.getTime() - MS_PER_DAY);
    while (!isBusinessDay(prev, deps)) prev = new Date(prev.getTime() - MS_PER_DAY);
    return setTimeInTimezone(prev, tz, deps.rules.workdayEndHour, 0, 0);
  }
  if (t >= end.getTime()) return end;
  if (t >= lunchStart.getTime() && t < lunchEnd.getTime()) return lunchStart;
  return date;
}

export function addBusinessDays(start: Date, days: number, deps: BusinessCalendarDeps): Date {
  if (days <= 0) return start;
  const tz = deps.rules.timezone;
  const base = backfillToNearestWorkingMoment(start, deps);
  const { hour: baseHour, minute: baseMinute, second: baseSecond } = getHourMinuteSecondInTimezone(base, tz);
  let cursor = new Date(base.getTime() + MS_PER_DAY);
  let remaining = days;
  while (remaining > 0) {
    if (isBusinessDay(cursor, deps)) {
      remaining -= 1;
      if (remaining === 0) {
        const candidate = setTimeInTimezone(cursor, tz, baseHour, baseMinute, baseSecond);
        return backfillToNearestWorkingMoment(candidate, deps);
      }
    }
    cursor = new Date(cursor.getTime() + MS_PER_DAY);
  }
  return setTimeInTimezone(cursor, tz, baseHour, baseMinute, baseSecond);
}

export function addBusinessHours(start: Date, hours: number, deps: BusinessCalendarDeps): Date {
  if (hours <= 0) return start;
  const tz = deps.rules.timezone;
  let current = backfillToNearestWorkingMoment(start, deps);
  let remaining = hours;
  while (remaining > 0) {
    const lunchStart = setTimeInTimezone(current, tz, deps.rules.lunchStartHour, 0, 0);
    const lunchEnd = setTimeInTimezone(current, tz, deps.rules.lunchEndHour, 0, 0);
    const endOfDay = setTimeInTimezone(current, tz, deps.rules.workdayEndHour, 0, 0);
    const t = current.getTime();
    let segmentEnd: Date;
    if (t < lunchStart.getTime()) segmentEnd = lunchStart; else if (t >= lunchEnd.getTime() && t < endOfDay.getTime()) segmentEnd = endOfDay; else if (t >= endOfDay.getTime()) { current = advanceToNextBusinessStart(current, deps); continue; } else { current = lunchEnd; continue; }
    const availableMs = segmentEnd.getTime() - t;
    const availableHours = availableMs / MS_PER_HOUR;
    if (remaining <= availableHours + 1e-9) {
      const advanceMs = remaining * MS_PER_HOUR;
      return new Date(t + advanceMs);
    } else {
      remaining -= availableHours;
      current = segmentEnd;
      if (segmentEnd.getTime() === lunchStart.getTime()) current = lunchEnd; else if (segmentEnd.getTime() === endOfDay.getTime()) current = advanceToNextBusinessStart(current, deps);
    }
  }
  return current;
}


