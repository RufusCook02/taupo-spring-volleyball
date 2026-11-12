import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DAYS, DEFAULT_TEAMS, DIVISIONS, type Day } from '@/data/draw';
import AutoRefresh from '@/components/AutoRefresh';
import GameCard from '@/components/GameCard';
import { getPublicState } from '@/lib/data';
import { fmtTime } from '@/lib/format';
import { nextItem, teamSchedule } from '@/lib/tournament/schedule';

export const revalidate = 15;
export const dynamicParams = false;
export const generateStaticParams = () => DEFAULT_TEAMS.map((t) => ({ id: t.id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getPublicState();
  return { title: state.teamsById[id]?.name ?? 'Team' };
}

const ord = (n: number) => `${n}${['st', 'nd', 'rd', 'th'][Math.min(n, 4) - 1]}`;

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getPublicState();
  const team = state.teamsById[id];
  if (!team) notFound();

  const items = teamSchedule(state.games, id);
  const upcoming = nextItem(items);
  const pool = state.pools[`${team.division}${team.pool}`];
  const row = pool.rows.find((r) => r.teamId === id)!;
  const placing = state.placings[team.division].find((p) => p.teamId === id);

  return (
    <div className="space-y-5">
      <AutoRefresh generatedAt={new Date().toISOString()} />
      <div>
        <h1 className="heading text-[30px]">{team.name}</h1>
        <p className="text-sm text-ink-muted">
          <Link href={`/division/${DIVISIONS[team.division].slug}`} className="underline">
            {DIVISIONS[team.division].name}
          </Link>{' '}
          · Pool {team.pool} · {row.wins}W {row.losses}L · {row.pts} pts
          {row.played > 0 && row.position && ` · ${ord(row.position)} in pool`}
          {placing && ` · Final placing: ${placing.place}`}
        </p>
        <a
          href={`/team/${id}/calendar.ics`}
          className="mt-2 inline-block rounded bg-navy px-3 py-2 text-sm font-semibold text-white"
        >
          Add games and duties to my calendar
        </a>
        <p className="mt-1 text-xs text-ink-muted">
          Adds everything known now. Sunday playoff games are added once they&apos;re decided – add again on Sunday
          morning to update.
        </p>
      </div>

      {(['sat', 'sun'] as Day[]).map((day) => {
        const dayItems = items.filter((i) => i.game.day === day);
        return (
          <section key={day} className="space-y-2">
            <h2 className="heading text-xl">{DAYS[day].label}</h2>
            {dayItems.length === 0 && (
              <p className="text-sm text-ink-muted">
                {day === 'sun'
                  ? 'Your Sunday games appear here once the results that decide them are in.'
                  : 'Nothing on this day.'}
              </p>
            )}
            {dayItems.map((item) => {
              const isNext = upcoming === item;
              return (
                <div key={`${item.kind}-${item.game.code}`} className="space-y-1">
                  {item.hint && (
                    <p
                      className={`text-xs font-semibold ${item.hint.startsWith('Clash') ? 'text-live' : 'text-amber-700'}`}
                    >
                      ↓ {item.hint}
                    </p>
                  )}
                  {item.kind === 'play' ? (
                    <div className={isNext ? 'rounded ring-2 ring-navy' : ''}>
                      {isNext && <p className="heading bg-navy px-3 py-1 text-sm text-white">Up next</p>}
                      <GameCard game={item.game} highlightTeam={id} />
                    </div>
                  ) : (
                    <div className={`card flex gap-3 p-3 text-sm ${isNext ? 'ring-2 ring-navy' : ''}`}>
                      <span className="-skew-x-12 self-start bg-amber-400 px-2 font-cond text-[13px] font-extrabold uppercase text-navy">
                        Duty
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {fmtTime(item.game.time)} · Court {item.game.court}
                          {isNext && <span className="ml-2 text-xs font-normal text-ink-muted">(up next)</span>}
                        </p>
                        <p className="truncate">
                          Referee {item.game.code}: {item.game.t1.label} v {item.game.t2.label}
                        </p>
                        <p className="text-xs text-ink-muted">Supply the 1st and 2nd referee and two line judges.</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
