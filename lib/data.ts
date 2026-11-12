import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_TEAMS, type TeamDef } from '@/data/draw';
import { buildState } from '@/lib/tournament/state';
import type { OverrideRow, RawData, ScoreRow, TiebreakRow, TournamentState } from '@/lib/tournament/types';
import { publicClient, supabaseConfigured } from '@/lib/supabase/public';

/** Load everything that changes (≈28 + 74 small rows). */
export async function loadRaw(supabase: SupabaseClient): Promise<RawData> {
  const [teams, scores, overrides, tiebreaks] = await Promise.all([
    supabase.from('teams').select('id, division, pool, spot, name'),
    supabase.from('scores').select('game_code, s1a, s1b, s2a, s2b, s3a, s3b, status, updated_at'),
    supabase.from('team_overrides').select('game_code, slot, team_id'),
    supabase.from('tiebreaks').select('scope, ordered_team_ids'),
  ]);
  const err = teams.error ?? scores.error ?? overrides.error ?? tiebreaks.error;
  if (err) throw new Error(`Database read failed: ${err.message}`);

  const dbTeams = (teams.data ?? []) as TeamDef[];
  // Fall back to the spreadsheet names for any spot missing from the table.
  const merged = DEFAULT_TEAMS.map((d) => dbTeams.find((t) => t.id === d.id) ?? d);

  return {
    teams: merged,
    scores: (scores.data ?? []) as ScoreRow[],
    overrides: (overrides.data ?? []) as OverrideRow[],
    tiebreaks: (tiebreaks.data ?? []) as TiebreakRow[],
  };
}

const EMPTY: RawData = { teams: DEFAULT_TEAMS, scores: [], overrides: [], tiebreaks: [] };

/** State for public pages. Without Supabase configured (local preview) shows the draw with no scores. */
export const getPublicState = cache(async (): Promise<TournamentState> => {
  if (!supabaseConfigured()) return buildState(EMPTY);
  return buildState(await loadRaw(publicClient()));
});
