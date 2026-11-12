import { COURTS, DAYS, GAMES, type Day } from '@/data/draw';
import type { ResolvedGame } from './types';

/** Today's date in New Zealand as 'YYYY-MM-DD'. */
export function nzDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(now);
}

/** Which day to feature: Sunday once it's Sunday in NZ or once every Saturday game is final. */
export function currentDay(games: ResolvedGame[], now = new Date()): Day {
  if (nzDate(now) >= DAYS.sun.date) return 'sun';
  const satDone = games.filter((g) => g.day === 'sat').every((g) => g.status === 'final');
  return satDone ? 'sun' : 'sat';
}

export interface CourtNow {
  court: number;
  current: ResolvedGame | null;
  next: ResolvedGame | null;
}

/**
 * What's on each court, driven by game status rather than the clock (games run late):
 * current = in-progress game; next = first game still scheduled after it.
 */
export function courtsNow(games: ResolvedGame[], day: Day): CourtNow[] {
  return COURTS.map((court) => {
    const list = games.filter((g) => g.day === day && g.court === court).sort((a, b) => a.sort - b.sort);
    const current = list.find((g) => g.status === 'in_progress') ?? null;
    const next = list.find((g) => g.status === 'scheduled' && (!current || g.sort > current.sort)) ?? null;
    return { court, current, next };
  });
}

export const TIMES = (day: Day) => [...new Set(GAMES.filter((g) => g.day === day).map((g) => g.time))].sort();
