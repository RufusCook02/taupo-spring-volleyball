import Link from 'next/link';
import { DIVISIONS } from '@/data/draw';
import { fmtDiff } from '@/lib/format';
import type { PoolStanding } from '@/lib/tournament/types';

const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

export default function StandingsTable({ pool, names }: { pool: PoolStanding; names: Record<string, string> }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="flex items-baseline justify-between border-b px-3 py-2">
        <h3 className="font-semibold">
          {DIVISIONS[pool.division].name} Pool {pool.pool}
        </h3>
        <span className="text-xs text-slate-500">
          {pool.complete ? 'Complete' : `${pool.gamesFinal}/${pool.gamesTotal} games final`}
        </span>
      </div>
      <table className="tabular w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-2 py-1 text-left">#</th>
            <th className="px-2 py-1 text-left">Team</th>
            <th className="px-1 py-1" title="Played">P</th>
            <th className="px-1 py-1" title="Wins">W</th>
            <th className="px-1 py-1" title="Losses">L</th>
            <th className="px-1 py-1" title="Competition points">Pts</th>
            <th className="px-2 py-1" title="Rally points +/-">+/-</th>
          </tr>
        </thead>
        <tbody>
          {pool.rows.map((r) => (
            <tr key={r.teamId} className="border-t">
              <td className="px-2 py-1.5 text-slate-500">
                {r.played === 0 ? '–' : r.position ?? `${r.rank}=`}
              </td>
              <td className="px-2 py-1.5">
                <Link href={`/team/${r.teamId}`} className="hover:underline">
                  {names[r.teamId] ?? r.teamId}
                </Link>
                {r.tied && r.tieResolved && pool.complete && (
                  <span className="ml-1 text-[10px] text-slate-500">(organiser tie-break)</span>
                )}
              </td>
              <td className="px-1 text-center">{r.played}</td>
              <td className="px-1 text-center">{r.wins}</td>
              <td className="px-1 text-center">{r.losses}</td>
              <td className="px-1 text-center font-semibold">{r.pts}</td>
              <td className="px-2 text-center">{fmtDiff(r.diff)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pool.needsTiebreak && (
        <p className="border-t bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Exact tie on wins, points and rally +/-: {pool.rows.filter((r) => r.position === null).map((r) => names[r.teamId]).join(', ')}.
          The organiser will decide the {ord(pool.rows.find((r) => r.position === null)!.rank)} place order.
        </p>
      )}
    </div>
  );
}
