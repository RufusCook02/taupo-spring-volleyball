import { DIVISIONS, GAMES, type Division, type GameDef, type TeamDef } from '@/data/draw';
import { EMPTY_SCORES, gameResult, type SetScores } from './result';
import { computePools } from './standings';
import { computeSeeding } from './seeds';
import type {
  OverrideRow,
  Placing,
  PoolStanding,
  RawData,
  ResolvedGame,
  ResolvedSlot,
  ScoreRow,
  Seeding,
  Slot,
  TieIssue,
  TournamentState,
} from './types';

const ORDINAL: Record<string, number> = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4 };

export function buildState(raw: RawData): TournamentState {
  const teamsById: Record<string, TeamDef> = Object.fromEntries(raw.teams.map((t) => [t.id, t]));
  const scoresByCode: Record<string, ScoreRow | undefined> = Object.fromEntries(raw.scores.map((s) => [s.game_code, s]));
  const overrides = new Map<string, OverrideRow>(raw.overrides.map((o) => [`${o.game_code}:${o.slot}`, o]));
  const defsByCode: Record<string, GameDef> = Object.fromEntries(GAMES.map((g) => [g.code, g]));

  const pools = computePools(scoresByCode, raw.tiebreaks);
  const seeding = computeSeeding(pools, raw.tiebreaks);

  const name = (id: string | null) => (id && teamsById[id]?.name) || id || '';

  // ---- placeholder resolution (memoised; Winner/Loser chains recurse into earlier games) ----
  const slotCache = new Map<string, string | null>();
  const resolving = new Set<string>();

  function finalResult(code: string) {
    const sc = scoresByCode[code];
    if (!sc || sc.status !== 'final') return null;
    const r = gameResult(sc);
    return r.played ? r : null;
  }

  function resolveSource(src: string, division: Division): string | null {
    if (src === 'TVC' || src === '') return null;
    if (src.startsWith('spot:')) return src.slice(5);

    let m = /^Pool ([ABC]) (1st|2nd|3rd|4th)$/.exec(src);
    if (m) {
      const pool: PoolStanding | undefined = pools[`${division}${m[1]}`];
      if (!pool || !pool.complete) return null;
      return pool.rows.find((r) => r.position === ORDINAL[m![2]])?.teamId ?? null;
    }

    m = /^Seed (\d+)$/.exec(src);
    if (m) {
      if (!seeding.poolsComplete) return null;
      return seeding.rows.find((r) => r.seed === Number(m![1]))?.teamId ?? null;
    }

    m = /^(Winner|Loser) (\w+)$/.exec(src);
    if (m) {
      const code = m[2];
      const r = finalResult(code);
      if (!r) return null;
      const t1 = resolveSlotId(code, 'team1');
      const t2 = resolveSlotId(code, 'team2');
      const wantWinner = m[1] === 'Winner';
      return wantWinner === r.aWins ? t1 : t2;
    }
    return null;
  }

  function resolveSlotId(code: string, slot: Slot): string | null {
    const key = `${code}:${slot}`;
    if (slotCache.has(key)) return slotCache.get(key)!;
    const ov = overrides.get(key);
    if (ov && teamsById[ov.team_id]) {
      slotCache.set(key, ov.team_id);
      return ov.team_id;
    }
    if (resolving.has(key)) return null; // defensive: no cycles in the draw, but never loop
    resolving.add(key);
    const def = defsByCode[code];
    const src = slot === 'team1' ? def.team1 : slot === 'team2' ? def.team2 : def.duty;
    const id = resolveSource(src, def.division);
    resolving.delete(key);
    slotCache.set(key, id);
    return id;
  }

  function slotInfo(def: GameDef, slot: Slot): ResolvedSlot {
    const source = slot === 'team1' ? def.team1 : slot === 'team2' ? def.team2 : def.duty;
    const teamId = resolveSlotId(def.code, slot);
    const teamsOf = (code: string): [string | null, string | null] => {
      const a = resolveSlotId(code, 'team1');
      const b = resolveSlotId(code, 'team2');
      return [a ? name(a) : null, b ? name(b) : null];
    };
    return {
      teamId,
      label: teamId ? name(teamId) : describeSource(source, teamsOf),
      source,
      overridden: overrides.has(`${def.code}:${slot}`),
    };
  }

  const games: ResolvedGame[] = GAMES.map((def) => {
    const sc = scoresByCode[def.code];
    const scores: SetScores = sc
      ? { s1a: sc.s1a, s1b: sc.s1b, s2a: sc.s2a, s2b: sc.s2b, s3a: sc.s3a, s3b: sc.s3b }
      : { ...EMPTY_SCORES };
    const r = gameResult(scores);
    const status = sc?.status ?? 'scheduled';
    return {
      ...def,
      t1: slotInfo(def, 'team1'),
      t2: slotInfo(def, 'team2'),
      dutySlot: slotInfo(def, 'duty'),
      scores,
      status,
      result: r.played ? r : null,
      winner: status === 'final' && r.played ? (r.aWins ? 1 : 2) : null,
      updatedAt: sc?.updated_at ?? null,
    };
  });
  const gamesByCode = Object.fromEntries(games.map((g) => [g.code, g]));

  return {
    teams: raw.teams,
    teamsById,
    games,
    gamesByCode,
    pools,
    seeding,
    placings: computePlacings(gamesByCode),
    tieIssues: tieIssues(pools, seeding),
    announcement: raw.announcement?.trim() || null,
  };
}

