import Link from 'next/link';
import { DIVISIONS } from '@/data/draw';
import { fmtDiff } from '@/lib/format';
import type { PoolStanding } from '@/lib/tournament/types';

const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

export default function StandingsTable({ pool, names }: { pool: PoolStanding; names: Record<string, string> }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b-[3px] border-navy px-3 py-2">
        <h3 className="heading text-xl">
          {DIVISIONS[pool.division].name === 'Competitive' ? 'Comp' : DIVISIONS[pool.division].name} Pool {pool.pool}
        </h3>
        <span className="text-xs text-ink-muted">
          {pool.complete ? 'Complete' : `${pool.gamesFinal}/${pool.gamesTotal} games final`}
        </span>
      </div>
      <table className="tabular w-full text-[15px]">
        <thead className="font-cond text-sm uppercase text-ink-muted">
          <tr>
            <th className="w-9 px-1 py-1.5">#</th>
            <th className="px-2 py-1.5 text-left">Team</th>
            <th className="px-1 py-1.5" title="Played">P</th>
            <th className="px-1 py-1.5" title="Wins">W</th>
            <th className="px-1 py-1.5" title="Losses">L</th>
            <th className="px-1 py-1.5" title="Competition points">Pts</th>
            <th className="px-2 py-1.5" title="Rally points +/-">+/-</th>
          </tr>
        </thead>
        <tbody>
          {pool.rows.map((r) => {
            const leader = r.played > 0 && r.position === 1;
            return (
              <tr key={r.teamId} className="border-t border-rule">
                <td
                  className={`text-center font-cond text-xl font-extrabold ${leader ? 'bg-navy text-white' : 'text-navy'}`}
                >
                  {r.played === 0 ? '–' : (r.position ?? `${r.rank}=`)}
                </td>
                <td className="px-2 py-2">
                  <Link href={`/team/${r.teamId}`} className="hover:underline">
                    {names[r.teamId] ?? r.teamId}
                  </Link>
                  {r.tied && r.tieResolved && pool.complete && (
                    <span className="ml-1 text-[10px] text-ink-muted">(organiser tie-break)</span>
                  )}
                </td>
                <td className="px-1 text-center">{r.played}</td>
                <td className="px-1 text-center">{r.wins}</td>
                <td className="px-1 text-center">{r.losses}</td>
                <td className="px-1 text-center font-semibold">{r.pts}</td>
                <td className="px-2 text-center">{fmtDiff(r.diff)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pool.needsTiebreak && (
        <p className="border-t border-rule bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Exact tie on wins, points and rally +/-:{' '}
          {pool.rows
            .filter((r) => r.position === null)
            .map((r) => names[r.teamId])
            .join(', ')}
          . The organiser will decide the {ord(pool.rows.find((r) => r.position === null)!.rank)} place order.
        </p>
      )}
    </div>
  );
}
