import Link from 'next/link';
import { COURTS, DAYS, type Day } from '@/data/draw';
import { loadRaw } from '@/lib/data';
import { fmtTime } from '@/lib/format';
import { blockersFor } from '@/lib/tournament/blockers';
import { autoLiveCodes, currentDay, minutesUntilStart, nzClock } from '@/lib/tournament/now';
import { buildState } from '@/lib/tournament/state';
import { requireAdmin } from '@/lib/supabase/server';

const STATUS_CLS = {
  scheduled: 'bg-mist text-ink-muted',
  delayed: 'bg-amber-400 text-navy',
  in_progress: 'bg-live text-white',
  final: 'bg-navy text-white',
};

export default async function AdminScores({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; court?: string; saved?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const state = buildState(await loadRaw(supabase));
  const sp = await searchParams;
  const day: Day = sp.day === 'sat' || sp.day === 'sun' ? sp.day : currentDay(state.games);
  const court = COURTS.find((c) => String(c) === sp.court) ?? null;
  const autoLive = autoLiveCodes(state.games);
  const games = state.games.filter((g) => g.day === day && (!court || g.court === court));

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`rounded-full px-3 py-2 text-sm ${active ? 'bg-navy text-white' : 'bg-white'}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-3">
      {sp.saved && <p className="rounded bg-green-100 p-2 text-sm text-green-800">Saved {sp.saved}. Public pages update within seconds.</p>}
      {(() => {
        const soon = state.games.filter(
          (g) =>
            (g.status === 'scheduled' || g.status === 'delayed') &&
            (!g.t1.teamId || !g.t2.teamId) &&
            minutesUntilStart(g, nzClock()) <= 60 &&
            blockersFor(state, g.code).games.length > 0,
        );
        return soon.length > 0 ? (
          <p className="rounded bg-red-50 p-2 text-sm text-red-900">
            {soon.length} game{soon.length > 1 ? 's' : ''} starting within the hour still waiting on results ({soon.map((g) => g.code).join(', ')}).{' '}
            <Link href="/admin/dashboard" className="underline">
              See what&apos;s needed
            </Link>
          </p>
        ) : null;
      })()}
      {state.tieIssues.length > 0 && (
        <p className="rounded bg-amber-100 p-2 text-sm text-amber-900">
          {state.tieIssues.length} exact tie{state.tieIssues.length > 1 ? 's' : ''} need an organiser decision.{' '}
          <Link href="/admin/ties" className="underline">Resolve</Link>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {(['sat', 'sun'] as Day[]).map((d) => chip(`/admin?day=${d}${court ? `&court=${court}` : ''}`, DAYS[d].short, d === day))}
      </div>
      <div className="flex flex-wrap gap-2">
        {chip(`/admin?day=${day}`, 'All courts', !court)}
        {COURTS.map((c) => chip(`/admin?day=${day}&court=${c}`, `Court ${c}`, c === court))}
      </div>

      <ul className="space-y-2">
        {games.map((g) => {
          const s = g.scores;
          const sets = [
            [s.s1a, s.s1b],
            [s.s2a, s.s2b],
            [s.s3a, s.s3b],
          ]
            .filter(([a, b]) => a != null && b != null)
            .map(([a, b]) => `${a}–${b}`)
            .join(', ');
          return (
            <li key={g.code}>
              <Link
                href={`/admin/game/${g.code}`}
                className={`block card p-3 ${sp.saved === g.code ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <strong className="text-navy">{g.code}</strong>
                  <span>
                    {fmtTime(g.time)} · Ct {g.court} · {g.label}
                  </span>
                  <span
                    className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold ${autoLive.has(g.code) ? STATUS_CLS.in_progress : STATUS_CLS[g.status]}`}
                    title={autoLive.has(g.code) ? 'Start time has passed, so the public site shows it as live. Mark it Delayed to stop that.' : undefined}
                  >
                    {autoLive.has(g.code) ? 'live (auto)' : g.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-1 text-sm">
                  <span className={g.winner === 1 ? 'font-bold' : ''}>{g.t1.label}</span> v{' '}
                  <span className={g.winner === 2 ? 'font-bold' : ''}>{g.t2.label}</span>
                </div>
                {sets && <div className="tabular text-sm text-ink-muted">{sets}</div>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
