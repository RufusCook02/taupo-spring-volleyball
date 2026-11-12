import { notFound } from 'next/navigation';
import { DAYS, type Day } from '@/data/draw';
import AutoRefresh from '@/components/AutoRefresh';
import GameCard from '@/components/GameCard';
import { getPublicState } from '@/lib/data';
import { fmtTime } from '@/lib/format';
import { TIMES } from '@/lib/tournament/now';

export const revalidate = 15;
export const dynamicParams = false;
export const generateStaticParams = () => [{ day: 'sat' }, { day: 'sun' }];

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  return { title: `${DAYS[day as Day]?.short ?? ''} draw` };
}

export default async function DrawPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = (await params) as { day: Day };
  if (!DAYS[day]) notFound();
  const state = await getPublicState();
  const games = state.games.filter((g) => g.day === day);

  return (
    <div className="space-y-4">
      <AutoRefresh />
      <h1 className="heading text-[30px]">{DAYS[day].label}</h1>
      {day === 'sun' && (
        <p className="text-sm text-ink-muted">
          Playoff teams fill in as results come through. Times after the quarter-finals are targets – playoffs have no time
          limit.
        </p>
      )}
      {TIMES(day).map((time) => (
        <section key={time}>
          <h2 className="heading mb-2 text-xl">{fmtTime(time)}</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {games
              .filter((g) => g.time === time)
              .sort((a, b) => a.court - b.court)
              .map((g) => (
                <GameCard key={g.code} game={g} showTime={false} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
