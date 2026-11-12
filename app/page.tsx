import Link from 'next/link';
import { DAYS } from '@/data/draw';
import AutoRefresh from '@/components/AutoRefresh';
import GameCard from '@/components/GameCard';
import { getPublicState } from '@/lib/data';
import { courtsNow, currentDay } from '@/lib/tournament/now';

export const revalidate = 15;

export default async function Home() {
  const state = await getPublicState();
  const day = currentDay(state.games);
  const courts = courtsNow(state.games, day);
  const allDone = state.games.filter((g) => !g.optional).every((g) => g.status === 'final');

  return (
    <div className="space-y-4">
      <AutoRefresh />
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">On court now – {DAYS[day].short}</h1>
        <Link href={`/draw/${day}`} className="text-sm text-blue-700 underline">
          Full draw
        </Link>
      </div>

      {allDone && (
        <p className="rounded-lg bg-green-100 p-3 text-sm">
          That&apos;s a wrap! See final placings on the{' '}
          <Link className="underline" href="/division/women">Women</Link>,{' '}
          <Link className="underline" href="/division/social">Social</Link> and{' '}
          <Link className="underline" href="/division/comp">Comp</Link> pages.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {courts.map(({ court, current, next }) => (
          <section key={court} className="space-y-2">
            <h2 className="flex items-baseline justify-between font-semibold">
              <span>Court {court}</span>
              <Link href={`/court/${court}`} className="text-xs font-normal text-blue-700 underline">
                All games on court {court}
              </Link>
            </h2>
            {current ? (
              <GameCard game={current} showCourt={false} />
            ) : (
              <p className="rounded-lg bg-white p-3 text-sm text-slate-500 shadow-sm">No game in progress.</p>
            )}
            {next && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Up next</p>
                <GameCard game={next} showCourt={false} />
              </div>
            )}
          </section>
        ))}
      </div>

      <section className="rounded-lg bg-white p-3 text-sm shadow-sm">
        <h2 className="mb-2 font-semibold">Find your team</h2>
        <p>
          See every game and duty for a team on the <Link href="/teams" className="text-blue-700 underline">Teams</Link> page.
        </p>
      </section>
    </div>
  );
}
