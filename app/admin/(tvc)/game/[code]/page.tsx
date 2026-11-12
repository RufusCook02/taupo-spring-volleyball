import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DAYS, DIVISIONS, GAMES } from '@/data/draw';
import { OverrideForm, ScoreForm } from '@/components/admin/forms';
import { clearScore } from '@/app/admin/actions';
import { loadRaw } from '@/lib/data';
import { fmtNz, fmtTime } from '@/lib/format';
import { buildState } from '@/lib/tournament/state';
import { requireAdmin } from '@/lib/supabase/server';

export default async function AdminGame({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!GAMES.some((g) => g.code === code)) notFound();
  const { supabase } = await requireAdmin();
  const raw = await loadRaw(supabase);
  const state = buildState(raw);
  const g = state.gamesByCode[code];
  const ov = Object.fromEntries(raw.overrides.filter((o) => o.game_code === code).map((o) => [o.slot, o.team_id]));

  // Auto value = what the draw resolves to without any override.
  const auto = buildState({ ...raw, overrides: raw.overrides.filter((o) => o.game_code !== code) }).gamesByCode[code];
  const autoText = (slot: { label: string; source: string; teamId: string | null }) =>
    slot.teamId ? `${slot.label}${slot.source.startsWith('spot:') ? '' : ` (${slot.source})`}` : slot.label;

  const teams = [...state.teams]
    .sort((a, b) => (a.division === g.division ? -1 : 0) - (b.division === g.division ? -1 : 0))
    .map((t) => ({ id: t.id, name: t.name, group: `${DIVISIONS[t.division].name} Pool ${t.pool}` }));

  return (
    <div className="space-y-4">
      <Link href={`/admin?day=${g.day}&court=${g.court}`} className="text-sm underline">
        ← Back to court {g.court}
      </Link>
      <div>
        <h1 className="heading text-[26px]">
          {g.code} · {g.label}
        </h1>
        <p className="text-sm text-ink-muted">
          {DAYS[g.day].short} {fmtTime(g.time)} · Court {g.court} · Duty: {g.dutySlot.label}
          {g.updatedAt && ` · Last saved ${fmtNz(g.updatedAt)}`}
        </p>
        {g.stage === 'playoff' && !['C19', 'C20', 'C21', 'C22'].includes(g.code) && (
          <p className="text-xs text-ink-muted">Playoff: no time limit, one 20-second timeout per team per set.</p>
        )}
      </div>

      <section className="card p-3">
        {g.t1.teamId && g.t2.teamId ? null : (
          <p className="mb-2 rounded bg-amber-50 p-2 text-xs text-amber-900">
            Teams aren&apos;t confirmed yet. You can still enter a score, or set the teams below.
          </p>
        )}
        <ScoreForm code={g.code} team1={g.t1.label} team2={g.t2.label} initial={g.scores} status={g.status} />
        <form action={clearScore} className="mt-3 border-t pt-3">
          <input type="hidden" name="code" value={g.code} />
          <button className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700">
            Clear score (back to scheduled)
          </button>
        </form>
      </section>

      <section className="card p-3">
        <h2 className="heading mb-1 text-xl">Teams for this game</h2>
        <p className="mb-2 text-xs text-ink-muted">
          Normally automatic from the draw. Override only if the organiser has decided otherwise (e.g. after a tie-break or a
          forfeit).
        </p>
        <OverrideForm
          code={g.code}
          teams={teams}
          slots={[
            { slot: 'team1', label: 'Team 1', auto: autoText(auto.t1), current: ov.team1 ?? '' },
            { slot: 'team2', label: 'Team 2', auto: autoText(auto.t2), current: ov.team2 ?? '' },
            { slot: 'duty', label: 'Duty', auto: autoText(auto.dutySlot), current: ov.duty ?? '' },
          ]}
        />
      </section>
    </div>
  );
}
