import { describe, expect, it } from 'vitest';
import { DEFAULT_TEAMS, GAMES } from '@/data/draw';
import { buildState } from './state';
import type { RawData, ScoreRow, TiebreakRow } from './types';

const spotOf = (src: string) => Number(src.slice(-1));

/**
 * Fill every pool game: the lower spot number always wins 2–0, by a margin that depends on the pool
 * so cross-pool seeding is decided by rally diff (CA by 10 a set, CB by 7, CC by 5; others by 5).
 */
function poolScores(overrides: Record<string, Partial<ScoreRow>> = {}): ScoreRow[] {
  const margin: Record<string, number> = { CA: 10, CB: 7, CC: 5 };
  return GAMES.filter((g) => g.stage === 'pool').map((g) => {
    const m = margin[g.team1.slice(5, 7)] ?? 5;
    const t1Wins = spotOf(g.team1) < spotOf(g.team2);
    const w = 25;
    const l = 25 - m;
    const row: ScoreRow = {
      game_code: g.code,
      status: 'final',
      s1a: t1Wins ? w : l,
      s1b: t1Wins ? l : w,
      s2a: t1Wins ? w : l,
      s2b: t1Wins ? l : w,
      s3a: null,
      s3b: null,
    };
    return { ...row, ...overrides[g.code] };
  });
}

const win1: Partial<ScoreRow> = { status: 'final', s1a: 25, s1b: 20, s2a: 25, s2b: 20, s3a: null, s3b: null };
const win2: Partial<ScoreRow> = { status: 'final', s1a: 20, s1b: 25, s2a: 20, s2b: 25, s3a: null, s3b: null };

function raw(scores: ScoreRow[], tiebreaks: TiebreakRow[] = []): RawData {
  return { teams: DEFAULT_TEAMS, scores, overrides: [], tiebreaks };
}

describe('pool standings', () => {
  it('ranks by wins, then points, then diff; complete once all games final', () => {
    const st = buildState(raw(poolScores()));
    const ca = st.pools.CA;
    expect(ca.complete).toBe(true);
    expect(ca.rows.map((r) => r.teamId)).toEqual(['CA1', 'CA2', 'CA3', 'CA4']);
    expect(ca.rows[0]).toMatchObject({ wins: 3, losses: 0, pts: 9, diff: 60, position: 1 });
    expect(ca.rows[3]).toMatchObject({ wins: 0, pts: 0, diff: -60, position: 4 });
  });

  it('only final games count', () => {
    const scores = poolScores({ W1: { status: 'in_progress' } });
    const st = buildState(raw(scores));
    expect(st.pools.WA.complete).toBe(false);
    expect(st.pools.WA.gamesFinal).toBe(5);
  });

  it('comp pool C is not complete until the Sunday 8am games', () => {
    const scores = poolScores().filter((s) => s.game_code !== 'C17' && s.game_code !== 'C18');
    const st = buildState(raw(scores));
    expect(st.pools.CC.complete).toBe(false);
    expect(st.seeding.poolsComplete).toBe(false);
    expect(st.gamesByCode.C19.t1.label).toBe('Best pool winner');
    expect(st.gamesByCode.C19.t1.source).toBe('Seed 1');
  });

  it('flags an exact three-way tie and waits for the organiser', () => {
    // Women Pool A: 1 beats 2, 2 beats 3, 3 beats 1 (same margins), all beat 4 → 1, 2, 3 identical.
    // Pool games: W1 1v2, W2 3v4, W5 1v3, W7 2v4, W9 1v4, W11 2v3
    const scores = poolScores({ W1: win1, W11: win1, W5: win2 });
    const st = buildState(raw(scores));
    const wa = st.pools.WA;
    expect(wa.needsTiebreak).toBe(true);
    expect(wa.rows.filter((r) => r.position === null).map((r) => r.teamId).sort()).toEqual(['WA1', 'WA2', 'WA3']);
    expect(wa.rows.find((r) => r.teamId === 'WA4')!.position).toBe(4);
    expect(st.tieIssues.map((t) => t.scope)).toContain('pool:WA');
    // Pool A 1st unresolved; Pool A 4th still resolves
    expect(st.gamesByCode.W15.t1.teamId).toBeNull();
    expect(st.gamesByCode.W15.t1.label).toBe('Pool A winner');
    expect(st.gamesByCode.W14.t2.teamId).toBe('WA4');

    // Organiser decides WA2, WA3, WA1
    const st2 = buildState(raw(scores, [{ scope: 'pool:WA', ordered_team_ids: ['WA2', 'WA3', 'WA1'] }]));
    expect(st2.pools.WA.needsTiebreak).toBe(false);
    expect(st2.gamesByCode.W15.t1.teamId).toBe('WA2'); // Pool A 1st
    expect(st2.gamesByCode.W16.t2.teamId).toBe('WA3'); // Pool A 2nd
    expect(st2.gamesByCode.W13.t1.teamId).toBe('WA1'); // Pool A 3rd
  });
});

