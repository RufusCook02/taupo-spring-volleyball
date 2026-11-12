import { describe, expect, it } from 'vitest';
import { DEFAULT_TEAMS, GAMES } from '@/data/draw';
import { buildTeamIcs, startUtc } from '@/lib/ics';
import { blockersFor } from './blockers';
import { autoLiveCodes, courtsNow, minutesUntilStart, nzClock, withAutoLive } from './now';
import { teamSchedule } from './schedule';
import { describeSource, buildState } from './state';
import type { RawData, ScoreRow } from './types';
import { scoreWarnings } from './warnings';

const final = (code: string, t1Wins = true): ScoreRow => ({
  game_code: code,
  status: 'final',
  s1a: t1Wins ? 25 : 20,
  s1b: t1Wins ? 20 : 25,
  s2a: t1Wins ? 25 : 20,
  s2b: t1Wins ? 20 : 25,
  s3a: null,
  s3b: null,
});
const raw = (scores: ScoreRow[] = []): RawData => ({ teams: DEFAULT_TEAMS, scores, overrides: [], tiebreaks: [] });
const allPool = () => GAMES.filter((g) => g.stage === 'pool').map((g) => final(g.code));

describe('describeSource', () => {
  const none = () => [null, null] as [null, null];
  it('plain-English labels', () => {
    expect(describeSource('Seed 1', none)).toBe('Best pool winner');
    expect(describeSource('Seed 8', none)).toBe('2nd-best 3rd place');
    expect(describeSource('Seed 12', none)).toBe('3rd-best 4th place');
    expect(describeSource('Pool B 1st', none)).toBe('Pool B winner');
    expect(describeSource('Pool A 3rd', none)).toBe('Pool A 3rd place');
    expect(describeSource('Loser C19', none)).toBe('Loser of C19');
    expect(describeSource('Winner C19', () => ['Sharks', 'AC3'])).toBe('Winner of C19 (Sharks v AC3)');
    expect(describeSource('TVC', none)).toBe('TVC');
  });
});

describe('blockers', () => {
  it('playoff waiting on pool games, then on the earlier playoff', () => {
    const st = buildState(raw());
    const w15 = blockersFor(st, 'W15'); // Pool A 1st v Pool B 2nd
    expect(w15.games).toHaveLength(12); // all Women pool games
    expect(w15.games[0]).toBe('W1');

    const st2 = buildState(raw(allPool()));
    expect(blockersFor(st2, 'W15').games).toEqual([]);
    expect(blockersFor(st2, 'W20').games).toEqual(['W15', 'W16']);
    expect(blockersFor(st2, 'C25').games).toEqual(['C19', 'C22']);
  });

  it('chains through earlier playoffs whose teams are not known yet', () => {
    const st = buildState(raw(GAMES.filter((g) => g.stage === 'pool' && g.division !== 'C').map((g) => final(g.code))));
    const c31 = blockersFor(st, 'C31'); // Winner C25 v Winner C26 – needs QFs, which need all Comp pool games
    expect(c31.games).toContain('C25');
    expect(c31.games).toContain('C19');
    expect(c31.games).toContain('C17'); // Comp Pool C on Sunday
  });

  it('reports a pool tie', () => {
    // Women Pool A three-way tie (see state.test)
    const scores = allPool().map((s) => (s.game_code === 'W5' ? final('W5', false) : s));
    const st = buildState(raw(scores.map((s) => (s.game_code === 'W1' || s.game_code === 'W11' ? final(s.game_code) : s))));
    expect(blockersFor(st, 'W15').ties).toEqual(['pool:WA']);
  });
});

describe('teamSchedule', () => {
  it('mixes games and duties in time order with reminders', () => {
    const st = buildState(raw());
    const items = teamSchedule(st.games, 'WB3'); // Orcas: duty W1 8am, plays W4 9am, W6 11am, W12 5pm
    const sat = items.filter((i) => i.game.day === 'sat').map((i) => `${i.kind}:${i.game.code}`);
    expect(sat.slice(0, 3)).toEqual(['duty:W1', 'play:W4', 'play:W6']);
    expect(items[1].hint).toBe('Playing straight after your duty');
    expect(items[1].opponent).toBe('DA’Cubs - Pumas');
  });
});

