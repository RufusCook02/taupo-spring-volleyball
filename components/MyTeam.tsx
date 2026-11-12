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
  winner: 1 | 2 | null;
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
        <p className="mb-2 text-sm text-ink-muted">See all your games and duties here. Remembered on this phone.</p>
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
  const plays = (g: LiteGame) => g.t1.id === teamId || g.t2.id === teamId;
  // Every game the team plays or referees, in draw order.
  const items = [...games]
    .sort((a, b) => a.sort - b.sort)
    .filter((g) => plays(g) || g.duty.id === teamId)
    .map((g) => ({ game: g, kind: plays(g) ? ('play' as const) : ('duty' as const) }));
  const next = items.find((i) => i.game.status !== 'final');
  const opp = (g: LiteGame) => (g.t1.id === teamId ? g.t2.label : g.t1.label);
  const result = (g: LiteGame) => {
    if (g.status !== 'final' || g.winner === null) return null;
    const won = (g.winner === 1 ? g.t1.id : g.t2.id) === teamId;
    return won ? 'Won' : 'Lost';
  };
  const hasSunday = items.some((i) => i.game.day === 'sun' && i.kind === 'play');

  return (
    <section className="card">
      <div className="flex items-center justify-between bg-navy px-3 py-1.5 text-white">
        <h2 className="heading truncate text-xl">{team.name}</h2>
        <button type="button" onClick={() => choose(null)} className="shrink-0 text-xs text-[#B8C6DC] underline">
          Change team
        </button>
      </div>
      <ul className="divide-y divide-rule text-[15px]">
        {items.map(({ game: g, kind }) => {
          const done = g.status === 'final';
          const isNext = next?.game === g;
          const res = kind === 'play' ? result(g) : null;
          return (
            <li
              key={`${kind}-${g.code}`}
              className={`flex gap-3 px-3 py-2 ${done ? 'text-ink-muted' : ''} ${isNext ? 'bg-mist' : ''}`}
            >
              <span className="w-14 shrink-0 font-cond font-extrabold uppercase text-ink-muted">
                {kind === 'play' ? 'Play' : 'Duty'}
              </span>
              <div className="min-w-0">
                <span className={`font-semibold ${g.status === 'in_progress' ? 'text-live' : ''}`}>
                  {when(g)}
                  {isNext && <span className="ml-2 text-xs font-normal text-ink-muted">(up next)</span>}
                  {res && <span className="ml-2 text-xs font-normal">{res}</span>}
                  {kind === 'duty' && done && <span className="ml-2 text-xs font-normal">Done</span>}
                </span>
                <span className="block truncate">
                  {kind === 'play' ? `${g.code} v ${opp(g)}` : `Ref ${g.code}: ${g.t1.label} v ${g.t2.label}`}
                </span>
              </div>
            </li>
          );
        })}
        {!hasSunday && (
          <li className="px-3 py-2 text-sm text-ink-muted">Sunday games appear here as the results that decide them come in.</li>
        )}
      </ul>
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
