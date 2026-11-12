import { DIVISIONS, type Division } from '@/data/draw';
import { RenameForm } from '@/components/admin/forms';
import { loadRaw } from '@/lib/data';
import { requireAdmin } from '@/lib/supabase/server';

export default async function AdminTeams() {
  const { supabase } = await requireAdmin();
  const { teams } = await loadRaw(supabase);
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Team names</h1>
      <p className="text-sm text-slate-600">Renaming a team updates it everywhere in the draw.</p>
      {(Object.keys(DIVISIONS) as Division[]).map((d) => (
        <section key={d} className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
          <h2 className="font-semibold">{DIVISIONS[d].name}</h2>
          {teams
            .filter((t) => t.division === d)
            .map((t) => (
              <RenameForm key={t.id} id={t.id} name={t.name} />
            ))}
        </section>
      ))}
    </div>
  );
}
