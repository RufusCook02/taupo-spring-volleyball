'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { DEFAULT_TEAMS, GAMES } from '@/data/draw';
import { gameResult } from '@/lib/tournament/result';
import type { GameStatus, Slot } from '@/lib/tournament/types';
import { requireAdmin, userClient } from '@/lib/supabase/server';

export interface ActionState {
  error?: string;
  ok?: string;
}

const STATUSES: GameStatus[] = ['scheduled', 'in_progress', 'final'];
const SLOTS: Slot[] = ['team1', 'team2', 'duty'];
const TEAM_IDS = new Set(DEFAULT_TEAMS.map((t) => t.id));

/** Public pages are cached; refresh them all after any change. */
function refreshPublic() {
  revalidatePath('/', 'layout');
}

// ---------- auth ----------

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };
  const supabase = await userClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Sign-in failed. Check your email and password.' };
  redirect('/admin');
}

export async function signOut() {
  const supabase = await userClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

// ---------- scores ----------

function parseScore(v: FormDataEntryValue | null): number | null | 'bad' {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  if (!/^\d{1,2}$/.test(s)) return 'bad';
  return Number(s);
}

export async function saveScore(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const code = String(form.get('code') ?? '');
  const game = GAMES.find((g) => g.code === code);
  if (!game) return { error: 'Unknown game.' };

  const keys = ['s1a', 's1b', 's2a', 's2b', 's3a', 's3b'] as const;
  const vals = {} as Record<(typeof keys)[number], number | null>;
  for (const k of keys) {
    const v = parseScore(form.get(k));
    if (v === 'bad') return { error: 'Scores must be whole numbers from 0 to 99.' };
    vals[k] = v;
  }
  const pairs: [number | null, number | null][] = [
    [vals.s1a, vals.s1b],
    [vals.s2a, vals.s2b],
    [vals.s3a, vals.s3b],
  ];
  if (pairs.some(([a, b]) => (a == null) !== (b == null))) return { error: 'Enter both teams’ scores for each set played.' };
  if (vals.s2a != null && vals.s1a == null) return { error: 'Enter set 1 before set 2.' };
  if (vals.s3a != null && vals.s2a == null) return { error: 'Enter sets 1 and 2 before set 3.' };

  let status = String(form.get('status') ?? 'scheduled') as GameStatus;
  if (!STATUSES.includes(status)) return { error: 'Unknown status.' };
  const r = gameResult(vals);
  if (status === 'final' && !r.played) return { error: 'A final game needs at least set 1 scores.' };
  if (status === 'scheduled' && r.played) status = 'in_progress';

  const { error } = await supabase.from('scores').upsert({ game_code: code, ...vals, status });
  if (error) return { error: `Save failed: ${error.message}` };
  refreshPublic();
  redirect(`/admin?day=${game.day}&court=${game.court}&saved=${code}`);
}

export async function clearScore(form: FormData) {
  const { supabase } = await requireAdmin();
  const code = String(form.get('code') ?? '');
  const game = GAMES.find((g) => g.code === code);
  if (!game) return;
  const { error } = await supabase.from('scores').delete().eq('game_code', code);
  if (error) throw new Error(error.message);
  refreshPublic();
  redirect(`/admin?day=${game.day}&court=${game.court}&saved=${code}`);
}

// ---------- team overrides ----------

export async function saveOverrides(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const code = String(form.get('code') ?? '');
  if (!GAMES.some((g) => g.code === code)) return { error: 'Unknown game.' };
  for (const slot of SLOTS) {
    const teamId = String(form.get(slot) ?? '');
    if (teamId === '') {
      const { error } = await supabase.from('team_overrides').delete().eq('game_code', code).eq('slot', slot);
      if (error) return { error: error.message };
    } else {
      if (!TEAM_IDS.has(teamId)) return { error: 'Unknown team.' };
      const { error } = await supabase.from('team_overrides').upsert({ game_code: code, slot, team_id: teamId });
      if (error) return { error: error.message };
    }
  }
  refreshPublic();
  return { ok: 'Teams saved.' };
}

// ---------- team names ----------

export async function renameTeam(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = String(form.get('id') ?? '');
  const name = String(form.get('name') ?? '').trim().replace(/\s+/g, ' ');
  if (!TEAM_IDS.has(id)) return { error: 'Unknown team.' };
  if (name.length < 1 || name.length > 60) return { error: 'Name must be 1–60 characters.' };
  const { error, count } = await supabase.from('teams').update({ name }, { count: 'exact' }).eq('id', id);
  if (error) return { error: error.message };
  if (!count) return { error: 'Team not found in the database – run supabase/seed.sql.' };
  refreshPublic();
  return { ok: `Saved “${name}”.` };
}

// ---------- tie-breaks ----------

export async function saveTiebreak(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const scope = String(form.get('scope') ?? '');
  if (!/^(pool:[WSC][ABC]|seeds:place[1-4])$/.test(scope)) return { error: 'Unknown tie.' };
  const expected = String(form.get('teams') ?? '').split(',').filter(Boolean);
  const order = expected.map((_, i) => String(form.get(`pos${i}`) ?? ''));
  if (new Set(order).size !== expected.length || !order.every((t) => expected.includes(t))) {
    return { error: 'Pick each team exactly once.' };
  }
  const { error } = await supabase.from('tiebreaks').upsert({ scope, ordered_team_ids: order });
  if (error) return { error: error.message };
  refreshPublic();
  return { ok: 'Tie-break saved.' };
}

export async function deleteTiebreak(form: FormData) {
  const { supabase } = await requireAdmin();
  const scope = String(form.get('scope') ?? '');
  const { error } = await supabase.from('tiebreaks').delete().eq('scope', scope);
  if (error) throw new Error(error.message);
  refreshPublic();
  redirect('/admin/ties');
}
