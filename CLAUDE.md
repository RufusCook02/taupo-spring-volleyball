# Taupō Spring Volleyball 2026 – results website

Tournament: Saturday 14 and Sunday 15 November 2026, 4 courts, 28 teams in three divisions (Women, Social, Competitive).

## Goal
A simple, mobile-first website where:
- **The public** (players, spectators) can view the draw by day, court and division, see live and final scores, see pool standings, and follow the playoff brackets. Read-only, no login.
- **TVC (the club running it)** can sign in and enter or correct set scores for any game, and update team names. Results should show for the public within seconds.

Most people will view it on phones at the venue, so pages need to load fast on patchy mobile data.

## Source of truth
`Taupo_Spring_Volleyball_2026.xlsx` in this folder holds the full draw and scoring logic. Use it to seed the database, then the website becomes the live system.

| Sheet | What it holds |
|---|---|
| Teams | Team names by division, pool and spot (e.g. Comp Pool A spot 1 = Auckland Knights). The draw references spots, not names. |
| Saturday / Sunday | Draw grid: time × court. Each game has a code (W1, S5, C12…), division/stage, Team 1, Team 2 and a duty (referee) team. Team cells are `=Teams!$X$n` refs or placeholders such as `Pool A 3rd`, `Seed 4`, `Winner C19`, `Loser W13`. |
| Rules | Game and tie-break rules (summarised below). |
| Scores – Women / Social / Comp | Pool results grids, Comp playoff seeding table, finals results and final placings. |
| Calc (hidden) | Formulas for pool points, standings, places and Comp seeding. Use it to check the website's calculations match. |

`Taupo_Spring_Volleyball_2026_Court_Score_Sheets.pdf` is the paper score sheet for each court and day, for reference.

## Formats
- **Women and Social:** 2 pools of 4, full round robin on Saturday. Sunday: semis (Pool A 1st v Pool B 2nd, Pool B 1st v Pool A 2nd), 5th–8th crossovers (3rd v 4th), then playoffs for 1st–8th. Placeholders on the Sunday sheet describe who goes where.
- **Competitive:** 3 pools of 4, full round robin (16 games Saturday, last 2 Pool C games Sunday 8am).
  - Seeds: pool winners = seeds 1–3, 2nd places = 4–6, 3rd places = 7–9, 4th places = 10–12. Within each group, rank by wins, then competition points, then rally +/-; exact ties are decided by the organiser.
  - Sunday: quarter-finals 1v8, 2v7, 3v6, 4v5 (C19–C22). Winners → semis (C25, C26) → final (C31) and bronze (C32). Losers → 5th–8th semis (C27, C28) → 5th/6th (C29) and 7th/8th (C30).
  - Seeds 9–12: semis 9v12 and 10v11 (C23, C24). **Optional** 4pm games: 9th/10th (C33) and 11th/12th (C34). Show them as optional. If they're not played, the winners share 9th and the losers share 11th.

## Scoring rules (from the Rules sheet)
- Pool games: 50-minute clock, best of 3 sets (25, 25, 15), win each set by 2. No timeouts.
- If time runs out in set 2, total points across sets 1 and 2 decide the game (a tie means play 1 more point). If time runs out in set 3, the score at the buzzer decides.
- If a game is decided in 2 sets, any third set played does **not** count towards rally points.
- Pool points: win = 3, loss after winning 1 of the first 2 sets = 1, straight-set loss = 0.
- Pool placings: most wins, then competition points, then rally-point differential. Exact ties are decided by the organiser, so the site should flag them for TVC to resolve and not pick a winner itself.
- Sunday playoffs: best of 3 (25, 25, 15), win by 2, no time limit, one 20-second timeout per team per set.
- The Calc sheet formulas are the reference implementation for game result, rally diff and points. Match them.

## Behaviour wanted
- Placeholders resolve to real team names once the games they depend on are complete (e.g. `Winner C19`, `Seed 3`, `Pool B 2nd`). TVC must be able to override any resolved team by hand, for example after an organiser tie-break.
- Game status: scheduled, in progress, final. Public views highlight what's on now and what's next on each court.
- Views: by day and time (whole draw), by court, by division (pools, standings, bracket), and by team (a team's games, including duty times).
- TVC can edit or clear any score. Keep a simple change log (who, when, old and new value).

## Constraints
- **Data:** team names and scores only. No personal information about players. Public pages are read-only.
- **Auth:** score entry needs a proper login for TVC users. Do not hard-code passwords, keys or connection strings in the repo; use environment variables or the hosting platform's secret store.
- **Scale:** about 76 games, about 30 teams, a few hundred viewers on the weekend. Keep the stack simple and cheap to run.
- **Hosting:** not decided yet. Propose a stack and hosting option before building.
- **Deadline:** the tournament starts Saturday 14 November 2026 at 8:00am.
