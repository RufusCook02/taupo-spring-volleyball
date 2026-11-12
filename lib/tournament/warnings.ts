// Non-blocking checks shown to scorers before they save. Blocking rules live in app/admin/actions.ts.
import { gameResult, type SetScores } from './result';
import type { GameStatus } from './types';

const TARGETS = [25, 25, 15];

export function scoreWarnings(s: SetScores, status: GameStatus): string[] {
  const out: string[] = [];
  const sets: [number | null, number | null][] = [
    [s.s1a, s.s1b],
    [s.s2a, s.s2b],
    [s.s3a, s.s3b],
  ];
  sets.forEach(([a, b], i) => {
    if (a == null || b == null) return;
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    const t = TARGETS[i];
    if (hi === t && hi - lo < 2) out.push(`Set ${i + 1} is ${a}–${b}: a set must be won by 2.`);
    else if (hi > t && hi - lo !== 2)
      out.push(`Set ${i + 1} is ${a}–${b}: past ${t}, the set ends as soon as a team leads by 2.`);
  });
  const r = gameResult(s);
  if ((r.setsA === 2 || r.setsB === 2) && r.set3Played) {
    out.push('Set 3 won’t count – the game was already decided 2–0.');
  }
  if ((status === 'scheduled' || status === 'delayed') && r.played) {
    out.push('Scores entered, so this will be saved as In progress.');
  }
  return out;
}