// ---- plain-English placeholder labels ----

const SEED_LABELS = [
  'Best pool winner',
  '2nd-best pool winner',
  '3rd-best pool winner',
  'Best 2nd place',
  '2nd-best 2nd place',
  '3rd-best 2nd place',
  'Best 3rd place',
  '2nd-best 3rd place',
  '3rd-best 3rd place',
  'Best 4th place',
  '2nd-best 4th place',
  '3rd-best 4th place',
];

/**
 * Label for a slot that isn't decided yet, e.g. 'Seed 1' → 'Best pool winner',
 * 'Winner C19' → 'Winner of C19 (Sharks v AC3)'. `teamsOf(code)` gives that game's team names if known.
 */
export function describeSource(src: string, teamsOf: (code: string) => [string | null, string | null]): string {
  if (src.startsWith('spot:')) return src.slice(5);
  let m = /^Pool ([ABC]) (1st|2nd|3rd|4th)$/.exec(src);
  if (m) return m[2] === '1st' ? `Pool ${m[1]} winner` : `Pool ${m[1]} ${m[2]} place`;
  m = /^Seed (\d+)$/.exec(src);
  if (m) return SEED_LABELS[Number(m[1]) - 1] ?? src;
  m = /^(Winner|Loser) (\w+)$/.exec(src);
  if (m) {
    const [a, b] = teamsOf(m[2]);
    return `${m[1]} of ${m[2]}${a && b ? ` (${a} v ${b})` : ''}`;
  }
  return src;
}

// ---- final placings ----

const FINALS: Record<Division, [string, number, number][]> = {
  W: [['W20', 1, 2], ['W19', 3, 4], ['W18', 5, 6], ['W17', 7, 8]],
  S: [['S20', 1, 2], ['S17', 3, 4], ['S19', 5, 6], ['S18', 7, 8]],
  C: [['C31', 1, 2], ['C32', 3, 4], ['C29', 5, 6], ['C30', 7, 8]],
};

const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

function sides(g: ResolvedGame | undefined) {
  if (!g || g.winner === null) return null;
  return g.winner === 1
    ? { w: g.t1.teamId, l: g.t2.teamId }
    : { w: g.t2.teamId, l: g.t1.teamId };
}

export function computePlacings(gamesByCode: Record<string, ResolvedGame>): Record<Division, Placing[]> {
  const out = {} as Record<Division, Placing[]>;
  for (const division of Object.keys(DIVISIONS) as Division[]) {
    const list: Placing[] = [];
    for (const [code, wp, lp] of FINALS[division]) {
      const s = sides(gamesByCode[code]);
      list.push({ place: ord(wp), teamId: s?.w ?? null });
      list.push({ place: ord(lp), teamId: s?.l ?? null });
    }
    if (division === 'C') {
      // 9th–12th: optional C33 / C34. If not played, C23/C24 winners share 9th and losers share 11th.
      const semiA = sides(gamesByCode['C23']);
      const semiB = sides(gamesByCode['C24']);
      for (const [code, top, key] of [['C33', 9, 'w'], ['C34', 11, 'l']] as const) {
        const s = sides(gamesByCode[code]);
        if (s) {
          list.push({ place: ord(top), teamId: s.w });
          list.push({ place: ord(top + 1), teamId: s.l });
        } else {
          const note = `Shared unless the optional ${ord(top)}/${ord(top + 1)} game is played`;
          list.push({ place: `${ord(top)}=`, teamId: semiA?.[key] ?? null, note });
          list.push({ place: `${ord(top)}=`, teamId: semiB?.[key] ?? null, note });
        }
      }
    }
    out[division] = list;
  }
  return out;
}

// ---- ties needing an organiser decision ----

function tieIssues(pools: Record<string, PoolStanding>, seeding: Seeding): TieIssue[] {
  const issues: TieIssue[] = [];
  for (const p of Object.values(pools)) {
    if (!p.needsTiebreak) continue;
    issues.push({
      scope: `pool:${p.key}`,
      title: `${DIVISIONS[p.division].name} Pool ${p.pool}`,
      teamIds: p.rows.filter((r) => r.position === null).map((r) => r.teamId),
    });
  }
  for (const { place, teamIds } of seeding.needsTiebreak) {
    issues.push({ scope: `seeds:place${place}`, title: `Comp seeding – pool ${ord(place)} places`, teamIds });
  }
  return issues;
}