describe('scoreWarnings', () => {
  const s = (a: (number | null)[]) => ({ s1a: a[0], s1b: a[1], s2a: a[2], s2b: a[3], s3a: a[4] ?? null, s3b: a[5] ?? null });
  it('flags sets not won by 2 and impossible overtime scores', () => {
    expect(scoreWarnings(s([25, 24, null, null]), 'in_progress')[0]).toMatch(/won by 2/);
    expect(scoreWarnings(s([28, 24, null, null]), 'in_progress')[0]).toMatch(/leads by 2/);
    expect(scoreWarnings(s([27, 25, 25, 20]), 'final')).toEqual([]);
    expect(scoreWarnings(s([25, 20, 20, 25, 15, 13]), 'final')).toEqual([]);
    expect(scoreWarnings(s([25, 20, 25, 20, 10, 15]), 'final')).toEqual(['Set 3 won’t count – the game was already decided 2–0.']);
  });
  it('time-out scores are fine', () => {
    expect(scoreWarnings(s([25, 20, 18, 15]), 'final')).toEqual([]);
  });
  it('notes scores on a scheduled game', () => {
    expect(scoreWarnings(s([10, 8, null, null]), 'scheduled')).toEqual(['Scores entered, so this will be saved as In progress.']);
  });
});

describe('time and courts', () => {
  const satNineFive = new Date('2026-11-13T20:05:00Z'); // Sat 14 Nov 9:05am NZDT

  it('reads NZ local time', () => {
    expect(nzClock(satNineFive)).toEqual({ date: '2026-11-14', minutes: 9 * 60 + 5 });
    expect(minutesUntilStart({ day: 'sat', time: '10:00' }, nzClock(satNineFive))).toBe(55);
    expect(minutesUntilStart({ day: 'sun', time: '08:00' }, nzClock(satNineFive))).toBe(1440 - 65);
  });

  it('shows a scheduled game as in progress once its start time passes', () => {
    const st = withAutoLive(buildState(raw([final('W1'), final('W2'), final('W3'), final('S1')])), satNineFive);
    const courts = courtsNow(st.games, 'sat');
    expect(courts[0].current?.code).toBe('W4');
    expect(courts[0].current?.status).toBe('in_progress');
    expect(courts[0].current?.autoLive).toBe(true);
    expect(courts[0].next?.code).toBe('W5');

    const early = withAutoLive(buildState(raw([final('W1')])), new Date('2026-11-13T19:55:00Z')); // 8:55am
    expect(courtsNow(early.games, 'sat')[0].current).toBeNull();
    expect(courtsNow(early.games, 'sat')[0].next?.code).toBe('W4');
  });

  it('does not auto-start a delayed game, or one whose court is still busy', () => {
    const delayed: ScoreRow = { ...final('W4'), status: 'delayed', s1a: null, s1b: null, s2a: null, s2b: null };
    const st = buildState(raw([final('W1'), delayed]));
    expect(autoLiveCodes(st.games, satNineFive).has('W4')).toBe(false);
    const courts = courtsNow(withAutoLive(st, satNineFive).games, 'sat');
    expect(courts[0].current).toBeNull();
    expect(courts[0].next?.code).toBe('W4'); // shown as Delayed

    // W1 still being played at 9:05 → W4 waits
    const busy = buildState(raw([{ ...final('W1'), status: 'in_progress' }]));
    expect(autoLiveCodes(busy.games, satNineFive).has('W4')).toBe(false);
  });

  it('does not auto-start a game whose teams are not decided', () => {
    const sun8 = new Date('2026-11-14T19:05:00Z'); // Sun 8:05am
    // No Saturday results entered: W13 (Pool A 3rd v Pool B 4th) can't be decided; C17 is a pool game.
    const none = autoLiveCodes(buildState(raw()).games, sun8);
    expect(none.has('C17')).toBe(true);
    expect(none.has('W13')).toBe(false);

    const satDone = buildState(raw(GAMES.filter((g) => g.day === 'sat').map((g) => final(g.code))));
    expect(autoLiveCodes(satDone.games, sun8).has('W13')).toBe(true);
  });
});

describe('calendar', () => {
  it('converts NZDT to UTC', () => {
    expect(startUtc('2026-11-14', '08:00').toISOString()).toBe('2026-11-13T19:00:00.000Z');
  });

  it('builds a valid calendar for a team', () => {
    const ics = buildTeamIcs(buildState(raw()), 'WB3', new Date('2026-11-12T00:00:00Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    // Orcas: plays W4, W6, W12; duty W1, W9 (Sunday games not known yet)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(5);
    expect(ics).toContain('DTSTART:20261113T190000Z'); // W1 duty 8am
    expect(ics).toContain('UID:W4-play-WB3@taupo-spring-volleyball');
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
