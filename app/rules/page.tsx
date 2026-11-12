export const metadata = { title: 'Rules' };
export const revalidate = 60; // keeps the announcement banner current

// From the Rules sheet of Taupo_Spring_Volleyball_2026.xlsx, plus TVC's ruling on level totals at a set-2 time-out.
const SECTIONS: { title: string; items: React.ReactNode[] }[] = [
  {
    title: 'Pool games (Saturday, and Comp Pool C on Sunday 8am)',
    items: [
      '50-minute match clock. 10 minutes between scheduled games for warm-up and changeover.',
      'Best of 3 sets: sets 1 and 2 to 25, set 3 to 15. Win each set by 2.',
      'On the buzzer, finish the rally already started (referee’s service whistle).',
      <>
        <strong>Time runs out in set 2:</strong> total points across sets 1 and 2 decide the game. If the totals are level,
        play one more point. If that point isn’t played, the set 1 winner wins.
      </>,
      <>
        <strong>Time runs out in set 3:</strong> the team ahead in set 3 at the buzzer wins. If set 3 is level, play one
        more point.
      </>,
      'If a game is decided in 2 sets, any third set played does not count towards rally points.',
      'No timeouts. Substitutions between points, no limit.',
    ],
  },
  {
    title: 'Every game',
    items: [
      'At least 4 players on court at the start of each game.',
      'After the 5-minute warm-up, a team that isn’t ready concedes 1 point per minute.',
      'The duty team supplies the 1st referee, 2nd referee and two line judges. "TVC" means club referees.',
    ],
  },
  {
    title: 'Pool points and placings',
    items: [
      'Win: 3 points. Loss after winning 1 of the first 2 sets: 1 point. Straight-set loss: 0.',
      'Placings: most wins, then competition points, then rally-point difference (+/-).',
      'Exact ties are decided by the organiser.',
    ],
  },
  {
    title: 'Sunday playoffs',
    items: [
      'Best of 3 sets (25, 25, 15), win by 2.',
      'One 20-second timeout per team per set.',
      'Comp quarter-finals (C19–C22) use pool rules: 50-minute clock, no timeouts, no overtime.',
      'All other playoffs have no time limit – published times are targets, not guarantees.',
    ],
  },
  {
    title: 'Playoff format',
    items: [
      <>
        <strong>Women and Social:</strong> semi-finals are Pool A 1st v Pool B 2nd and Pool B 1st v Pool A 2nd. 3rd and
        4th places play crossovers for 5th–8th. Then finals for every place 1st to 8th.
      </>,
      <>
        <strong>Competitive:</strong> pool winners are seeds 1–3, 2nd places 4–6, 3rd places 7–9 and 4th places 10–12
        (ranked across pools by wins, points, then +/-). Quarter-finals 1v8, 2v7, 3v6, 4v5 lead to semis, the final and
        bronze; quarter-final losers play off for 5th–8th. Seeds 9–12 play semis (9v12, 10v11).
      </>,
      'The 4pm Comp 9th/10th and 11th/12th games are optional. If they aren’t played, the semi winners share 9th and the losers share 11th.',
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="space-y-4">
      <h1 className="heading text-[30px]">Rules</h1>
      {SECTIONS.map((s) => (
        <section key={s.title} className="card">
          <h2 className="heading border-b-[3px] border-navy px-3 py-2 text-xl">{s.title}</h2>
          <ul className="divide-y divide-rule text-[15px]">
            {s.items.map((item, i) => (
              <li key={i} className="px-3 py-2.5">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-xs text-ink-muted">Questions on the day? Ask at the TVC desk.</p>
    </div>
  );
}
