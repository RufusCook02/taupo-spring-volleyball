import Link from 'next/link';
import { DIVISIONS, type Division } from '@/data/draw';
import { getPublicState } from '@/lib/data';

export const revalidate = 60;
export const metadata = { title: 'Teams' };

export default async function TeamsPage() {
  const state = await getPublicState();
  return (
    <div className="space-y-4">
      <h1 className="heading text-[30px]">Teams</h1>
      <p className="text-sm text-ink-muted">Pick a team to see its games and duty times.</p>
      {(Object.keys(DIVISIONS) as Division[]).map((d) => (
        <section key={d}>
          <h2 className="heading mb-2 text-xl">{DIVISIONS[d].name}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {DIVISIONS[d].pools.map((p) => (
              <div key={p} className="card p-3">
                <h3 className="mb-1 text-xs font-semibold uppercase text-ink-muted">Pool {p}</h3>
                <ul className="space-y-1">
                  {state.teams
                    .filter((t) => t.division === d && t.pool === p)
                    .map((t) => (
                      <li key={t.id}>
                        <Link href={`/team/${t.id}`} className="block py-1 underline">
                          {t.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
