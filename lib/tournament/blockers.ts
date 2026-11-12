// What has to happen before a game's teams are known: which games must be marked Final, and which ties decided.
import { GAMES } from '@/data/draw';
import { COMP_POOLS } from './seeds';
import { poolKeyOfSpot } from './standings';
import type { ResolvedGame, Slot, TournamentState } from './types';

export interface Blockers {
  /** game codes that must be marked Final, in draw order */
  games: string[];
  /** tie scopes waiting on an organiser decision, e.g. 'pool:WA' */
  ties: string[];
}

const poolGameCodes = (poolKey: string) =>
  GAMES.filter((g) => g.stage === 'pool' && poolKeyOfSpot(g.team1) === poolKey).map((g) => g.code);

export function blockersFor(state: TournamentState, code: string, slots: Slot[] = ['team1', 'team2']): Blockers {
  const games = new Set<string>();
  const ties = new Set<string>();
  const visited = new Set<string>();

  const unfinished = (c: string) => state.gamesByCode[c]?.status !== 'final';

  function visit(c: string) {
    if (visited.has(c)) return;
    visited.add(c);
    const g = state.gamesByCode[c];
    if (!g) return;
    for (const slot of slots) {
      const s = slot === 'team1' ? g.t1 : slot === 'team2' ? g.t2 : g.dutySlot;
      if (s.teamId || s.source === 'TVC') continue;
      addForSource(s.source, g);
    }
  }

  function addForSource(src: string, g: ResolvedGame) {
    let m = /^Pool ([ABC]) /.exec(src);
    if (m) {
      const key = `${g.division}${m[1]}`;
      const pool = state.pools[key];
      poolGameCodes(key).filter(unfinished).forEach((c) => games.add(c));
      if (pool?.needsTiebreak) ties.add(`pool:${key}`);
      return;
    }
    if (/^Seed \d+$/.test(src)) {
      for (const key of COMP_POOLS) {
        poolGameCodes(key).filter(unfinished).forEach((c) => games.add(c));
        if (state.pools[key].needsTiebreak) ties.add(`pool:${key}`);
      }
      state.seeding.needsTiebreak.forEach((t) => ties.add(`seeds:place${t.place}`));
      return;
    }
    m = /^(?:Winner|Loser) (\w+)$/.exec(src);
    if (m) {
      const dep = m[1];
      if (unfinished(dep)) games.add(dep);
      visit(dep); // its own teams may not be known yet either (only team slots matter there)
    }
  }

  visit(code);
  const order = (c: string) => state.gamesByCode[c]?.sort ?? 0;
  return { games: [...games].sort((a, b) => order(a) - order(b)), ties: [...ties] };
}
