# Dry run report – Taupō Spring Volleyball 2026

**Run on:** Thursday 12 Nov 2026, against the live Supabase database (test data to be wiped afterwards), local site with a simulated clock from Sat 8:05am to Sun 4:30pm.
**Covered:** all 74 games entered through the real TVC admin screens, 12 scripted incidents, 11 public-site snapshots, and three persona reviews (Orcas captain, Comp player, Social parent).
**Status:** draft for your review – pick what to fix. Nothing here has been changed in the site yet.

## Headline

The core works: auto-live, scoring rules (incl. the level-totals and set-3 rules), tie flagging and resolution, seeding, plain-English placeholders, the bracket chain, shared 11th place, the results page, and the change log all behaved correctly. The problems are mostly about **what happens when people forget or correct things**, which is exactly what happens on a real weekend.

## Fix before Saturday

| # | Problem | Evidence | Suggested fix |
|---|---|---|---|
| 1 | **Correcting an earlier result silently rewrites later Final games.** C19's result was fixed at 1pm after the semi C25 was already Final. C25 then showed "Sharks v Toxiciteam … Sharks win" (a semi Sharks never played, with Sunbears' scores), the public FINAL showed "Sharks v Auckland Knights", and Sunbears appeared LIVE in a 5th–8th game. No warning when saving. Repair needed two manual overrides that nothing pointed to. | sun-1305 comp.txt; admin C25 page | When a Final game is saved and any later **Final** game depends on it, warn before saving ("C25 is already Final with these teams – keep the teams who actually played?") and **lock the teams of played games** (auto-create overrides) so corrections can't move them. |
| 2 | **A game left "In progress" blocks its court all day.** C4 (10am) was never marked Final; at 1:05pm the public still showed it LIVE on Court 3 with full scores, while the same team was also LIVE on Court 2. Later games on that court never showed as live. | sat-1305 home.txt, court3.txt | Treat an in-progress game as finished on the public site once the next slot on that court starts (show "Result pending"), and show a red "not marked Final" banner at the top of the Scores page, not just at the bottom of the dashboard. |
| 3 | **Announcements never expire.** "Court 3 is running about 20 minutes late" (posted ~1pm Sat) was still showing Sunday afternoon. | sat-1505 → sun-1605 home.txt | Show "posted 12:55pm" on the banner and auto-hide after a chosen time (e.g. 1 h default), plus a reminder on the admin Scores page while one is showing. |
| 4 | **No way to mark an optional game "not played".** C34 (optional 11th/12th) went LIVE automatically at 4pm though nobody played it; the only workaround (Delayed) leaves "Delayed C34" on the home page forever. | sun-1605, sun-1630 home.txt | Add a **Not played** status (also handy for cancelled games); don't auto-live optional games. |

## Should fix (quick wins)

