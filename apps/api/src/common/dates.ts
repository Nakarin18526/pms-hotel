/**
 * Date-only helpers — all dates are treated as UTC midnight to avoid
 * timezone-shift bugs when storing/reading from Postgres @db.Date columns.
 *
 * Without this: parseISO("2026-04-30") in Bangkok (UTC+7) returns a Date
 * representing 2026-04-30 00:00 local = 2026-04-29 17:00 UTC. When written
 * to a @db.Date column, Postgres stores "2026-04-29" — off by one day.
 */

export function parseDate(s: string): Date {
  // Accept "yyyy-mm-dd" or full ISO string — normalize to UTC midnight
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) throw new Error(`Invalid date: ${s}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysUTC(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export function eachDayUTC(start: Date, endInclusive: Date): Date[] {
  const out: Date[] = [];
  for (let d = new Date(start); d <= endInclusive; d = addDaysUTC(d, 1))
    out.push(new Date(d));
  return out;
}

export function diffDaysUTC(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}
