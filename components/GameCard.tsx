import Link from 'next/link';
import { DAYS } from '@/data/draw';
import { fmtTime } from '@/lib/format';
import type { ResolvedGame, ResolvedSlot } from '@/lib/tournament/types';

const STATUS: Record<ResolvedGame['status'], { text: string; cls: string }> = {
  scheduled: { text: 'Scheduled', cls: 'bg-mist text-ink-muted' },
  in_progress: { text: 'LIVE', cls: 'bg-live text-white' },
  final: { text: 'Final', cls: 'bg-navy text-white' },
};

function TeamName({ slot, bold, highlight }: { slot: ResolvedSlot; bold?: boolean; highlight?: string }) {
  if (!slot.teamId) return <span className="italic text-ink-muted">{slot.label}</span>;
  const cls = `${bold ? 'font-semibold' : ''} ${highlight && slot.teamId === highlight ? 'underline decoration-2 underline-offset-2' : ''}`;
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
  bare = false,
}: {
  game: ResolvedGame;
  showDay?: boolean;
  showCourt?: boolean;
  showTime?: boolean;
  highlightTeam?: string;
  /** no card chrome – for use inside another panel */
  bare?: boolean;
}) {
  const st = STATUS[game.status];
  const s = game.scores;
  const sets: [number | null, number | null][] = [
    [s.s1a, s.s1b],
    [s.s2a, s.s2b],
    [s.s3a, s.s3b],
  ];
  const shownSets = sets.filter(([a, b]) => a != null || b != null);
  const when = [showDay && DAYS[game.day].short, showTime && fmtTime(game.time), showCourt && `Court ${game.court}`]
    .filter(Boolean)
    .join(' · ');

  const row = (slot: ResolvedSlot, side: 0 | 1, won: boolean) => (
    <div className="flex items-center justify-between gap-2 py-0.5 text-[17px]">
      <div className="min-w-0 truncate">
        <TeamName slot={slot} bold={won} highlight={highlightTeam} />
        {slot.overridden && <span className="ml-1 text-[10px] text-ink-muted">(set by TVC)</span>}
      </div>
      <div className="tabular flex shrink-0 gap-2.5 font-cond text-2xl font-extrabold leading-none">
        {shownSets.map((set, i) => {
          const mine = set[side];
          const theirs = set[1 - side];
          const wonSet = mine != null && theirs != null && mine > theirs;
          return (
            <span key={i} className={`w-7 text-right ${wonSet ? 'text-navy' : 'text-[#A5B2C6]'}`}>
              {mine ?? '–'}
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`${bare ? '' : 'card'} p-3 ${game.status === 'in_progress' && !bare ? 'ring-2 ring-live' : ''}`}>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
        <span className="border-l-4 border-navy pl-1.5 font-cond text-[15px] font-extrabold text-navy">{game.code}</span>
        <span>{game.label}</span>
        {game.optional && (
          <span className="-skew-x-12 bg-navy-700 px-1.5 font-cond text-[13px] font-extrabold uppercase text-white">
            Optional
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {when && <span>{when}</span>}
          <span className={`-skew-x-12 px-2 py-px font-cond text-[13px] font-extrabold uppercase tracking-wide ${st.cls}`}>
            {st.text}
          </span>
        </span>
      </div>
      {row(game.t1, 0, game.winner === 1)}
      {row(game.t2, 1, game.winner === 2)}
      <div className="mt-1 text-xs text-ink-muted">
        Duty: <TeamName slot={game.dutySlot} highlight={highlightTeam} />
      </div>
    </div>
  );
}