| # | Problem | Evidence | Suggested fix |
|---|---|---|---|
| 5 | **Seeding tie appears 10 minutes before the quarter-finals.** Auckland Knights and Sunbears were already identical at the end of Saturday; the tie only surfaced when Pool C finished at ~8:50 Sunday. | admin dashboard Sun 8:50 | Show "possible tie" on the dashboard Saturday evening when two teams in the same place group are identical and can't change (their pools are finished). |
| 6 | **Dashboard is noisy.** "Waiting on results (32)" on Saturday morning, each with long "Mark Final: C4, C6 … C18" lists; the urgent "not marked Final" item sits at the very bottom. | admin dashboard Sat 11:05 | Put "Overdue / not Final" and ties first; only list waiting games starting within ~2 h; summarise the rest ("Sunday playoffs wait on 18 Saturday games"). |
| 7 | **Scores list starts at 8am every time.** By mid-afternoon the scorer scrolls past ~30 Final games. | admin /admin Sat 15:05 | Default to the current/next slot and hide Final games (with "show all"). Add "Next game on this court" after saving. |
| 8 | **Mid-game preview is misleading.** With only set 1 entered and In progress, the preview says "Result: Toxiciteam win · points 0–3". | admin C3 Sat 10:00 | Only show "Result" when status is Final (or both sets entered); otherwise "Leading: …". |
| 9 | **No TVC option for duty.** When a duty team went home, TVC could only pick another team, not "TVC". | admin S16 | Add "TVC (club referees)" to the duty list. |
| 10 | **Forfeits.** Entered as 25–0, 25–0; shows as a normal score and would add +50 rally points in a pool. | admin S18; sun-1605 | Add a Forfeit button that records a standard forfeit score and shows "Forfeit" publicly. Agree the rally-points rule with the organiser. |
| 11 | **Wording.** "rally -10 for BSB Players" (negative "for"); 3-way tie note says "decide the 1st place order" (it's 1st–3rd); stray spaces before full stops ("Kiss my ace! .", "Women , Social"); Ties page shows raw "pool:WA", "seeds:place1". | various | Copy fixes. |

## Nice to have / later

- **Change log** is complete (116 entries, who and when) but reads as raw data ("s1a: – → 19", "game_code"); add team names, plain set scores, and a filter by game.
- **Team override dropdowns** list all 28 teams for every slot; show the game's division first and allow typing to search.
- **Score entry** is many taps per game on a phone (6 boxes + status + save, then back to the list). A "Save & next on this court" button would cut most of it.
- **"That's a wrap!"** appears while the 4pm optional games are still live.
- **Level-totals result** (W3) is correct but the preview doesn't say why; add "(level on points – set 1 winner)".
- **Sign-in lost once** at the start of the run (a sign-out followed by a sign-in that didn't stick). Couldn't reproduce; worth one more check on the real phones on Friday.

## Persona reviews (extra findings not covered above)

Three reviewers read the public snapshots in time order: an **Orcas captain**, a **Sunbears (Comp) player** and a **parent following Pine City 886**. All three independently hit #1–#4 above. New points:

**Teams / captains**
- **No "if you win / if you lose" on the team page.** After Orcas' Sunday crossover, the team page shows only W14; the duty at 11am (if they lose) or game at 1pm (if they win) only appear later. Captains need this to tell players whether to stay. → Add both branches with times on the team page. *(Should fix)*
- **Calendar "add again on Sunday morning" isn't enough** – later Sunday games and duties only appear after each result. → Reword to "add again after each Sunday game", or offer a subscribable calendar link that updates itself. *(Should fix – wording now, subscription later)*
- **Duty shows "(up next)" after its game has started**, and the in-progress game is labelled "Up next" on the team page. → Show "Now" once the start time passes. *(Quick win)*
- **"Duty: TVC" could be read as TVC Lakers** (a team). → "TVC officials". *(Quick win)*
- **Calendar events** say only "Court 1" (no venue) and "W4: v DA'Cubs" (no own team name). → Add venue name/address (needs from you) and "Orcas v …". *(Nice to have)*

**Comp players**
- **Seeding ties are invisible publicly.** Sunbears and Auckland Knights both "3 3 0 9 +30" with nothing saying they're level or when it'll be decided (the Women page does say so). Side-effect of hiding the seeding table. → One line on the Comp page: "Seeds 1/2 level – organiser decides by 8:50am Sunday"; mark "(organiser tie-break)" afterwards. *(Should fix)*
- **"(set by TVC)" after the C19 correction** looked like an error to the player (C19 shows Sharks won, yet Sunbears are in the semi). → Explain overrides with a short note, or hide the label publicly. Fixing #1 avoids most of this.
- The C19 correction also changed **C23's duty team** – more support for freezing games already played.
- **Bracket order**: the 9th–12th section is listed after 5th–8th though its games are earlier; labels are long on a phone. → Order sections by time. *(Nice to have)*

**Spectators**
- **Live games show no score** until the scorer enters one (auto-live games show only names). → Show "0–0" or "In play"; consider asking scorers to enter set scores as they finish. *(Nice to have)*
- **No "Won 2–1 / Lost 0–2"** on finished games – visitors work it out from set scores. → Add a result line. *(Quick win)*
- **Wordy for a phone**: long placeholder labels and the standings rules paragraph on every division page. → Collapse the rules text; shorten labels. *(Nice to have)*
- **Notice wording**: the dry-run banner said "cleared before Saturday" while showing Saturday – reminder that banner text should be time-neutral. *(Dry-run artefact.)*

## What worked well

- Auto-live at each start time; the "Next …" line under each court.
- Delayed status + announcement made a court delay visible straight away.
- Tie flagging and the Ties page: the Sunday draw updated the moment the order was saved.
- Plain-English placeholders ("Best pool winner v 2nd-best 3rd place", "Winner of C19 (Sharks v AC3)").
- Typo warning (25–24) and refusing half-entered sets.
- Rename, overrides and the Results page all straightforward.
- Shared 11th place shown correctly when the optional game wasn't played.
