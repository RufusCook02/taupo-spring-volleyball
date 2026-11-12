import Link from 'next/link';
import { COURTS, DAYS, type Day } from '@/data/draw';
import { loadRaw } from '@/lib/data';
import { fmtTime } from '@/lib/format';
import { currentDay } from '@/lib/tournament/now';
import { buildState } from '@/lib/tournament/state';
import { requireAdmin } from '@/lib/supabase/server';

const STATUS_CLS = {
  scheduled: 'bg-slate-200 text-slate-700',
  in_progress: 'bg-red-600 text-white',
  final: 'bg-slate-800 text-white',
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
  const games = state.games.filter((g) => g.day === day && (!court || g.court === court));

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`rounded-full px-3 py-2 text-sm ${active ? 'bg-slate-900 text-white' : 'bg-white'}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-3">
      {sp.saved && <p className="rounded bg-green-100 p-2 text-sm text-green-800">Saved {sp.saved}. Public pages update within seconds.</p>}
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
                className={`block rounded-lg bg-white p-3 shadow-sm ${sp.saved === g.code ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <strong className="text-slate-900">{g.code}</strong>
                  <span>
                    {fmtTime(g.time)} · Ct {g.court} · {g.label}
                  </span>
                  <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_CLS[g.status]}`}>
                    {g.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-1 text-sm">
                  <span className={g.winner === 1 ? 'font-bold' : ''}>{g.t1.label}</span> v{' '}
                  <span className={g.winner === 2 ? 'font-bold' : ''}>{g.t2.label}</span>
                </div>
                {sets && <div className="tabular text-sm text-slate-600">{sets}</div>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
