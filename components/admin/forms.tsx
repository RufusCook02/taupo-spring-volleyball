'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  renameTeam,
  saveAnnouncement,
  saveOverrides,
  saveScore,
  saveTiebreak,
  signIn,
  type ActionState,
} from '@/app/admin/actions';
import { gameResult, type SetScores } from '@/lib/tournament/result';
import type { GameStatus } from '@/lib/tournament/types';
import { scoreWarnings } from '@/lib/tournament/warnings';

function Submit({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg bg-navy px-4 py-3 font-semibold text-white disabled:opacity-50 ${className}`}
    >
      {pending ? 'Saving…' : children}
    </button>
  );
}

function Message({ state }: { state: ActionState }) {
  if (state.error) return <p className="rounded bg-red-100 p-2 text-sm text-red-800">{state.error}</p>;
  if (state.ok) return <p className="rounded bg-green-100 p-2 text-sm text-green-800">{state.ok}</p>;
  return null;
}

// ---------- login ----------

export function LoginForm() {
  const [state, action] = useActionState(signIn, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        Email
        <input name="email" type="email" autoComplete="username" required className="mt-1 w-full rounded border p-3" />
      </label>
      <label className="block text-sm">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded border p-3" />
      </label>
      <Message state={state} />
      <Submit className="w-full">Sign in</Submit>
    </form>
  );
}

// ---------- score entry ----------

const KEYS = ['s1a', 's1b', 's2a', 's2b', 's3a', 's3b'] as const;

export function ScoreForm({
  code,
  team1,
  team2,
  initial,
  status,
}: {
  code: string;
  team1: string;
  team2: string;
  initial: SetScores;
  status: GameStatus;
}) {
  const [state, action] = useActionState(saveScore, {});
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(KEYS.map((k) => [k, initial[k] == null ? '' : String(initial[k])])),
  );
  const num = (k: (typeof KEYS)[number]) => (vals[k] === '' || isNaN(Number(vals[k])) ? null : Number(vals[k]));
  const current: SetScores = { s1a: num('s1a'), s1b: num('s1b'), s2a: num('s2a'), s2b: num('s2b'), s3a: num('s3a'), s3b: num('s3b') };
  const preview = gameResult(current);
  const [statusSel, setStatusSel] = useState<GameStatus>(status);
  const warnings = scoreWarnings(current, statusSel);

  const input = (k: (typeof KEYS)[number]) => (
    <input
      name={k}
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      value={vals[k]}
      onChange={(e) => setVals({ ...vals, [k]: e.target.value.replace(/\D/g, '') })}
      className="tabular w-16 rounded border p-3 text-center text-lg"
      aria-label={k}
    />
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-ink-muted">
            <th className="pb-1">Set</th>
            <th className="pb-1 text-center">{team1}</th>
            <th className="pb-1 text-center">{team2}</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((n) => (
            <tr key={n}>
              <td className="py-1 font-semibold">
                {n}
                <span className="block text-[10px] font-normal text-ink-muted">to {n === 3 ? 15 : 25}</span>
              </td>
              <td className="py-1 text-center">{input(`s${n}a` as (typeof KEYS)[number])}</td>
              <td className="py-1 text-center">{input(`s${n}b` as (typeof KEYS)[number])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-ink-muted">
        Time ran out in set 2? Leave set 3 blank – total points across sets 1 and 2 decide. If the totals were level
        and an extra point was played, add it to the set 2 score. If no extra point was played, the set 1 winner wins.
      </p>

      {num('s3a') != null && num('s3a') === num('s3b') && (
        <p className="rounded bg-amber-50 p-2 text-sm text-amber-900">
          Set 3 is level – teams play one more point. Add it to the set 3 score before saving as Final.
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="space-y-1 rounded bg-amber-50 p-2 text-sm text-amber-900" aria-live="polite">
          {warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
          <li className="text-xs">Check the score sheet. You can still save if it&apos;s right.</li>
        </ul>
      )}

      <div className="rounded bg-mist p-2 text-sm">
        {preview.played ? (
          <>
            Result: <strong>{preview.aWins ? team1 : team2}</strong> win · points {preview.ptsA}–{preview.ptsB} · rally{' '}
            {preview.rallyDiffA > 0 ? '+' : ''}
            {preview.rallyDiffA} for {team1}
          </>
        ) : (
          <span className="text-ink-muted">Enter set 1 to see the result.</span>
        )}
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 text-sm font-semibold">Status</legend>
        {(
          [
            ['scheduled', 'Scheduled'],
            ['delayed', 'Delayed'],
            ['in_progress', 'In progress'],
            ['final', 'Final'],
          ] as const
        ).map(([v, label]) => (
          <label key={v} className="flex items-center gap-2 rounded border bg-white px-3 py-2">
            <input type="radio" name="status" value={v} checked={statusSel === v} onChange={() => setStatusSel(v)} />
            {label}
          </label>
        ))}
      </fieldset>
      <p className="text-xs text-ink-muted">
        Scheduled games show as live on the public site once their start time passes. Choose Delayed to stop that.
        Only Final games count for standings and fill in the next round.
      </p>

      <Message state={state} />
      <Submit className="w-full">Save score</Submit>
    </form>
  );
}

// ---------- team overrides ----------

export function OverrideForm({
  code,
  slots,
  teams,
}: {
  code: string;
  slots: { slot: 'team1' | 'team2' | 'duty'; label: string; auto: string; current: string }[];
  teams: { id: string; name: string; group: string }[];
}) {
  const [state, action] = useActionState(saveOverrides, {});
  const groups = [...new Set(teams.map((t) => t.group))];
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="code" value={code} />
      {slots.map((s) => (
        <label key={s.slot} className="block text-sm">
          {s.label}
          <select name={s.slot} defaultValue={s.current} className="mt-1 w-full rounded border bg-white p-3">
            <option value="">Automatic – {s.auto}</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {teams
                  .filter((t) => t.group === g)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      ))}
      <Message state={state} />
      <Submit>Save teams</Submit>
    </form>
  );
}

// ---------- rename ----------

export function RenameForm({ id, name }: { id: string; name: string }) {
  const [state, action] = useActionState(renameTeam, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="w-10 text-xs text-ink-muted">{id}</span>
      <input name="name" defaultValue={name} maxLength={60} required className="min-w-0 flex-1 rounded border p-2" />
      <Submit className="px-3 py-2 text-sm">Save</Submit>
      {(state.error || state.ok) && (
        <div className="w-full">
          <Message state={state} />
        </div>
      )}
    </form>
  );
}

// ---------- tie-break ----------

export function TiebreakForm({ scope, teams }: { scope: string; teams: { id: string; name: string }[] }) {
  const [state, action] = useActionState(saveTiebreak, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="scope" value={scope} />
      <input type="hidden" name="teams" value={teams.map((t) => t.id).join(',')} />
      {teams.map((_, i) => (
        <label key={i} className="flex items-center gap-2 text-sm">
          <span className="w-16">Ahead #{i + 1}</span>
          <select name={`pos${i}`} defaultValue={teams[i].id} className="flex-1 rounded border bg-white p-2">
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      ))}
      <Message state={state} />
      <Submit className="px-3 py-2 text-sm">Save order</Submit>
    </form>
  );
}

// ---------- announcement ----------

export function AnnouncementForm({ current }: { current: string | null }) {
  const [state, action] = useActionState(saveAnnouncement, {});
  const [text, setText] = useState(current ?? '');
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        Message shown at the top of every public page (max 280 characters)
        <textarea
          name="message"
          maxLength={280}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Court 3 is running about 20 minutes late"
          className="mt-1 w-full rounded border p-3 text-base"
        />
      </label>
      <p className="text-xs text-ink-muted">{280 - text.length} characters left</p>
      <Message state={state} />
      <div className="flex gap-2">
        <Submit>Show announcement</Submit>
        <button
          type="submit"
          name="clear"
          value="1"
          onClick={() => setText('')}
          className="rounded-lg border border-red-300 px-4 py-3 text-sm text-red-700"
        >
          Clear
        </button>
      </div>
    </form>
  );
}