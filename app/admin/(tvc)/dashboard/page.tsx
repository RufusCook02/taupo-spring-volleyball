import Link from 'next/link';
import { DAYS } from '@/data/draw';
import { loadRaw } from '@/lib/data';
import { fmtTime } from '@/lib/format';
import { blockersFor } from '@/lib/tournament/blockers';
import { minutesUntilStart, nzClock } from '@/lib/tournament/now';
import { buildState } from '@/lib/tournament/state';
import { requireAdmin } from '@/lib/supabase/server';

const until = (m: number) => {
  if (m <= 0) return m > -5 ? 'due now' : `${fmtDur(-m)} overdue`;
  return `starts in ${fmtDur(m)}`;
};
const fmtDur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim());

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const state = buildState(await loadRaw(supabase));
  const clock = nzClock();

  const waiting = state.games
    .filter((g) => (g.status === 'scheduled' || g.status === 'delayed') && (!g.t1.teamId || !g.t2.teamId))
    .map((g) => ({ g, b: blockersFor(state, g.code), mins: minutesUntilStart(g, clock) }))
    .sort((a, b) => a.g.sort - b.g.sort);

  const overdue = state.games
    .filter((g) => g.status !== 'final' && !g.optional && minutesUntilStart(g, clock) <= -60)
    .sort((a, b) => a.sort - b.sort);

  const tieTitle = (scope: string) => state.tieIssues.find((t) => t.scope === scope)?.title ?? scope;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="heading text-[26px]">Organiser dashboard</h1>
        <p className="text-sm text-ink-muted">
          As at{' '}
          {new Intl.DateTimeFormat('en-NZ', {
            timeZone: 'Pacific/Auckland',
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
          }).format(new Date())}{' '}
          NZ time · refresh the page to update
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="heading text-xl">Ties needing a decision ({state.tieIssues.length})</h2>
        {state.tieIssues.length === 0 ? (
          <p className="text-sm text-ink-muted">None.</p>
        ) : (
          state.tieIssues.map((t) => (
            <Link key={t.scope} href="/admin/ties" className="card block bg-amber-50 p-3 text-sm">
              <strong>{t.title}</strong>: {t.teamIds.map((id) => state.teamsById[id]?.name ?? id).join(', ')} →
              set the order
            </Link>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="heading text-xl">Waiting on results ({waiting.length})</h2>
        <p className="text-xs text-ink-muted">
          Games whose teams aren&apos;t decided yet, and what must be marked Final (or decided) first.
        </p>
        {waiting.length === 0 && <p className="text-sm text-ink-muted">All upcoming games have their teams.</p>}
        {waiting.map(({ g, b, mins }) => {
          const urgent = mins <= 30;
          return (
            <div key={g.code} className={`card p-3 text-sm ${urgent ? 'ring-2 ring-live' : ''}`}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Link href={`/admin/game/${g.code}`} className="font-cond text-lg font-extrabold underline">
                  {g.code}
                </Link>
                <span>
                  {DAYS[g.day].short.slice(0, 3)} {fmtTime(g.time)} · Ct {g.court} · {g.label}
                </span>
                <span className={`ml-auto text-xs font-semibold ${urgent ? 'text-live' : 'text-ink-muted'}`}>{until(mins)}</span>
              </div>
              <p className="text-ink-muted">
                {g.t1.label} v {g.t2.label}
              </p>
              {b.games.length > 0 && (
                <p className="mt-1">
                  Mark Final:{' '}
                  {b.games.map((c, i) => (
                    <span key={c}>
                      {i > 0 && ', '}
                      <Link href={`/admin/game/${c}`} className="underline">
                        {c}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
              {b.ties.length > 0 && (
                <p className="mt-1">
                  Decide tie:{' '}
                  <Link href="/admin/ties" className="underline">
                    {b.ties.map(tieTitle).join(', ')}
                  </Link>
                </p>
              )}
              {b.games.length === 0 && b.ties.length === 0 && (
                <p className="mt-1 text-amber-800">Nothing pending – set the teams on the game page if they&apos;re still blank.</p>
              )}
            </div>
          );
        })}
      </section>

      <section className="space-y-2">
        <h2 className="heading text-xl">Not marked Final, 1 h+ after start ({overdue.length})</h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-ink-muted">None.</p>
        ) : (
          <ul className="card divide-y divide-rule text-sm">
            {overdue.map((g) => (
              <li key={g.code}>
                <Link href={`/admin/game/${g.code}`} className="flex gap-2 px-3 py-2">
                  <strong>{g.code}</strong>
                  <span>
                    {fmtTime(g.time)} · Ct {g.court} · {g.t1.label} v {g.t2.label}
                  </span>
                  <span className="ml-auto text-xs text-ink-muted">{g.status.replace('_', ' ')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
