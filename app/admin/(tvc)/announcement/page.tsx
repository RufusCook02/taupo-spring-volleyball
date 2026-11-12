import { AnnouncementForm } from '@/components/admin/forms';
import { loadRaw } from '@/lib/data';
import { requireAdmin } from '@/lib/supabase/server';

export default async function AnnouncementPage() {
  const { supabase } = await requireAdmin();
  const { announcement } = await loadRaw(supabase);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading text-[26px]">Announcement</h1>
        <p className="text-sm text-ink-muted">
          A short notice at the top of every public page, e.g. a court running late or a change of plan. Leave empty
          for none.
        </p>
      </div>
      <section className="card p-3">
        <p className="mb-2 text-sm">
          Showing now:{' '}
          {announcement ? <strong>{announcement}</strong> : <span className="italic text-ink-muted">nothing</span>}
        </p>
        <AnnouncementForm current={announcement ?? null} />
      </section>
    </div>
  );
}
