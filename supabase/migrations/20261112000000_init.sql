-- Taupō Spring Volleyball 2026 – schema
-- Applied by the Supabase GitHub integration on push to main, or run in SQL Editor / `supabase db push`.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE.
-- The draw itself is fixed and lives in the app (data/draw.ts). The database holds only what changes.
-- No personal information: team names and scores only. TVC users live in Supabase Auth.

-- ---------- tables ----------

create table if not exists public.teams (
  id        text primary key check (id ~ '^[WSC][ABC][1-4]$'),   -- e.g. 'CA3' = Comp Pool A spot 3
  division  text not null check (division in ('W','S','C')),
  pool      text not null check (pool in ('A','B','C')),
  spot      int  not null check (spot between 1 and 4),
  name      text not null check (char_length(name) between 1 and 60),
  unique (division, pool, spot)
);

create table if not exists public.scores (
  game_code  text primary key check (game_code ~ '^[WSC][0-9]{1,2}$'),
  s1a int check (s1a between 0 and 99), s1b int check (s1b between 0 and 99),
  s2a int check (s2a between 0 and 99), s2b int check (s2b between 0 and 99),
  s3a int check (s3a between 0 and 99), s3b int check (s3b between 0 and 99),
  status     text not null default 'scheduled' check (status in ('scheduled','in_progress','final')),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

create table if not exists public.team_overrides (
  game_code  text not null check (game_code ~ '^[WSC][0-9]{1,2}$'),
  slot       text not null check (slot in ('team1','team2','duty')),
  team_id    text not null references public.teams(id),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (game_code, slot)
);

create table if not exists public.tiebreaks (
  scope            text primary key check (scope ~ '^(pool:[WSC][ABC]|seeds:place[1-4])$'),
  ordered_team_ids text[] not null,
  updated_at       timestamptz not null default now(),
  updated_by       uuid default auth.uid()
);

-- Who may edit. Add a row per TVC user (see README).
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

create table if not exists public.change_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  user_id    uuid,
  user_email text,
  table_name text not null,
  row_key    text not null,
  action     text not null,
  old_value  jsonb,
  new_value  jsonb
);
create index if not exists change_log_at_idx on public.change_log (at desc);

-- ---------- helpers ----------

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Change log: who, when, old and new value. Runs as definer so writers can't skip or forge it.
create or replace function public.log_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r jsonb;
  k text;
begin
  r := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  k := case tg_table_name
         when 'teams'          then r ->> 'id'
         when 'scores'         then r ->> 'game_code'
         when 'team_overrides' then (r ->> 'game_code') || ':' || (r ->> 'slot')
         else                       r ->> 'scope'
       end;
  insert into public.change_log (user_id, user_email, table_name, row_key, action, old_value, new_value)
  values (
    auth.uid(),
    auth.jwt() ->> 'email',
    tg_table_name,
    k,
    lower(tg_op),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) - 'updated_by' end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) - 'updated_by' end
  );
  return coalesce(new, old);
end;
$$;

-- keep updated_at / updated_by honest
create or replace function public.touch_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['scores','team_overrides','tiebreaks'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before insert or update on public.%1$s for each row execute function public.touch_row()', t);
  end loop;
  foreach t in array array['teams','scores','team_overrides','tiebreaks'] loop
    execute format('drop trigger if exists log_%1$s on public.%1$s', t);
    execute format('create trigger log_%1$s after insert or update or delete on public.%1$s for each row execute function public.log_change()', t);
  end loop;
end $$;

-- ---------- row-level security ----------
-- Public: read-only. Writes: TVC admins only. Change log and admin list: admins only.

alter table public.teams          enable row level security;
alter table public.scores         enable row level security;
alter table public.team_overrides enable row level security;
alter table public.tiebreaks      enable row level security;
alter table public.admins         enable row level security;
alter table public.change_log     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['teams','scores','team_overrides','tiebreaks'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "admin insert" on public.%I', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('drop policy if exists "admin update" on public.%I', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('drop policy if exists "admin delete" on public.%I', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- Teams: admins may rename but not add or remove spots.
drop policy if exists "admin insert" on public.teams;
drop policy if exists "admin delete" on public.teams;

drop policy if exists "admin read" on public.change_log;
create policy "admin read" on public.change_log for select to authenticated using (public.is_admin());

drop policy if exists "self read" on public.admins;
create policy "self read" on public.admins for select to authenticated using (user_id = auth.uid());
-- No insert/update/delete policies on admins or change_log: managed in the Supabase dashboard / by trigger only.

-- Least privilege on table grants too (RLS is the main control; this is belt and braces).
revoke insert, update, delete on public.change_log from anon, authenticated;
revoke insert, update, delete on public.admins from anon, authenticated;
revoke insert, update, delete on public.teams, public.scores, public.team_overrides, public.tiebreaks from anon;
