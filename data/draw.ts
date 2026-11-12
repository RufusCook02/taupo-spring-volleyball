// Draw for Taupō Spring Volleyball 2026.
// Generated from Taupo_Spring_Volleyball_2026.xlsx (Teams, Saturday and Sunday sheets).
// The draw is fixed, so it lives in code. Team names, scores and overrides live in the database.
//
// Team sources:
//   'spot:CA3'      – Comp Pool A, spot 3 (see DEFAULT_TEAMS / teams table)
//   'TVC'           – club referees (duty only)
//   'Pool A 3rd'    – place in the game's own division
//   'Seed 4'        – Comp playoff seed
//   'Winner C19'    – winner / loser of another game

export type Division = 'W' | 'S' | 'C';
export type Day = 'sat' | 'sun';
export type Stage = 'pool' | 'playoff';

export interface TeamDef {
  id: string; // e.g. 'CA3'
  division: Division;
  pool: 'A' | 'B' | 'C';
  spot: 1 | 2 | 3 | 4;
  name: string;
}

export interface GameDef {
  code: string;
  day: Day;
  time: string; // 24h local NZ time, 'HH:mm'
  court: 1 | 2 | 3 | 4;
  division: Division;
  stage: Stage;
  label: string;
  team1: string;
  team2: string;
  duty: string;
  optional: boolean;
  sort: number;
}

export const DIVISIONS: Record<Division, { name: string; slug: string; pools: ('A' | 'B' | 'C')[] }> = {
  W: { name: 'Women', slug: 'women', pools: ['A', 'B'] },
  S: { name: 'Social', slug: 'social', pools: ['A', 'B'] },
  C: { name: 'Competitive', slug: 'comp', pools: ['A', 'B', 'C'] },
};

export const DAYS: Record<Day, { date: string; label: string; short: string }> = {
  sat: { date: '2026-11-14', label: 'Saturday 14 November', short: 'Saturday' },
  sun: { date: '2026-11-15', label: 'Sunday 15 November', short: 'Sunday' },
};

export const COURTS = [1, 2, 3, 4] as const;

const T = (division: Division, pool: 'A' | 'B' | 'C', spot: 1 | 2 | 3 | 4, name: string): TeamDef => ({
  id: `${division}${pool}${spot}`,
  division,
  pool,
  spot,
  name,
});

// Names as on the Teams sheet. The database copy is what the site shows; these are the fallback and seed.
export const DEFAULT_TEAMS: TeamDef[] = [
  T('W', 'A', 1, 'WFA women’s'),
  T('W', 'A', 2, 'Pie Hards'),
  T('W', 'A', 3, 'Kiss my ace!'),
  T('W', 'A', 4, 'FilNZ Nation Select'),
  T('W', 'B', 1, 'Served Hot'),
  T('W', 'B', 2, 'TVC Lakers'),
  T('W', 'B', 3, 'Orcas'),
  T('W', 'B', 4, 'DA’Cubs - Pumas'),
  T('S', 'A', 1, 'BSB Players'),
  T('S', 'A', 2, 'Rebound'),
  T('S', 'A', 3, 'POLYHITTAHz'),
  T('S', 'A', 4, 'Easytrip Tauranga'),
  T('S', 'B', 1, 'Moonlight FC'),
  T('S', 'B', 2, 'Pine City 886'),
  T('S', 'B', 3, 'Meow Meow'),
  T('S', 'B', 4, 'WOOL'),
  T('C', 'A', 1, 'Auckland Knights'),
  T('C', 'A', 2, 'Flying Turtles'),
  T('C', 'A', 3, 'Just The Tip'),
  T('C', 'A', 4, 'Sharks'),
  T('C', 'B', 1, 'Sunbears'),
  T('C', 'B', 2, 'AC3'),
  T('C', 'B', 3, 'Toxiciteam'),
  T('C', 'B', 4, 'Brain Cells'),
  T('C', 'C', 1, 'Chinese Giants'),
  T('C', 'C', 2, 'bush was'),
  T('C', 'C', 3, 'Vipers'),
  T('C', 'C', 4, 'TNT Boys'),
];

