import Link from 'next/link';
import { DAYS } from '@/data/draw';
import { DIV_STYLE, fmtTime } from '@/lib/format';
import type { ResolvedGame, ResolvedSlot } from '@/lib/tournament/types';

const STATUS: Record<ResolvedGame['status'], { text: string; cls: string }> = {
  scheduled: { text: 'Scheduled', cls: 'bg-slate-200 text-slate-700' },
  in_progress: { text: 'LIVE', cls: 'bg-red-600 text-white animate-pulse' },
  final: { text: 'Final', cls: 'bg-slate-800 text-white' },
};

function TeamName({ slot, bold, highlight }: { slot: ResolvedSlot; bold?: boolean; highlight?: string }) {
  const cls = `${bold ? 'font-bold' : ''} ${slot.teamId === highlight && highlight ? 'underline decoration-2' : ''}`;
  if (!slot.teamId) return <span className="italic text-slate-500">{slot.label}</span>;
  return (
    <Link href={`/team/${slot.teamId}`} className={`hover:underline ${cls}`}>
      {slot.label}
    </Link>
  );
}

export default function GameCard({
  game,
  showDay = false,
  showCourt = true,
  showTime = true,
  highlightTeam,
}: {
  game: ResolvedGame;
  showDay?: boolean;
  showCourt?: boolean;
  showTime?: boolean;
  highlightTeam?: string;
}) {
  const st = STATUS[game.status];
  const style = DIV_STYLE[game.division];
  const s = game.scores;
  const sets: [number | null, number | null][] = [
    [s.s1a, s.s1b],
    [s.s2a, s.s2b],
    [s.s3a, s.s3b],
  ];
  const shownSets = sets.filter(([a, b]) => a != null || b != null);

  const row = (slot: ResolvedSlot, side: 0 | 1, won: boolean) => (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <div className="min-w-0 truncate">
        <TeamName slot={slot} bold={won} highlight={highlightTeam} />
        {slot.overridden && <span className="ml-1 text-[10px] text-amber-700">(set by TVC)</span>}
      </div>
      <div className="tabular flex shrink-0 gap-2 text-right">
        {shownSets.map((set, i) => (
          <span
            key={i}
            className={`w-6 ${set[side] != null && set[1 - side] != null && set[side]! > set[1 - side]! ? 'font-bold' : 'text-slate-500'}`}
          >
            {set[side] ?? '–'}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`rounded-lg border-l-4 bg-white p-3 shadow-sm ${style.border} ${game.status === 'in_progress' ? 'ring-2 ring-red-400' : ''}`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
        <span className={`rounded px-1.5 py-0.5 font-semibold ${style.badge}`}>{game.code}</span>
        <span>{game.label}</span>
        {game.optional && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">Optional</span>}
        <span className="ml-auto flex items-center gap-2">
          {(showDay || showTime || showCourt) && (
            <span>
              {[showDay && DAYS[game.day].short, showTime && fmtTime(game.time), showCourt && `Court ${game.court}`]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${st.cls}`}>{st.text}</span>
        </span>
      </div>
      {row(game.t1, 0, game.winner === 1)}
      {row(game.t2, 1, game.winner === 2)}
      <div className="mt-1 text-xs text-slate-500">
        Duty: <TeamName slot={game.dutySlot} highlight={highlightTeam} />
      </div>
    </div>
  );
}
