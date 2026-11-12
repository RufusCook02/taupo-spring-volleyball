// Calendar file (.ics) for one team: games and duties known right now.
import { DAYS } from '@/data/draw';
import { teamSchedule } from '@/lib/tournament/schedule';
import type { TournamentState } from '@/lib/tournament/types';

// New Zealand daylight time (UTC+13) is in force for the whole tournament weekend.
const NZ_OFFSET_HOURS = 13;
const GAME_MINUTES = 50;

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

export function startUtc(date: string, time: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - NZ_OFFSET_HOURS, mi));
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold lines longer than 75 bytes (RFC 5545), without splitting a multi-byte character. */
const enc = new TextEncoder();
const fold = (line: string) => {
  const parts: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = parts.length ? 74 : 75; // continuation lines start with a space
    if (bytes + n > limit) {
      parts.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  parts.push(cur);
  return parts.join('\r\n ');
};

export function buildTeamIcs(state: TournamentState, teamId: string, now = new Date()): string {
  const team = state.teamsById[teamId];
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Taupo Volleyball Club//Spring Volleyball 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(`${team?.name ?? teamId} – Taupō Spring Volleyball`)}`,
  ];
  for (const item of teamSchedule(state.games, teamId)) {
    const g = item.game;
    const start = startUtc(DAYS[g.day].date, g.time);
    const end = new Date(start.getTime() + GAME_MINUTES * 60_000);
    const summary =
      item.kind === 'play'
        ? `${g.code}: v ${item.opponent} – Court ${g.court}`
        : `Duty (ref) ${g.code}: ${g.t1.label} v ${g.t2.label} – Court ${g.court}`;
    const desc = `${g.label}. ${item.kind === 'duty' ? 'Your team supplies the referees and line judges. ' : ''}Times are a guide – check the live draw on the day.`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${g.code}-${item.kind}-${teamId}@taupo-spring-volleyball`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(summary)}`,
      `LOCATION:${esc(`Court ${g.court}`)}`,
      `DESCRIPTION:${esc(desc)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
