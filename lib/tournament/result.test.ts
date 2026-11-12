import { describe, expect, it } from 'vitest';
import { gameResult, type SetScores } from './result';

const s = (a: (number | null)[]): SetScores => ({ s1a: a[0], s1b: a[1], s2a: a[2], s2b: a[3], s3a: a[4] ?? null, s3b: a[5] ?? null });

describe('gameResult (Calc sheet port)', () => {
  it('not played until set 1 has both scores', () => {
    expect(gameResult(s([null, null, null, null])).played).toBe(false);
    expect(gameResult(s([25, null, null, null])).played).toBe(false);
    const r = gameResult(s([null, null, null, null]));
    expect([r.ptsA, r.ptsB]).toEqual([0, 0]);
  });

  it('straight-set win: 3 points to 0', () => {
    const r = gameResult(s([25, 20, 25, 18]));
    expect(r).toMatchObject({ played: true, setsA: 2, setsB: 0, aWins: true, rallyDiffA: 12, ptsA: 3, ptsB: 0 });
  });

  it('straight-set win for team 2', () => {
    const r = gameResult(s([15, 25, 23, 25]));
    expect(r).toMatchObject({ aWins: false, rallyDiffA: -12, ptsA: 0, ptsB: 3 });
  });

  it('three-set win: loser gets 1 point; set 3 counts for diff', () => {
    const r = gameResult(s([25, 20, 18, 25, 15, 10]));
    expect(r).toMatchObject({ setsA: 1, setsB: 1, set3Played: true, aWins: true, ptsA: 3, ptsB: 1 });
    expect(r.rallyDiffA).toBe(5 - 7 + 5);
  });

  it('three-set win for team 2', () => {
    const r = gameResult(s([25, 20, 18, 25, 13, 15]));
    expect(r).toMatchObject({ aWins: false, ptsA: 1, ptsB: 3, rallyDiffA: 5 - 7 - 2 });
  });

  it('time out in set 2: total points across sets 1+2 decide, no set 3', () => {
    // A wins set 1 25-20; set 2 cut short 14-18 → A 39 v B 38
    const r = gameResult(s([25, 20, 14, 18]));
    expect(r).toMatchObject({ setsA: 1, setsB: 1, set3Played: false, aWins: true, ptsA: 3, ptsB: 1, rallyDiffA: 1 });
  });

  it('time out in set 2 – team 2 ahead on total points', () => {
    const r = gameResult(s([25, 23, 10, 20]));
    expect(r).toMatchObject({ aWins: false, ptsA: 1, ptsB: 3, rallyDiffA: -8 });
  });

  it('time out mid set 2 with team 1 still a set up: 2nd set score counts but team 1 only won 1 set', () => {
    // set 2 incomplete 12-10 to A → A counted as winning set 2 (score compare), same as the sheet
    const r = gameResult(s([25, 20, 12, 10]));
    expect(r).toMatchObject({ setsA: 2, aWins: true, ptsA: 3, ptsB: 0, rallyDiffA: 7 });
  });

  it('third set played after a 2–0 result does not count for diff or the result', () => {
    const r = gameResult(s([25, 20, 25, 20, 5, 15]));
    expect(r).toMatchObject({ aWins: true, ptsA: 3, ptsB: 0, rallyDiffA: 10 });
  });

  it('set 3 with only one score entered is not played', () => {
    const r = gameResult(s([25, 20, 20, 25, 10, null]));
    expect(r.set3Played).toBe(false);
    // falls back to total points: 45 v 45 level → set 1 winner (team 1)
    expect(r.aWins).toBe(true);
  });

  it('time out in set 2 with level totals and no extra point: set 1 winner wins (team 1)', () => {
    // A wins set 1 25-20; set 2 at buzzer 15-20 → 40 v 40
    const r = gameResult(s([25, 20, 15, 20]));
    expect(r).toMatchObject({ setsA: 1, setsB: 1, aWins: true, ptsA: 3, ptsB: 1, rallyDiffA: 0 });
  });

  it('time out in set 2 with level totals and no extra point: set 1 winner wins (team 2)', () => {
    // B wins set 1 25-22; set 2 at buzzer 18-15 → 40 v 40
    const r = gameResult(s([22, 25, 18, 15]));
    expect(r).toMatchObject({ setsA: 1, setsB: 1, aWins: false, ptsA: 1, ptsB: 3, rallyDiffA: 0 });
  });

  it('extra point played after level totals is entered in set 2 and decides it', () => {
    // as above, but team 2 wins the extra point: set 2 recorded 15-21 → 40 v 41
    const r = gameResult(s([25, 20, 15, 21]));
    expect(r).toMatchObject({ aWins: false, ptsA: 1, ptsB: 3, rallyDiffA: -1 });
  });
});
