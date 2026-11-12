import { DIVISIONS, GAMES, type Division } from '@/data/draw';
import { gameResult, type SetScores } from './result';
import { rankWithTies } from './ranking';
import type { PoolStanding, ScoreRow, StandingRow, TiebreakRow } from './types';

/** 'spot:CA3' → 'CA' */
export const poolKeyOfSpot = (src: string) => src.slice(5, 7);

export function poolKeys(): { key: string; division: Division; pool: 'A' | 'B' | 'C' }[] {
  return (Object.keys(DIVISIONS) as Division[]).flatMap((division) =>
    DIVISIONS[division].pools.map((pool) => ({ key: `${division}${pool}`, division, pool })),
  );
}

/**
 * Pool tables. Only games marked final count (the sheet counts as soon as set 1 is entered;
 * counting only finals stops standings and placeholders flickering mid-game).
 */
export function computePools(
  scoresByCode: Record<string, ScoreRow | undefined>,
  tiebreaks: TiebreakRow[],
): Record<string, PoolStanding> {
  const out: Record<string, PoolStanding> = {};
  for (const { key, division, pool } of poolKeys()) {
    const games = GAMES.filter((g) => g.stage === 'pool' && poolKeyOfSpot(g.team1) === key);
    const stats = new Map<string, { id: string; played: number; wins: number; losses: number; pts: number; diff: number }>();
    for (let spot = 1; spot <= 4; spot++) {
      const id = `${key}${spot}`;
      stats.set(id, { id, played: 0, wins: 0, losses: 0, pts: 0, diff: 0 });
    }
    let gamesFinal = 0;
    for (const g of games) {
      const sc = scoresByCode[g.code];
      if (!sc || sc.status !== 'final') continue;
      const r = gameResult(sc as SetScores);
      if (!r.played) continue;
      gamesFinal++;
      const a = stats.get(g.team1.slice(5))!;
      const b = stats.get(g.team2.slice(5))!;
      a.played++;
      b.played++;
      if (r.aWins) {
        a.wins++;
        b.losses++;
      } else {
        b.wins++;
        a.losses++;
      }
      a.pts += r.ptsA;
      b.pts += r.ptsB;
      a.diff += r.rallyDiffA;
      b.diff -= r.rallyDiffA;
    }
    const tb = tiebreaks.find((t) => t.scope === `pool:${key}`)?.ordered_team_ids;
    const ranked = rankWithTies([...stats.values()], tb);
    const rows: StandingRow[] = ranked.map((r) => ({
      teamId: r.item.id,
      played: r.item.played,
      wins: r.item.wins,
      losses: r.item.losses,
      pts: r.item.pts,
      diff: r.item.diff,
      rank: r.rank,
      tied: r.tied,
      tieResolved: r.tieResolved,
      position: r.position,
    }));
    const complete = gamesFinal === games.length;
    out[key] = {
      key,
      division,
      pool,
      rows,
      gamesTotal: games.length,
      gamesFinal,
      complete,
      needsTiebreak: complete && rows.some((r) => r.position === null),
    };
  }
  return out;
}
