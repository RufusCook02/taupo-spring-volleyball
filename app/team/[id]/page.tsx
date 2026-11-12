import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEFAULT_TEAMS, DIVISIONS } from '@/data/draw';
import AutoRefresh from '@/components/AutoRefresh';
import GameCard from '@/components/GameCard';
import { getPublicState } from '@/lib/data';
import { fmtTime } from '@/lib/format';

export const revalidate = 15;
export const dynamicParams = false;
export const generateStaticParams = () => DEFAULT_TEAMS.map((t) => ({ id: t.id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getPublicState();
  return { title: state.teamsById[id]?.name ?? 'Team' };
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getPublicState();
  const team = state.teamsById[id];
  if (!team) notFound();

  const plays = state.games.filter((g) => g.t1.teamId === id || g.t2.teamId === id);
  const duties = state.games.filter((g) => g.dutySlot.teamId === id);
  const pool = state.pools[`${team.division}${team.pool}`];
  const row = pool.rows.find((r) => r.teamId === id)!;
  const placing = state.placings[team.division].find((p) => p.teamId === id);

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <div>
        <h1 className="heading text-[30px]">{team.name}</h1>
        <p className="text-sm text-ink-muted">
          <Link href={`/division/${DIVISIONS[team.division].slug}`} className="underline">
            {DIVISIONS[team.division].name}
          </Link>{' '}
          · Pool {team.pool} · {row.wins}W {row.losses}L · {row.pts} pts
          {row.played > 0 && row.position && ` · ${row.position}${['st', 'nd', 'rd', 'th'][Math.min(row.position, 4) - 1]} in pool`}
          {placing && ` · Final placing: ${placing.place}`}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="heading text-xl">Games</h2>
        {plays.map((g) => (
          <GameCard key={g.code} game={g} showDay highlightTeam={id} />
        ))}
        <p className="text-xs text-ink-muted">
          Sunday playoff games appear here once the results that decide them are in.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="heading text-xl">Duty (referee) times</h2>
        {duties.length === 0 ? (
          <p className="text-sm text-ink-muted">None yet.</p>
        ) : (
          <ul className="card text-sm">
            {duties.map((g) => (
              <li key={g.code} className="flex gap-3 border-t px-3 py-2 first:border-t-0">
                <span className="w-28 shrink-0">
                  {g.day === 'sat' ? 'Sat' : 'Sun'} {fmtTime(g.time)}
                </span>
                <span className="w-16 shrink-0">Court {g.court}</span>
                <span className="truncate">
                  {g.code}: {g.t1.label} v {g.t2.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
