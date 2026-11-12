// Ranking with organiser tie-breaks.
// Order: most wins, then competition points, then rally +/- (Calc sheet columns AE / AO).
// Exactly tied teams are NOT separated automatically (the spreadsheet falls back to spot order;
// CLAUDE.md says the organiser decides). A tie group gets a position only when TVC has saved
// an order for it (a tiebreak covering every team in the group).

export interface RankStats {
  id: string;
  wins: number;
  pts: number;
  diff: number;
}

export interface Ranked<T extends RankStats> {
  item: T;
  /** 1 + number of teams with strictly better stats (ties share a rank, like the sheet's "2=") */
  rank: number;
  /** another team in the group has identical wins, points and diff */
  tied: boolean;
  /** tie settled by a TVC tiebreak order */
  tieResolved: boolean;
  /** unique 1-based position, or null while an exact tie is unresolved */
  position: number | null;
}

const better = (a: RankStats, b: RankStats) => b.wins - a.wins || b.pts - a.pts || b.diff - a.diff;
const same = (a: RankStats, b: RankStats) => a.wins === b.wins && a.pts === b.pts && a.diff === b.diff;

export function rankWithTies<T extends RankStats>(items: T[], tiebreakOrder?: string[]): Ranked<T>[] {
  const sorted = [...items].sort((a, b) => better(a, b) || a.id.localeCompare(b.id));
  const out: Ranked<T>[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && same(sorted[i], sorted[j])) j++;
    const group = sorted.slice(i, j);
    const rank = i + 1;
    if (group.length === 1) {
      out.push({ item: group[0], rank, tied: false, tieResolved: false, position: rank });
    } else {
      const order = tiebreakOrder ?? [];
      const covered = group.every((g) => order.includes(g.id));
      const ordered = covered ? [...group].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)) : group;
      ordered.forEach((g, k) =>
        out.push({ item: g, rank, tied: true, tieResolved: covered, position: covered ? rank + k : null }),
      );
    }
    i = j;
  }
  return out;
}
