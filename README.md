# Taupō Spring Volleyball 2026 – results site

Public draw, live scores, pool standings and playoff brackets for 14–15 November 2026, plus a TVC login for score entry.

- **Stack:** Next.js 15 (App Router) on Vercel · Supabase (Postgres + Auth) · Tailwind.
- **Draw** is fixed and lives in code: [`data/draw.ts`](data/draw.ts) (generated from `Taupo_Spring_Volleyball_2026.xlsx`).
- **Database** holds only what changes: team names, scores, manual team overrides, tie-break orders, admins and a change log.
- **Scoring logic** in [`lib/tournament/`](lib/tournament) ports the spreadsheet's Calc sheet (game result, rally +/-, pool points, placings, Comp seeding). Tests: `npm test`.

## How it behaves

- Public pages are cached and regenerated at most every 15 s; every TVC save also refreshes them immediately. Open pages re-check every 20 s.
- Only games marked **Final** count towards standings and fill in later games (`Pool A 1st`, `Seed 3`, `Winner C19`). Games marked **In progress** show as LIVE.
- **Exact ties** (wins, points and rally +/- all equal) are flagged, not broken. TVC sets the order on **Admin → Ties**. Any team on any game can also be overridden by hand on the game's admin page.
- Comp 9th–12th: if the optional 4pm games (C33, C34) aren't played, C23/C24 winners share 9th and losers share 11th.
- Difference from the spreadsheet: the sheet breaks exact ties by spot/pool order; the site waits for the organiser (per the brief).

## One-time setup

### 1. Tools
Install **Node.js 22 LTS** (https://nodejs.org). Then in this folder:

```bash
npm install
```

```bash
npm test
```

### 2. Supabase
1. Create a project at https://supabase.com (region: **Sydney**).
2. Schema: the Supabase GitHub integration applies [`supabase/migrations/`](supabase/migrations) when you push to `main`. Without the integration, run [`supabase/migrations/20261112000000_init.sql`](supabase/migrations/20261112000000_init.sql) in **SQL Editor** (it's safe to run twice). Then run [`supabase/seed.sql`](supabase/seed.sql) in **SQL Editor** to load team names.
3. **Authentication → Sign In / Providers**: keep Email enabled, **turn off "Allow new users to sign up"**.
4. **Authentication → Users → Add user → Create new user** for each TVC scorer (tick *Auto confirm*). Give each person their own login and share passwords privately, not in chat or email threads.
5. Make them admins – **SQL Editor**:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email in ('scorer1@example.com', 'scorer2@example.com');
   ```
6. **Project Settings → API**: copy the Project URL and the anon / publishable key.

### 3. Local run
Copy `.env.example` to `.env.local`, fill in the two values, then:

```bash
npm run dev
```

Open http://localhost:3000 (public) and http://localhost:3000/admin (TVC). Without `.env.local` the public pages still show the draw with no scores.

### 4. GitHub + Vercel
1. Create a GitHub repo and push this folder (`.env.local` is git-ignored – check it isn't committed).
2. In Vercel: **Add New → Project → Import** the repo. Framework: Next.js (auto-detected).
3. **Settings → Environment Variables**: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) for Production and Preview. The Supabase Vercel integration may add these for you. Redeploy.
4. In Supabase **Authentication → URL Configuration**, set Site URL to the Vercel URL.

## Before Saturday – checklist

- [ ] `npm test` passes, `npm run build` is clean.
- [ ] Every TVC scorer can sign in on their own phone and reach **Admin**.
- [ ] Enter a test score on a game, check the public page updates, then **Clear score**. Check **Admin → Change log** shows both.
- [ ] Logged-out check: `/admin` redirects to login.
- [ ] Team names match the latest Teams sheet (**Admin → Team names**).
- [ ] Change log clean-up (optional): `delete from public.change_log;` in SQL Editor after testing.
- [ ] Share the public URL (QR code at the courts is handy).

## Weekend runbook

- **Enter a score:** Admin → pick day/court → tap the game → type set scores → status **Final** → Save. Use **In progress** to show a game as LIVE while it's being played.
- **Time ran out in set 2:** enter sets 1 and 2 as played, leave set 3 blank – total points decide.
- **Fix a mistake:** open the game, correct and save, or **Clear score**. All changes are in the change log.
- **Tie:** an amber banner appears on Admin. Go to **Ties**, set the organiser's order.
- **Forfeit / organiser change:** open the game → *Teams for this game* → choose the team.
- **Something's wrong with the site:** the spreadsheet and paper score sheets are the fallback. Scores entered are safe in Supabase.

## Security notes

- No player personal information is stored. TVC logins live in Supabase Auth.
- Public visitors use the anon key, which row-level security limits to reading. Writes need a signed-in user listed in `admins`; the database enforces this, not just the app.
- Every write is logged by a database trigger (who, when, old → new).
- Secrets live in `.env.local` (local) and Vercel environment variables – never in the repo.
- Optional hardening: enable TOTP MFA for TVC accounts in Supabase. The login page doesn't yet prompt for an MFA code, so that needs a small addition before turning it on.
