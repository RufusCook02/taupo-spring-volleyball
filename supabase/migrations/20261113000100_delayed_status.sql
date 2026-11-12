-- Adds the 'delayed' game status. A delayed game is not shown as live when its start time passes.
-- Run in Supabase → SQL Editor. Safe to re-run.
alter table public.scores drop constraint if exists scores_status_check;
alter table public.scores add constraint scores_status_check
  check (status in ('scheduled','delayed','in_progress','final'));
