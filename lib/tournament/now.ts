import { COURTS, DAYS, GAMES, type Day } from '@/data/draw';
import type { ResolvedGame, TournamentState } from './types';

/** Today's date in New Zealand as 'YYYY-MM-DD'. */
export function nzDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(now);
}

export interface NzClock {
  date: string; // 'YYYY-MM-DD'
  minutes: number; // minutes since local midnight
}

/** Current date and time of day in New Zealand. */
export function nzClock(now = new Date()): NzClock {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Pacific/Auckland',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { date: nzDate(now), minutes: h * 60 + m };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const dayIndex = (date: string) => Math.round((Date.parse(date) - Date.parse(DAYS.sat.date)) / 86_400_000);

/** Minutes from now until the game's scheduled start (negative once the start time has passed). */
export function minutesUntilStart(g: { day: Day; time: string }, clock: NzClock): number {
  const gameDay = g.day === 'sat' ? 0 : 1;
  return (gameDay - dayIndex(clock.date)) * 1440 + toMinutes(g.time) - clock.minutes;
}

/** Which day to feature: Sunday once it's Sunday in NZ or once every Saturday game is final. */
export function currentDay(games: ResolvedGame[], now = new Date()): Day {
  if (nzDate(now) >= DAYS.sun.date) return 'sun';
  const satDone = games.filter((g) => g.day === 'sat').every((g) => g.status === 'final');
  return satDone ? 'sun' : 'sat';
}

/**
 * Games to show as in progress because their start time has passed, though nobody has marked them.
 * Only a court's next unfinished game qualifies, and only if it's still 'scheduled' (not 'delayed'),
 * both teams are known, and nothing earlier on that court is still being played.
 */
export function autoLiveCodes(games: ResolvedGame[], now = new Date()): Set<string> {
  const clock = nzClock(now);
  const out = new Set<string>();
  for (const day of ['sat', 'sun'] as Day[]) {
    for (const court of COURTS) {
      const first = games
        .filter((g) => g.day === day && g.court === court)
        .sort((a, b) => a.sort - b.sort)
        .find((g) => g.status !== 'final');
      if (
        first &&
        first.status === 'scheduled' &&
        first.t1.teamId &&
        first.t2.teamId &&
        minutesUntilStart(first, clock) <= 0
      ) {
        out.add(first.code);
      }
    }
  }
  return out;
}

/** The state as the public sees it: started-but-unmarked games shown as in progress. */
export function withAutoLive(state: TournamentState, now = new Date()): TournamentState {
  const codes = autoLiveCodes(state.games, now);
  if (codes.size === 0) return state;
  const games = state.games.map((g) => (codes.has(g.code) ? { ...g, status: 'in_progress' as const, autoLive: true } : g));
  return { ...state, games, gamesByCode: Object.fromEntries(games.map((g) => [g.code, g])) };
}

export interface CourtNow {
  court: number;
  current: ResolvedGame | null;
  next: ResolvedGame | null;
}

/** What's on each court: the in-progress game, and the next game not yet started (scheduled or delayed). */
export function courtsNow(games: ResolvedGame[], day: Day): CourtNow[] {
  return COURTS.map((court) => {
    const list = games.filter((g) => g.day === day && g.court === court).sort((a, b) => a.sort - b.sort);
    const current = list.find((g) => g.status === 'in_progress') ?? null;
    const next =
      list.find((g) => (g.status === 'scheduled' || g.status === 'delayed') && (!current || g.sort > current.sort)) ?? null;
    return { court, current, next };
  });
}

export const TIMES = (day: Day) => [...new Set(GAMES.filter((g) => g.day === day).map((g) => g.time))].sort();