describe('comp seeding', () => {
  it('seeds pool winners 1–3, then 2nds, 3rds, 4ths, ranked across pools', () => {
    const st = buildState(raw(poolScores()));
    expect(st.seeding.ready).toBe(true);
    const ids = st.seeding.rows.map((r) => r.teamId);
    // place 1: CA1 (+60) CB1 (+42) CC1 (+30); place 2: CA2 (+20) CB2 (+14) CC2 (+10)
    // place 3: CC3 (-10) CB3 (-14) CA3 (-20); place 4: CC4 (-30) CB4 (-42) CA4 (-60)
    expect(ids).toEqual(['CA1', 'CB1', 'CC1', 'CA2', 'CB2', 'CC2', 'CC3', 'CB3', 'CA3', 'CC4', 'CB4', 'CA4']);
    expect(st.gamesByCode.C19.t1.teamId).toBe('CA1'); // Seed 1
    expect(st.gamesByCode.C19.t2.teamId).toBe('CB3'); // Seed 8
    expect(st.gamesByCode.C22.t1.teamId).toBe('CA2'); // Seed 4
    expect(st.gamesByCode.C23.t2.teamId).toBe('CA4'); // Seed 12
    expect(st.gamesByCode.C19.dutySlot.teamId).toBe('CA3'); // Seed 9 on duty
  });

  it('cross-pool exact tie waits for a tiebreak', () => {
    // Make CA margins match CB (7) so CA1/CB1, CA2/CB2 … are identical
    const scores = poolScores().map((s) => {
      const g = GAMES.find((x) => x.code === s.game_code)!;
      if (!g.team1.startsWith('spot:CA')) return s;
      const t1Wins = spotOf(g.team1) < spotOf(g.team2);
      return { ...s, s1a: t1Wins ? 25 : 18, s1b: t1Wins ? 18 : 25, s2a: t1Wins ? 25 : 18, s2b: t1Wins ? 18 : 25 };
    });
    const st = buildState(raw(scores));
    expect(st.seeding.ready).toBe(false);
    expect(st.seeding.needsTiebreak.map((n) => n.place)).toEqual([1, 2, 3, 4]);
    expect(st.gamesByCode.C19.t1.teamId).toBeNull(); // Seed 1 tied CA1/CB1
    expect(st.gamesByCode.C21.t1.teamId).toBe('CC1'); // Seed 3 is clear

    const st2 = buildState(raw(scores, [{ scope: 'seeds:place1', ordered_team_ids: ['CB1', 'CA1'] }]));
    expect(st2.gamesByCode.C19.t1.teamId).toBe('CB1');
    expect(st2.gamesByCode.C20.t1.teamId).toBe('CA1');
  });
});

