import { DIVISIONS, type Division } from '@/data/draw';
import { loadRaw } from '@/lib/data';
import { buildState } from '@/lib/tournament/state';
import { requireAdmin } from '@/lib/supabase/server';

export default async function Results() {
  const { supabase } = await requireAdmin();
  const state = buildState(await loadRaw(supabase));
  const name = (id: string | null) => (id ? (state.teamsById[id]?.name ?? id) : null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading text-[26px]">Results summary</h1>
        <p className="text-sm text-ink-muted">
          Final placings and pool winners, ready to screenshot. Places fill in as the finals are marked Final.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(DIVISIONS) as Division[]).map((d) => {
          const winners = DIVISIONS[d].pools.map((p) => {
            const pool = state.pools[`${d}${p}`];
            const top = pool.complete ? pool.rows.find((r) => r.position === 1) : undefined;
            return { pool: p, team: name(top?.teamId ?? null) };
          });
          return (
            <section key={d} className="card">
              <h2 className="heading bg-navy px-3 py-2 text-xl text-white">{DIVISIONS[d].name}</h2>
              <ol className="divide-y divide-rule text-[15px]">
                {state.placings[d].map((p, i) => (
                  <li key={i} className="flex gap-3 px-3 py-1.5">
                    <span
                      className={`w-11 shrink-0 font-cond text-lg font-extrabold ${i < 3 && !p.place.includes('=') ? 'text-navy' : 'text-ink-muted'}`}
                    >
                      {p.place}
                    </span>
                    <span className={p.teamId ? 'font-semibold' : 'italic text-ink-muted'}>{name(p.teamId) ?? 'TBC'}</span>
                  </li>
                ))}
              </ol>
              <div className="border-t-[3px] border-navy px-3 py-2 text-sm">
                <p className="heading mb-1 text-base">Pool winners</p>
                {winners.map((w) => (
                  <p key={w.pool}>
                    Pool {w.pool}: {w.team ?? <span className="italic text-ink-muted">TBC</span>}
                  </p>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
