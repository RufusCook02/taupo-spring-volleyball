import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DIVISIONS, type Division } from '@/data/draw';
import AutoRefresh from '@/components/AutoRefresh';
import GameCard from '@/components/GameCard';
import StandingsTable from '@/components/StandingsTable';
import { getPublicState } from '@/lib/data';
import { DIV_BY_SLUG, fmtDiff } from '@/lib/format';

export const revalidate = 15;
export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(DIV_BY_SLUG).map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const d = DIV_BY_SLUG[(await params).slug];
  return { title: d ? DIVISIONS[d].name : '' };
}

// Playoff rounds shown as bracket columns.
const ROUNDS: Record<Division, { title: string; codes: string[] }[]> = {
  W: [
    { title: '5th–8th crossovers', codes: ['W13', 'W14'] },
    { title: 'Semi-finals', codes: ['W15', 'W16'] },
    { title: 'Placing games', codes: ['W17', 'W18', 'W19'] },
    { title: 'Final', codes: ['W20'] },
  ],
  S: [
    { title: '5th–8th crossovers', codes: ['S15', 'S16'] },
    { title: 'Semi-finals', codes: ['S13', 'S14'] },
    { title: 'Placing games', codes: ['S17', 'S18', 'S19'] },
    { title: 'Final', codes: ['S20'] },
  ],
  C: [
    { title: 'Quarter-finals', codes: ['C19', 'C20', 'C21', 'C22'] },
    { title: 'Semi-finals', codes: ['C25', 'C26'] },
    { title: 'Final & bronze', codes: ['C31', 'C32'] },
    { title: '5th–8th', codes: ['C27', 'C28', 'C29', 'C30'] },
    { title: '9th–12th', codes: ['C23', 'C24', 'C33', 'C34'] },
  ],
};

export default async function DivisionPage({ params }: { params: Promise<{ slug: string }> }) {
  const division = DIV_BY_SLUG[(await params).slug];
  if (!division) notFound();
  const state = await getPublicState();
  const names = Object.fromEntries(state.teams.map((t) => [t.id, t.name]));
  const pools = DIVISIONS[division].pools.map((p) => state.pools[`${division}${p}`]);
  const poolGames = state.games.filter((g) => g.division === division && g.stage === 'pool');
  const placings = state.placings[division];
  const anyPlaced = placings.some((p) => p.teamId);

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <h1 className="heading text-[30px]">{DIVISIONS[division].name}</h1>

      {anyPlaced && (
        <section>
          <h2 className="heading mb-2 text-xl">Final placings</h2>
          <ol className="card text-sm">
            {placings.map((p, i) => (
              <li key={i} className="flex gap-3 border-t px-3 py-1.5 first:border-t-0">
                <span className="w-10 font-semibold">{p.place}</span>
                <span className={p.teamId ? '' : 'italic text-ink-muted'}>{p.teamId ? names[p.teamId] : 'TBC'}</span>
                {p.note && p.teamId && <span className="ml-auto text-xs text-ink-muted">{p.note}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="heading mb-2 text-xl">Pool standings</h2>
        <p className="mb-2 text-xs text-ink-muted">
          Ranked by wins, then competition points (win 3, loss after winning a set 1, straight-set loss 0), then rally
          points +/-. Exact ties are decided by the organiser. Only final games count.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {pools.map((p) => (
            <StandingsTable key={p.key} pool={p} names={names} />
          ))}
        </div>
      </section>

      {division === 'C' && (
        <section>
          <h2 className="heading mb-2 text-xl">
            Playoff seeding {!state.seeding.ready && <span className="text-sm font-normal text-ink-muted">(provisional)</span>}
          </h2>
          <div className="card overflow-x-auto">
            <table className="tabular w-full text-sm">
              <thead className="bg-mist text-xs text-ink-muted">
                <tr>
                  <th className="px-2 py-1 text-left">Seed</th>
                  <th className="px-2 py-1 text-left">Team</th>
                  <th className="px-1 py-1">Pool</th>
                  <th className="px-1 py-1">W</th>
                  <th className="px-1 py-1">Pts</th>
                  <th className="px-2 py-1">+/-</th>
                </tr>
              </thead>
              <tbody>
                {state.seeding.rows.map((r) => (
                  <tr key={r.seed} className={`border-t ${r.seed === 9 ? 'border-t-2 border-t-navy' : ''}`}>
                    <td className="px-2 py-1.5 font-semibold">{r.seed}</td>
                    <td className="px-2 py-1.5">
                      {r.teamId ? (
                        <Link href={`/team/${r.teamId}`} className="hover:underline">
                          {names[r.teamId]}
                        </Link>
                      ) : (
                        <span className="italic text-amber-800">Tie – organiser to decide</span>
                      )}
                    </td>
                    <td className="px-1 text-center">{r.poolKey ? `${r.poolKey.slice(1)} ${['1st', '2nd', '3rd', '4th'][r.place - 1]}` : ''}</td>
                    <td className="px-1 text-center">{r.wins}</td>
                    <td className="px-1 text-center">{r.pts}</td>
                    <td className="px-2 text-center">{fmtDiff(r.diff)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Seeds 1–8 play quarter-finals (1v8, 2v7, 3v6, 4v5). Seeds 9–12 play 9th–12th semis (9v12, 10v11).
          </p>
        </section>
      )}

      <section>
        <h2 className="heading mb-2 text-xl">Playoffs (Sunday)</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {ROUNDS[division].map((round) => (
            <div key={round.title} className="w-72 shrink-0 space-y-2">
              <h3 className="heading text-lg text-ink-muted">{round.title}</h3>
              {round.codes.map((code) => (
                <GameCard key={code} game={state.gamesByCode[code]} />
              ))}
            </div>
          ))}
        </div>
        {division === 'C' && (
          <p className="text-xs text-ink-muted">
            The 4pm 9th/10th and 11th/12th games are optional. If they aren&apos;t played, the 9th–12th semi winners share
            9th and the losers share 11th.
          </p>
        )}
      </section>

      <section>
        <h2 className="heading mb-2 text-xl">Pool games</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {poolGames.map((g) => (
            <GameCard key={g.code} game={g} showDay />
          ))}
        </div>
      </section>
    </div>
  );
}
