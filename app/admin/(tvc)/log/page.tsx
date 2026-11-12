import { fmtNz } from '@/lib/format';
import { requireAdmin } from '@/lib/supabase/server';

type Json = Record<string, unknown> | null;

const HIDDEN = new Set(['updated_at', 'updated_by']);

/** Only the fields that changed, as 'field: old → new'. */
function changes(oldV: Json, newV: Json): string[] {
  const keys = new Set([...Object.keys(oldV ?? {}), ...Object.keys(newV ?? {})]);
  const out: string[] = [];
  for (const k of keys) {
    if (HIDDEN.has(k)) continue;
    const a = JSON.stringify(oldV?.[k] ?? null);
    const b = JSON.stringify(newV?.[k] ?? null);
    if (a !== b) out.push(`${k}: ${oldV ? a : '–'} → ${newV ? b : '–'}`);
  }
  return out;
}

export default async function AdminLog() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('change_log')
    .select('id, at, user_email, table_name, row_key, action, old_value, new_value')
    .order('at', { ascending: false })
    .limit(300);

  return (
    <div className="space-y-3">
      <h1 className="heading text-[26px]">Change log</h1>
      <p className="text-sm text-ink-muted">Latest 300 changes, newest first.</p>
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error.message}</p>}
      <ul className="space-y-2">
        {(data ?? []).map((r) => (
          <li key={r.id} className="card p-3 text-sm">
            <div className="flex flex-wrap gap-x-2 text-xs text-ink-muted">
              <span>{fmtNz(r.at)}</span>
              <span>{r.user_email ?? 'system'}</span>
              <span className="ml-auto font-semibold text-navy">
                {r.table_name} {r.row_key} · {r.action}
              </span>
            </div>
            <ul className="tabular mt-1 text-xs">
              {changes(r.old_value as Json, r.new_value as Json).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
