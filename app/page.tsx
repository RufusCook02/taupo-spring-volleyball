import Link from 'next/link';
import { DAYS, DIVISIONS } from '@/data/draw';
import AutoRefresh from '@/components/AutoRefresh';
import GameCard from '@/components/GameCard';
import MyTeam, { type LiteGame, type LiteTeam } from '@/components/MyTeam';
import { appNow } from '@/lib/clock';
import { getPublicState } from '@/lib/data';
import { fmtTime } from '@/lib/format';
import { courtsNow, currentDay } from '@/lib/tournament/now';

export const revalidate = 15;

export default async function Home() {
  const state = await getPublicState();
  const day = currentDay(state.games, appNow());
  const courts = courtsNow(state.games, day);
  const allDone = state.games.filter((g) => !g.optional).every((g) => g.status === 'final');

  // Compact data for the "My team" card (runs in the browser).
  const liteGames: LiteGame[] = state.games.map((g) => ({
    code: g.code,
    day: g.day,
    time: g.time,
    court: g.court,
    sort: g.sort,
    status: g.status,
    winner: g.winner,
    t1: { id: g.t1.teamId, label: g.t1.label },
    t2: { id: g.t2.teamId, label: g.t2.label },
    duty: { id: g.dutySlot.teamId, label: g.dutySlot.label },
  }));
  const liteTeams: LiteTeam[] = state.teams.map((t) => ({
    id: t.id,
    name: t.name,
    group: `${DIVISIONS[t.division].name} Pool ${t.pool}`,
  }));

  return (
    <div className="space-y-5">
      <AutoRefresh generatedAt={new Date().toISOString()} />

      <MyTeam games={liteGames} teams={liteTeams} />

      <div className="flex items-end justify-between">
        <h1 className="heading text-[30px]">
          On court now <span className="font-semibold text-ink-muted">· {DAYS[day].short.slice(0, 3)}</span>
        </h1>
        <Link href={`/draw/${day}`} className="text-sm underline">
          Full draw
        </Link>
      </div>

      {allDone && (
        <p className="card p-3 text-sm">
          That&apos;s a wrap! See final placings on the{' '}
          <Link className="underline" href="/division/women">Women</Link>,{' '}
          <Link className="underline" href="/division/social">Social</Link> and{' '}
          <Link className="underline" href="/division/comp">Comp</Link> pages.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {courts.map(({ court, current, next }) => (
          <section key={court} className={`card ${current ? 'ring-2 ring-live' : ''}`}>
            <div className="flex items-center justify-between bg-navy px-3 py-1.5 text-white">
              <h2 className="heading text-xl">Court {court}</h2>
              <Link href={`/court/${court}`} className="text-xs text-[#B8C6DC] underline">
                All games
              </Link>
            </div>
            {current ? (
              <GameCard game={current} showCourt={false} bare />
            ) : (
              <p className="p-3 text-sm text-ink-muted">No game in progress.</p>
            )}
            {next && (
              <Link href={`/court/${court}`} className="flex gap-2 bg-mist px-3 py-2 text-sm">
                <b className="shrink-0 font-cond font-extrabold uppercase text-ink-muted">
                  {next.status === 'delayed' ? 'Delayed' : `Next ${fmtTime(next.time)}`}
                </b>
                <span className="truncate">
                  {next.code}: {next.t1.label} v {next.t2.label}
                </span>
              </Link>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
