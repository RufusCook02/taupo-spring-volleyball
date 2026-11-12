// Comp playoff seeding – Calc sheet columns AH–AQ.
// Pool winners are seeds 1–3, 2nd places 4–6, 3rd places 7–9, 4th places 10–12.
// Within each place group: wins, then comp points, then rally +/-. Exact ties wait for TVC.
import { rankWithTies } from './ranking';
import type { PoolStanding, SeedRow, Seeding, TiebreakRow } from './types';

export const COMP_POOLS = ['CA', 'CB', 'CC'];

export function computeSeeding(pools: Record<string, PoolStanding>, tiebreaks: TiebreakRow[]): Seeding {
  const allComplete = COMP_POOLS.every((k) => pools[k].complete && !pools[k].needsTiebreak);
  const rows: SeedRow[] = [];
  const needsTiebreak: Seeding['needsTiebreak'] = [];

  for (let place = 1; place <= 4; place++) {
    // Team at this place in each pool. Before pools finish, use the current table order so a provisional
    // seeding can be shown; it only counts as ready when every pool is complete.
    const candidates = COMP_POOLS.map((k) => {
      const row = pools[k].rows.find((r) => r.position === place) ?? (allComplete ? undefined : pools[k].rows[place - 1]);
      return row ? { id: row.teamId, wins: row.wins, pts: row.pts, diff: row.diff, poolKey: k } : null;
    });
    const present = candidates.filter((c): c is NonNullable<typeof c> => c !== null);
    const tb = tiebreaks.find((t) => t.scope === `seeds:place${place}`)?.ordered_team_ids;
    const ranked = rankWithTies(present, tb);
    const unresolved = ranked.filter((r) => r.position === null).map((r) => r.item.id);
    if (allComplete && unresolved.length) needsTiebreak.push({ place, teamIds: unresolved });

    for (let k = 0; k < 3; k++) {
      const r = ranked[k];
      rows.push({
        seed: 3 * (place - 1) + k + 1,
        teamId: r && (r.position !== null || !allComplete) ? r.item.id : null,
        place,
        poolKey: r?.item.poolKey ?? null,
        wins: r?.item.wins ?? 0,
        pts: r?.item.pts ?? 0,
        diff: r?.item.diff ?? 0,
        tied: r?.tied ?? false,
        tieResolved: r?.tieResolved ?? false,
      });
    }
  }

  const ready = allComplete && needsTiebreak.length === 0 && rows.every((r) => r.teamId !== null);
  return { poolsComplete: allComplete, ready, rows, needsTiebreak };
}
