// Game result – a direct port of the hidden Calc sheet formulas (columns L–V).
//   L  played       = set 1 has both scores
//   M/N sets A/B    = sets won among sets 1–2
//   O  set 3 played = set 3 has both scores
//   P  A wins       = 2 sets → that team; else set 3 winner if played; else sets 1+2 total points (time-out rule).
//                     TVC rule (not in the sheet): if sets 1+2 totals are level – the extra point wasn't played or
//                     wasn't recorded – the set 1 winner wins. If the extra point was played, add it to the set 2 score.
//   Q  rally diff A = sets 1+2 diff, plus set 3 diff only when sets 1–2 were split and set 3 was played
//   T/U points      = win 3; loss with 1 of first 2 sets 1; straight-set loss 0

export interface SetScores {
  s1a: number | null;
  s1b: number | null;
  s2a: number | null;
  s2b: number | null;
  s3a: number | null;
  s3b: number | null;
}

export interface GameResult {
  played: boolean;
  setsA: number; // sets 1–2 won by team 1
  setsB: number;
  set3Played: boolean;
  aWins: boolean;
  rallyDiffA: number;
  ptsA: number;
  ptsB: number;
}

const n = (x: number | null | undefined) => x ?? 0;

export function gameResult(s: SetScores): GameResult {
  const played = s.s1a != null && s.s1b != null;
  const setsA = (n(s.s1a) > n(s.s1b) ? 1 : 0) + (n(s.s2a) > n(s.s2b) ? 1 : 0);
  const setsB = (n(s.s1b) > n(s.s1a) ? 1 : 0) + (n(s.s2b) > n(s.s2a) ? 1 : 0);
  const set3Played = s.s3a != null && s.s3b != null;

  let aWins: boolean;
  if (setsA === 2) aWins = true;
  else if (setsB === 2) aWins = false;
  else if (set3Played) aWins = n(s.s3a) > n(s.s3b);
  else {
    const totalA = n(s.s1a) + n(s.s2a);
    const totalB = n(s.s1b) + n(s.s2b);
    aWins = totalA !== totalB ? totalA > totalB : n(s.s1a) > n(s.s1b);
  }

  const rallyDiffA =
    n(s.s1a) + n(s.s2a) - n(s.s1b) - n(s.s2b) + (setsA < 2 && setsB < 2 && set3Played ? n(s.s3a) - n(s.s3b) : 0);

  const ptsA = played ? (aWins ? 3 : setsA >= 1 ? 1 : 0) : 0;
  const ptsB = played ? (!aWins ? 3 : setsB >= 1 ? 1 : 0) : 0;

  return { played, setsA, setsB, set3Played, aWins, rallyDiffA, ptsA, ptsB };
}

export const EMPTY_SCORES: SetScores = { s1a: null, s1b: null, s2a: null, s2b: null, s3a: null, s3b: null };

export function hasAnyScore(s: SetScores): boolean {
  return Object.values(s).some((v) => v != null);
}