export const GAMES: GameDef[] = [
  { code: 'W1', day: 'sat', time: '08:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool A', team1: 'spot:WA1', team2: 'spot:WA2', duty: 'spot:WB3', optional: false, sort: 1 },
  { code: 'W2', day: 'sat', time: '08:00', court: 2, division: 'W', stage: 'pool', label: 'Women Pool A', team1: 'spot:WA3', team2: 'spot:WA4', duty: 'spot:WB4', optional: false, sort: 2 },
  { code: 'W3', day: 'sat', time: '08:00', court: 3, division: 'W', stage: 'pool', label: 'Women Pool B', team1: 'spot:WB1', team2: 'spot:WB2', duty: 'TVC', optional: false, sort: 3 },
  { code: 'S1', day: 'sat', time: '08:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool B', team1: 'spot:SB1', team2: 'spot:SB4', duty: 'spot:SB2', optional: false, sort: 4 },
  { code: 'W4', day: 'sat', time: '09:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool B', team1: 'spot:WB3', team2: 'spot:WB4', duty: 'spot:WB1', optional: false, sort: 5 },
  { code: 'C1', day: 'sat', time: '09:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool A', team1: 'spot:CA1', team2: 'spot:CA3', duty: 'spot:CB1', optional: false, sort: 6 },
  { code: 'C2', day: 'sat', time: '09:00', court: 3, division: 'C', stage: 'pool', label: 'Comp Pool A', team1: 'spot:CA2', team2: 'spot:CA4', duty: 'spot:CB2', optional: false, sort: 7 },
  { code: 'S2', day: 'sat', time: '09:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool A', team1: 'spot:SA1', team2: 'spot:SA2', duty: 'spot:SB1', optional: false, sort: 8 },
  { code: 'W5', day: 'sat', time: '10:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool A', team1: 'spot:WA1', team2: 'spot:WA3', duty: 'spot:WB2', optional: false, sort: 9 },
  { code: 'C3', day: 'sat', time: '10:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool B', team1: 'spot:CB2', team2: 'spot:CB3', duty: 'spot:CA4', optional: false, sort: 10 },
  { code: 'C4', day: 'sat', time: '10:00', court: 3, division: 'C', stage: 'pool', label: 'Comp Pool B', team1: 'spot:CB1', team2: 'spot:CB4', duty: 'spot:CA1', optional: false, sort: 11 },
  { code: 'S3', day: 'sat', time: '10:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool B', team1: 'spot:SB2', team2: 'spot:SB4', duty: 'spot:SA2', optional: false, sort: 12 },
  { code: 'W6', day: 'sat', time: '11:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool B', team1: 'spot:WB1', team2: 'spot:WB3', duty: 'spot:WA3', optional: false, sort: 13 },
  { code: 'C5', day: 'sat', time: '11:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool A', team1: 'spot:CA3', team2: 'spot:CA4', duty: 'spot:CB3', optional: false, sort: 14 },
  { code: 'S4', day: 'sat', time: '11:00', court: 3, division: 'S', stage: 'pool', label: 'Social Pool A', team1: 'spot:SA1', team2: 'spot:SA3', duty: 'spot:SA4', optional: false, sort: 15 },
  { code: 'S5', day: 'sat', time: '11:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool B', team1: 'spot:SB1', team2: 'spot:SB3', duty: 'spot:SB4', optional: false, sort: 16 },
  { code: 'W7', day: 'sat', time: '12:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool A', team1: 'spot:WA2', team2: 'spot:WA4', duty: 'spot:WA1', optional: false, sort: 17 },
  { code: 'C6', day: 'sat', time: '12:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool B', team1: 'spot:CB2', team2: 'spot:CB4', duty: 'spot:CA3', optional: false, sort: 18 },
  { code: 'C7', day: 'sat', time: '12:00', court: 3, division: 'C', stage: 'pool', label: 'Comp Pool A', team1: 'spot:CA1', team2: 'spot:CA2', duty: 'spot:CC4', optional: false, sort: 19 },
  { code: 'S6', day: 'sat', time: '12:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool A', team1: 'spot:SA2', team2: 'spot:SA4', duty: 'spot:SA3', optional: false, sort: 20 },
  { code: 'W8', day: 'sat', time: '13:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool B', team1: 'spot:WB2', team2: 'spot:WB4', duty: 'spot:WA2', optional: false, sort: 21 },
  { code: 'C8', day: 'sat', time: '13:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool B', team1: 'spot:CB1', team2: 'spot:CB3', duty: 'spot:CC2', optional: false, sort: 22 },
  { code: 'C9', day: 'sat', time: '13:00', court: 3, division: 'C', stage: 'pool', label: 'Comp Pool C', team1: 'spot:CC3', team2: 'spot:CC4', duty: 'spot:CA2', optional: false, sort: 23 },
  { code: 'S7', day: 'sat', time: '13:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool B', team1: 'spot:SB1', team2: 'spot:SB2', duty: 'spot:SB3', optional: false, sort: 24 },
  { code: 'W9', day: 'sat', time: '14:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool A', team1: 'spot:WA1', team2: 'spot:WA4', duty: 'spot:WB3', optional: false, sort: 25 },
  { code: 'C10', day: 'sat', time: '14:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool C', team1: 'spot:CC1', team2: 'spot:CC2', duty: 'spot:CB1', optional: false, sort: 26 },
  { code: 'S8', day: 'sat', time: '14:00', court: 3, division: 'S', stage: 'pool', label: 'Social Pool B', team1: 'spot:SB3', team2: 'spot:SB4', duty: 'spot:SA2', optional: false, sort: 27 },
  { code: 'S9', day: 'sat', time: '14:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool A', team1: 'spot:SA1', team2: 'spot:SA4', duty: 'spot:SB2', optional: false, sort: 28 },
  { code: 'W10', day: 'sat', time: '15:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool B', team1: 'spot:WB1', team2: 'spot:WB4', duty: 'spot:WA4', optional: false, sort: 29 },
  { code: 'C11', day: 'sat', time: '15:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool A', team1: 'spot:CA2', team2: 'spot:CA3', duty: 'spot:CB2', optional: false, sort: 30 },
  { code: 'C12', day: 'sat', time: '15:00', court: 3, division: 'C', stage: 'pool', label: 'Comp Pool A', team1: 'spot:CA1', team2: 'spot:CA4', duty: 'spot:CC1', optional: false, sort: 31 },
  { code: 'S10', day: 'sat', time: '15:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool A', team1: 'spot:SA2', team2: 'spot:SA3', duty: 'spot:SA1', optional: false, sort: 32 },
  { code: 'W11', day: 'sat', time: '16:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool A', team1: 'spot:WA2', team2: 'spot:WA3', duty: 'spot:WB4', optional: false, sort: 33 },
  { code: 'C13', day: 'sat', time: '16:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool B', team1: 'spot:CB1', team2: 'spot:CB2', duty: 'spot:CC2', optional: false, sort: 34 },
  { code: 'C14', day: 'sat', time: '16:00', court: 3, division: 'C', stage: 'pool', label: 'Comp Pool B', team1: 'spot:CB3', team2: 'spot:CB4', duty: 'spot:CC3', optional: false, sort: 35 },
  { code: 'S11', day: 'sat', time: '16:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool B', team1: 'spot:SB2', team2: 'spot:SB3', duty: 'spot:SA3', optional: false, sort: 36 },
  { code: 'W12', day: 'sat', time: '17:00', court: 1, division: 'W', stage: 'pool', label: 'Women Pool B', team1: 'spot:WB2', team2: 'spot:WB3', duty: 'spot:WA4', optional: false, sort: 37 },
  { code: 'C15', day: 'sat', time: '17:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool C', team1: 'spot:CC2', team2: 'spot:CC4', duty: 'spot:CB3', optional: false, sort: 38 },
  { code: 'C16', day: 'sat', time: '17:00', court: 3, division: 'C', stage: 'pool', label: 'Comp Pool C', team1: 'spot:CC1', team2: 'spot:CC3', duty: 'spot:CB4', optional: false, sort: 39 },
  { code: 'S12', day: 'sat', time: '17:00', court: 4, division: 'S', stage: 'pool', label: 'Social Pool A', team1: 'spot:SA3', team2: 'spot:SA4', duty: 'spot:SB4', optional: false, sort: 40 },
  { code: 'W13', day: 'sun', time: '08:00', court: 1, division: 'W', stage: 'playoff', label: 'Women 5th–8th crossover', team1: 'Pool A 3rd', team2: 'Pool B 4th', duty: 'Pool A 2nd', optional: false, sort: 41 },
  { code: 'C17', day: 'sun', time: '08:00', court: 2, division: 'C', stage: 'pool', label: 'Comp Pool C', team1: 'spot:CC1', team2: 'spot:CC4', duty: 'spot:CA2', optional: false, sort: 42 },
  { code: 'C18', day: 'sun', time: '08:00', court: 3, division: 'C', stage: 'pool', label: 'Comp Pool C', team1: 'spot:CC2', team2: 'spot:CC3', duty: 'spot:CB4', optional: false, sort: 43 },
  { code: 'S15', day: 'sun', time: '08:00', court: 4, division: 'S', stage: 'playoff', label: 'Social 5th–8th crossover', team1: 'Pool A 3rd', team2: 'Pool B 4th', duty: 'Pool B 3rd', optional: false, sort: 44 },
  { code: 'W14', day: 'sun', time: '09:00', court: 1, division: 'W', stage: 'playoff', label: 'Women 5th–8th crossover', team1: 'Pool B 3rd', team2: 'Pool A 4th', duty: 'Pool B 2nd', optional: false, sort: 45 },
  { code: 'C19', day: 'sun', time: '09:00', court: 2, division: 'C', stage: 'playoff', label: 'Comp quarter-final', team1: 'Seed 1', team2: 'Seed 8', duty: 'Seed 9', optional: false, sort: 46 },
  { code: 'C20', day: 'sun', time: '09:00', court: 3, division: 'C', stage: 'playoff', label: 'Comp quarter-final', team1: 'Seed 2', team2: 'Seed 7', duty: 'Seed 10', optional: false, sort: 47 },
  { code: 'C21', day: 'sun', time: '09:00', court: 4, division: 'C', stage: 'playoff', label: 'Comp quarter-final', team1: 'Seed 3', team2: 'Seed 6', duty: 'Seed 11', optional: false, sort: 48 },
  { code: 'W15', day: 'sun', time: '10:00', court: 1, division: 'W', stage: 'playoff', label: 'Women Semi-final', team1: 'Pool A 1st', team2: 'Pool B 2nd', duty: 'Loser W13', optional: false, sort: 49 },
  { code: 'C22', day: 'sun', time: '10:00', court: 2, division: 'C', stage: 'playoff', label: 'Comp quarter-final', team1: 'Seed 4', team2: 'Seed 5', duty: 'Seed 12', optional: false, sort: 50 },
  { code: 'S13', day: 'sun', time: '10:00', court: 3, division: 'S', stage: 'playoff', label: 'Social semi-final', team1: 'Pool A 1st', team2: 'Pool B 2nd', duty: 'Pool A 3rd', optional: false, sort: 51 },
  { code: 'S14', day: 'sun', time: '10:00', court: 4, division: 'S', stage: 'playoff', label: 'Social semi-final', team1: 'Pool B 1st', team2: 'Pool A 2nd', duty: 'Pool B 3rd', optional: false, sort: 52 },
  { code: 'W16', day: 'sun', time: '11:00', court: 1, division: 'W', stage: 'playoff', label: 'Women Semi-final', team1: 'Pool B 1st', team2: 'Pool A 2nd', duty: 'Loser W14', optional: false, sort: 53 },
  { code: 'C23', day: 'sun', time: '11:00', court: 2, division: 'C', stage: 'playoff', label: 'Comp 9th–12th semi', team1: 'Seed 9', team2: 'Seed 12', duty: 'Loser C19', optional: false, sort: 54 },
  { code: 'C24', day: 'sun', time: '11:00', court: 3, division: 'C', stage: 'playoff', label: 'Comp 9th–12th semi', team1: 'Seed 10', team2: 'Seed 11', duty: 'Loser C20', optional: false, sort: 55 },
  { code: 'S16', day: 'sun', time: '11:00', court: 4, division: 'S', stage: 'playoff', label: 'Social 5th–8th crossover', team1: 'Pool B 3rd', team2: 'Pool A 4th', duty: 'Loser S14', optional: false, sort: 56 },
  { code: 'W17', day: 'sun', time: '12:00', court: 1, division: 'W', stage: 'playoff', label: 'Women 7th/8th', team1: 'Loser W13', team2: 'Loser W14', duty: 'Winner W13', optional: false, sort: 57 },
  { code: 'C25', day: 'sun', time: '12:00', court: 2, division: 'C', stage: 'playoff', label: 'Comp semi-final', team1: 'Winner C19', team2: 'Winner C22', duty: 'Loser C21', optional: false, sort: 58 },
  { code: 'C26', day: 'sun', time: '12:00', court: 3, division: 'C', stage: 'playoff', label: 'Comp semi-final', team1: 'Winner C20', team2: 'Winner C21', duty: 'Loser C22', optional: false, sort: 59 },
  { code: 'S17', day: 'sun', time: '12:00', court: 4, division: 'S', stage: 'playoff', label: 'Social 3rd/4th', team1: 'Loser S13', team2: 'Loser S14', duty: 'Pool B 4th', optional: false, sort: 60 },
  { code: 'W18', day: 'sun', time: '13:00', court: 1, division: 'W', stage: 'playoff', label: 'Women 5th/6th', team1: 'Winner W13', team2: 'Winner W14', duty: 'Loser W15', optional: false, sort: 61 },
  { code: 'C27', day: 'sun', time: '13:00', court: 2, division: 'C', stage: 'playoff', label: 'Comp 5th–8th semi', team1: 'Loser C19', team2: 'Loser C22', duty: 'Winner C23', optional: false, sort: 62 },
  { code: 'C28', day: 'sun', time: '13:00', court: 3, division: 'C', stage: 'playoff', label: 'Comp 5th–8th semi', team1: 'Loser C20', team2: 'Loser C21', duty: 'Winner C24', optional: false, sort: 63 },
  { code: 'S18', day: 'sun', time: '13:00', court: 4, division: 'S', stage: 'playoff', label: 'Social 7th/8th', team1: 'Loser S15', team2: 'Loser S16', duty: 'Winner S13', optional: false, sort: 64 },
  { code: 'W19', day: 'sun', time: '14:00', court: 1, division: 'W', stage: 'playoff', label: 'Women 3rd/4th', team1: 'Loser W15', team2: 'Loser W16', duty: 'Winner W14', optional: false, sort: 65 },
  { code: 'C29', day: 'sun', time: '14:00', court: 2, division: 'C', stage: 'playoff', label: 'Comp 5th/6th', team1: 'Winner C27', team2: 'Winner C28', duty: 'Loser C23', optional: false, sort: 66 },
  { code: 'C30', day: 'sun', time: '14:00', court: 3, division: 'C', stage: 'playoff', label: 'Comp 7th/8th', team1: 'Loser C27', team2: 'Loser C28', duty: 'Loser C24', optional: false, sort: 67 },
  { code: 'S19', day: 'sun', time: '14:00', court: 4, division: 'S', stage: 'playoff', label: 'Social 5th/6th', team1: 'Winner S15', team2: 'Winner S16', duty: 'Winner S14', optional: false, sort: 68 },
  { code: 'W20', day: 'sun', time: '15:00', court: 1, division: 'W', stage: 'playoff', label: 'Women FINAL', team1: 'Winner W15', team2: 'Winner W16', duty: 'Loser W19', optional: false, sort: 69 },
  { code: 'C31', day: 'sun', time: '15:00', court: 2, division: 'C', stage: 'playoff', label: 'Comp FINAL', team1: 'Winner C25', team2: 'Winner C26', duty: 'Winner C29', optional: false, sort: 70 },
  { code: 'C32', day: 'sun', time: '15:00', court: 3, division: 'C', stage: 'playoff', label: 'Comp bronze', team1: 'Loser C25', team2: 'Loser C26', duty: 'Loser C29', optional: false, sort: 71 },
  { code: 'S20', day: 'sun', time: '15:00', court: 4, division: 'S', stage: 'playoff', label: 'Social FINAL', team1: 'Winner S13', team2: 'Winner S14', duty: 'Pool A 4th', optional: false, sort: 72 },
  { code: 'C33', day: 'sun', time: '16:00', court: 2, division: 'C', stage: 'playoff', label: 'Comp 9th/10th', team1: 'Winner C23', team2: 'Winner C24', duty: 'TVC', optional: true, sort: 73 },
  { code: 'C34', day: 'sun', time: '16:00', court: 3, division: 'C', stage: 'playoff', label: 'Comp 11th/12th', team1: 'Loser C23', team2: 'Loser C24', duty: 'TVC', optional: true, sort: 74 },
];
