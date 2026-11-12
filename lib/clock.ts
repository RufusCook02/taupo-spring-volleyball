import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The current time for tournament logic (auto-live, "on court now", dashboard).
 *
 * Testing aid: in local development only, if a file named `.dryrun-clock` exists in the project folder and holds
 * an ISO time (e.g. 2026-11-13T20:05:00Z = Sat 9:05am NZDT), that time is used instead. The file is git-ignored
 * and this override never applies in production (Vercel).
 */
export function appNow(): Date {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const text = fs.readFileSync(path.join(process.cwd(), '.dryrun-clock'), 'utf8').trim();
      const d = new Date(text);
      if (!Number.isNaN(d.getTime())) return d;
    } catch {
      // no override file – use the real time
    }
  }
  return new Date();
}
