'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fmtTime } from '@/lib/format';

export interface LiteSlot {
  id: string | null;
  label: string;
}
export interface LiteGame {
  code: string;
  day: 'sat' | 'sun';
  time: string;
  court: number;
  sort: number;
  status: 'scheduled' | 'delayed' | 'in_progress' | 'final';
  t1: LiteSlot;
  t2: LiteSlot;
  duty: LiteSlot;
}
export interface LiteTeam {
  id: string;
  name: string;
  group: string; // 'Women Pool A'
}

const KEY = 'tvc-my-team';
const read = () => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const write = (v: string | null) => {
  try {
    if (v) window.localStorage.setItem(KEY, v);
    else window.localStorage.removeItem(KEY);
  } catch {
    // storage blocked – the choice just won't be remembered
  }
};

const when = (g: LiteGame) =>
  g.status === 'in_progress'
    ? `Now · Court ${g.court}`
    : `${g.day === 'sat' ? 'Sat' : 'Sun'} ${fmtTime(g.time)}${g.status === 'delayed' ? ' (delayed)' : ''} · Court ${g.court}`;

/** Pick your team once (remembered on this phone) and see your next game and duty at a glance. */
export default function MyTeam({ games, teams }: { games: LiteGame[]; teams: LiteTeam[] }) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = read();
    if (saved && teams.some((t) => t.id === saved)) setTeamId(saved);
    setReady(true);
  }, [teams]);

  const choose = (id: string | null) => {
    setTeamId(id);
    write(id);
  };

  if (!ready) return <div className="card h-[132px]" aria-hidden />;

  if (!teamId) {
    const groups = [...new Set(teams.map((t) => t.group))];
    return (
      <section className="card p-3">
        <h2 className="heading mb-1 text-xl">Follow your team</h2>
        <p className="mb-2 text-sm text-ink-muted">See your next game and duty here. Remembered on this phone.</p>
        <select
          className="w-full rounded border border-rule bg-white p-3 text-base"
          defaultValue=""
          onChange={(e) => e.target.value && choose(e.target.value)}
          aria-label="Choose your team"
        >
          <option value="" disabled>
            Choose your team…
          </option>
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
      </section>
    );
  }

  const team = teams.find((t) => t.id === teamId)!;
  const sorted = [...games].sort((a, b) => a.sort - b.sort);
  const nextGame = sorted.find((g) => g.status !== 'final' && (g.t1.id === teamId || g.t2.id === teamId));
  const nextDuty = sorted.find((g) => g.status !== 'final' && g.duty.id === teamId);
  const opp = (g: LiteGame) => (g.t1.id === teamId ? g.t2.label : g.t1.label);

  return (
    <section className="card">
      <div className="flex items-center justify-between bg-navy px-3 py-1.5 text-white">
        <h2 className="heading truncate text-xl">{team.name}</h2>
        <button type="button" onClick={() => choose(null)} className="shrink-0 text-xs text-[#B8C6DC] underline">
          Change team
        </button>
      </div>
      <dl className="divide-y divide-rule text-[15px]">
        <div className="flex gap-3 px-3 py-2">
          <dt className="w-14 shrink-0 font-cond font-extrabold uppercase text-ink-muted">Play</dt>
          <dd className="min-w-0">
            {nextGame ? (
              <>
                <span className={`font-semibold ${nextGame.status === 'in_progress' ? 'text-live' : ''}`}>{when(nextGame)}</span>
                <span className="block truncate">
                  {nextGame.code} v {opp(nextGame)}
                </span>
              </>
            ) : (
              <span className="text-ink-muted">No more games known yet. Sunday games appear as results come in.</span>
            )}
          </dd>
        </div>
        <div className="flex gap-3 px-3 py-2">
          <dt className="w-14 shrink-0 font-cond font-extrabold uppercase text-ink-muted">Duty</dt>
          <dd className="min-w-0">
            {nextDuty ? (
              <>
                <span className="font-semibold">{when(nextDuty)}</span>
                <span className="block truncate">
                  Ref {nextDuty.code}: {nextDuty.t1.label} v {nextDuty.t2.label}
                </span>
              </>
            ) : (
              <span className="text-ink-muted">No duty coming up.</span>
            )}
          </dd>
        </div>
      </dl>
      <div className="flex gap-4 bg-mist px-3 py-2 text-sm">
        <Link href={`/team/${teamId}`} className="font-semibold underline">
          Full schedule
        </Link>
        <a href={`/team/${teamId}/calendar.ics`} className="font-semibold underline">
          Add to calendar
        </a>
      </div>
    </section>
  );
}
