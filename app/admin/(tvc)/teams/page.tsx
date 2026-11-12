import { DIVISIONS, type Division } from '@/data/draw';
import { RenameForm } from '@/components/admin/forms';
import { loadRaw } from '@/lib/data';
import { requireAdmin } from '@/lib/supabase/server';

export default async function AdminTeams() {
  const { supabase } = await requireAdmin();
  const { teams } = await loadRaw(supabase);
  return (
    <div className="space-y-4">
      <h1 className="heading text-[26px]">Team names</h1>
      <p className="text-sm text-ink-muted">Renaming a team updates it everywhere in the draw.</p>
      {(Object.keys(DIVISIONS) as Division[]).map((d) => (
        <section key={d} className="space-y-2 card p-3">
          <h2 className="heading text-xl">{DIVISIONS[d].name}</h2>
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