describe('playoff placeholders', () => {
  it('Winner/Loser chains resolve once games are final', () => {
    const scores = [
      ...poolScores(),
      { game_code: 'W13', ...win2 } as ScoreRow, // Pool A 3rd (WA3) v Pool B 4th (WB4) → WB4 wins
      { game_code: 'W14', ...win1 } as ScoreRow, // Pool B 3rd (WB3) v Pool A 4th (WA4) → WB3 wins
    ];
    const st = buildState(raw(scores));
    expect(st.gamesByCode.W17.t1.teamId).toBe('WA3'); // Loser W13
    expect(st.gamesByCode.W17.t2.teamId).toBe('WA4'); // Loser W14
    expect(st.gamesByCode.W18.t1.teamId).toBe('WB4'); // Winner W13
    expect(st.gamesByCode.W18.t2.teamId).toBe('WB3'); // Winner W14
    expect(st.gamesByCode.W15.dutySlot.teamId).toBe('WA3'); // Loser W13 on duty
    expect(st.gamesByCode.W20.t1.label).toBe('Winner of W15 (WFA women’s v TVC Lakers)');
  });

  it('in-progress games do not resolve placeholders', () => {
    const scores = [...poolScores(), { game_code: 'C19', ...win1, status: 'in_progress' } as ScoreRow];
    const st = buildState(raw(scores));
    expect(st.gamesByCode.C25.t1.teamId).toBeNull();
  });

  it('manual override wins over the resolved team', () => {
    const st = buildState({ ...raw(poolScores()), overrides: [{ game_code: 'C19', slot: 'team2', team_id: 'CC3' }] });
    expect(st.gamesByCode.C19.t2.teamId).toBe('CC3');
    expect(st.gamesByCode.C19.t2.overridden).toBe(true);
  });

  it('comp quarter-final → semi → final chain', () => {
    const scores = [
      ...poolScores(),
      { game_code: 'C19', ...win2 } as ScoreRow, // CB3 upsets CA1
      { game_code: 'C22', ...win1 } as ScoreRow, // CA2 beats CB2
      { game_code: 'C25', ...win1 } as ScoreRow, // CB3 beats CA2
    ];
    const st = buildState(raw(scores));
    expect(st.gamesByCode.C25.t1.teamId).toBe('CB3');
    expect(st.gamesByCode.C25.t2.teamId).toBe('CA2');
    expect(st.gamesByCode.C27.t1.teamId).toBe('CA1'); // Loser C19
    expect(st.gamesByCode.C31.t1.teamId).toBe('CB3'); // Winner C25
    expect(st.gamesByCode.C32.t1.teamId).toBe('CA2'); // Loser C25
  });
});

describe('final placings', () => {
  it('comp 9th–12th shared when optional games are not played, separate when they are', () => {
    const base = [
      ...poolScores(),
      { game_code: 'C23', ...win1 } as ScoreRow, // Seed 9 CA3 beats Seed 12 CA4
      { game_code: 'C24', ...win2 } as ScoreRow, // Seed 11 CB4 beats Seed 10 CC4
    ];
    const c = buildState(raw(base)).placings.C;
    const ninth = c.filter((p) => p.place === '9th=').map((p) => p.teamId);
    const eleventh = c.filter((p) => p.place === '11th=').map((p) => p.teamId);
    expect(ninth).toEqual(['CA3', 'CB4']);
    expect(eleventh).toEqual(['CA4', 'CC4']);

    const played = buildState(raw([...base, { game_code: 'C33', ...win2 } as ScoreRow])).placings.C;
    expect(played.find((p) => p.place === '9th')!.teamId).toBe('CB4');
    expect(played.find((p) => p.place === '10th')!.teamId).toBe('CA3');
    expect(played.filter((p) => p.place === '11th=')).toHaveLength(2);
  });

  it('women final placings come from W17–W20', () => {
    const scores = [
      ...poolScores(),
      ...['W13', 'W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20'].map((code) => ({ game_code: code, ...win1 }) as ScoreRow),
    ];
    const w = buildState(raw(scores)).placings.W;
    // W15: Pool A 1st (WA1) v Pool B 2nd (WB2) → WA1; W16: Pool B 1st (WB1) v Pool A 2nd (WA2) → WB1
    expect(w[0]).toEqual({ place: '1st', teamId: 'WA1' });
    expect(w[1]).toEqual({ place: '2nd', teamId: 'WB1' });
    expect(w[2]).toEqual({ place: '3rd', teamId: 'WB2' });
    expect(w.every((p) => p.teamId)).toBe(true);
  });
});

describe('draw data', () => {
  it('has 74 games, 28 teams, unique codes and no court clashes', () => {
    expect(GAMES).toHaveLength(74);
    expect(DEFAULT_TEAMS).toHaveLength(28);
    expect(new Set(GAMES.map((g) => g.code)).size).toBe(74);
    expect(new Set(GAMES.map((g) => `${g.day}${g.time}${g.court}`)).size).toBe(74);
  });

  it('every pool team plays 3 pool games', () => {
    const counts: Record<string, number> = {};
    for (const g of GAMES.filter((x) => x.stage === 'pool')) {
      for (const t of [g.team1, g.team2]) counts[t] = (counts[t] ?? 0) + 1;
    }
    expect(Object.keys(counts)).toHaveLength(28);
    expect(Object.values(counts).every((c) => c === 3)).toBe(true);
  });
});
