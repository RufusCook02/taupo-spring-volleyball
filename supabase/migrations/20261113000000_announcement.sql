-- Public announcement banner, set by TVC in Admin → Announcement. None by default.
-- Run in Supabase → SQL Editor after 20261112000000_init.sql. Safe to re-run.

create table if not exists public.announcement (
  id         int primary key default 1 check (id = 1),           -- single row
  message    text check (message is null or char_length(message) <= 280),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

alter table public.announcement enable row level security;

drop policy if exists "public read" on public.announcement;
create policy "public read" on public.announcement for select to anon, authenticated using (true);
drop policy if exists "admin insert" on public.announcement;
create policy "admin insert" on public.announcement for insert to authenticated with check (public.is_admin());
drop policy if exists "admin update" on public.announcement;
create policy "admin update" on public.announcement for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke insert, update, delete on public.announcement from anon;

-- Change log: teach log_change() the key for this table.
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
         when 'announcement'   then 'announcement'
         else                       r ->> 'scope'
       end;
  insert into public.change_log (user_id, user_email, table_name, row_key, action, old_value, new_value)
  values (
    auth.uid(),
    auth.jwt() ->> 'email',
    tg_table_name,
    coalesce(k, tg_table_name),
    lower(tg_op),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) - 'updated_by' end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) - 'updated_by' end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists touch_announcement on public.announcement;
create trigger touch_announcement before insert or update on public.announcement
  for each row execute function public.touch_row();
drop trigger if exists log_announcement on public.announcement;
create trigger log_announcement after insert or update or delete on public.announcement
  for each row execute function public.log_change();
