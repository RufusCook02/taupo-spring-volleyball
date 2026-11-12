import { TiebreakForm } from '@/components/admin/forms';
import { deleteTiebreak } from '@/app/admin/actions';
import { loadRaw } from '@/lib/data';
import { buildState } from '@/lib/tournament/state';
import { requireAdmin } from '@/lib/supabase/server';

export default async function AdminTies() {
  const { supabase } = await requireAdmin();
  const raw = await loadRaw(supabase);
  const state = buildState(raw);
  const name = (id: string) => state.teamsById[id]?.name ?? id;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Exact ties</h1>
      <p className="text-sm text-slate-600">
        When teams are level on wins, competition points and rally +/-, the organiser decides the order. Save it here and
        the standings, seeds and Sunday draw update. For anything else, override the teams on the game itself.
      </p>

      {state.tieIssues.length === 0 ? (
        <p className="rounded bg-green-100 p-2 text-sm text-green-800">No unresolved ties.</p>
      ) : (
        state.tieIssues.map((t) => (
          <section key={t.scope} className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
            <h2 className="font-semibold">{t.title}</h2>
            <p className="text-xs text-slate-500">Tied: {t.teamIds.map(name).join(', ')}. Pick the order, top first.</p>
            <TiebreakForm scope={t.scope} teams={t.teamIds.map((id) => ({ id, name: name(id) }))} />
          </section>
        ))
      )}

      {raw.tiebreaks.length > 0 && (
        <section className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
          <h2 className="font-semibold">Saved tie-breaks</h2>
          {raw.tiebreaks.map((tb) => (
            <form key={tb.scope} action={deleteTiebreak} className="flex flex-wrap items-center gap-2 text-sm">
              <input type="hidden" name="scope" value={tb.scope} />
              <code className="text-xs">{tb.scope}</code>
              <span>{tb.ordered_team_ids.map(name).join(' › ')}</span>
              <button className="ml-auto rounded border border-red-300 px-2 py-1 text-xs text-red-700">Remove</button>
            </form>
          ))}
        </section>
      )}
    </div>
  );
}
