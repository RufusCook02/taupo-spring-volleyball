// A team's weekend in time order: games it plays and games it referees (duty), with simple reminders.
import type { ResolvedGame } from './types';

export interface ScheduleItem {
  kind: 'play' | 'duty';
  game: ResolvedGame;
  /** for 'play': the opponent's label */
  opponent?: string;
  hint?: string;
}

const mins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export function teamSchedule(games: ResolvedGame[], teamId: string): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  for (const g of games) {
    if (g.t1.teamId === teamId) items.push({ kind: 'play', game: g, opponent: g.t2.label });
    else if (g.t2.teamId === teamId) items.push({ kind: 'play', game: g, opponent: g.t1.label });
    if (g.dutySlot.teamId === teamId) items.push({ kind: 'duty', game: g });
  }
  items.sort(
    (a, b) =>
      (a.game.day === b.game.day ? 0 : a.game.day === 'sat' ? -1 : 1) ||
      mins(a.game.time) - mins(b.game.time) ||
      (a.kind === b.kind ? 0 : a.kind === 'play' ? -1 : 1),
  );

  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const cur = items[i];
    if (prev.game.day !== cur.game.day) continue;
    const gap = mins(cur.game.time) - mins(prev.game.time);
    if (gap === 0) {
      cur.hint = 'Clash – same time as your previous item. Check with the TVC desk.';
    } else if (gap <= 60) {
      if (prev.kind === 'play' && cur.kind === 'duty') cur.hint = 'Duty straight after your game';
      else if (prev.kind === 'duty' && cur.kind === 'play') cur.hint = 'Playing straight after your duty';
      else if (prev.kind === 'play' && cur.kind === 'play') cur.hint = 'Back-to-back games';
      else cur.hint = 'Back-to-back duties';
    }
  }
  return items;
}

/** First item not yet finished (in progress or scheduled). */
export function nextItem(items: ScheduleItem[]): ScheduleItem | null {
  return items.find((i) => i.game.status !== 'final') ?? null;
}
