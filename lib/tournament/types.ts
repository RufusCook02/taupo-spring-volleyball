import type { Division, GameDef, TeamDef } from '@/data/draw';
import type { GameResult, SetScores } from './result';

/** 'delayed' = TVC has held the game back; it won't be shown as live automatically when its start time passes. */
export type GameStatus = 'scheduled' | 'delayed' | 'in_progress' | 'final';
export type Slot = 'team1' | 'team2' | 'duty';

export interface ScoreRow extends SetScores {
  game_code: string;
  status: GameStatus;
  updated_at?: string | null;
}

export interface OverrideRow {
  game_code: string;
  slot: Slot;
  team_id: string;
}

export interface TiebreakRow {
  scope: string; // 'pool:WA' or 'seeds:place2'
  ordered_team_ids: string[];
}

/** Everything loaded from the database (or defaults when no database is configured). */
export interface RawData {
  teams: TeamDef[];
  scores: ScoreRow[];
  overrides: OverrideRow[];
  tiebreaks: TiebreakRow[];
  /** public banner text set by TVC; none by default */
  announcement?: string | null;
}

export interface ResolvedSlot {
  teamId: string | null;
  /** team name when resolved, else the source text (e.g. 'Winner C19', 'TVC') */
  label: string;
  /** original draw text, e.g. 'Seed 3' or 'spot:CA1' */
  source: string;
  overridden: boolean;
}

export interface ResolvedGame extends GameDef {
  t1: ResolvedSlot;
  t2: ResolvedSlot;
  dutySlot: ResolvedSlot;
  scores: SetScores;
  status: GameStatus;
  result: GameResult | null; // null until set 1 has both scores
  /** 1 or 2 once the game is final */
  winner: 1 | 2 | null;
  updatedAt: string | null;
  /** shown as in progress because its start time passed (stored status is still 'scheduled') */
  autoLive?: boolean;
}

export interface StandingRow {
  teamId: string;
  played: number;
  wins: number;
  losses: number;
  pts: number;
  diff: number;
  rank: number;
  tied: boolean;
  tieResolved: boolean;
  position: number | null;
}

export interface PoolStanding {
  key: string; // 'WA'
  division: Division;
  pool: 'A' | 'B' | 'C';
  rows: StandingRow[];
  gamesTotal: number;
  gamesFinal: number;
  complete: boolean;
  /** complete, but an exact tie still needs an organiser decision */
  needsTiebreak: boolean;
}

export interface SeedRow {
  seed: number;
  teamId: string | null;
  place: number; // pool place 1–4
  poolKey: string | null;
  wins: number;
  pts: number;
  diff: number;
  tied: boolean;
  tieResolved: boolean;
}

export interface Seeding {
  /** all Comp pools complete with no unresolved pool ties – seeds with a teamId are final */
  poolsComplete: boolean;
  /** poolsComplete and every seed decided */
  ready: boolean;
  rows: SeedRow[];
  /** place groups (1–4) with an unresolved cross-pool tie */
  needsTiebreak: { place: number; teamIds: string[] }[];
}

export interface Placing {
  place: string; // '1st', '9th='
  teamId: string | null;
  note?: string;
}

export interface TieIssue {
  scope: string;
  title: string;
  teamIds: string[];
}

export interface TournamentState {
  teams: TeamDef[];
  teamsById: Record<string, TeamDef>;
  games: ResolvedGame[];
  gamesByCode: Record<string, ResolvedGame>;
  pools: Record<string, PoolStanding>;
  seeding: Seeding;
  placings: Record<Division, Placing[]>;
  tieIssues: TieIssue[];
  announcement: string | null;
}
