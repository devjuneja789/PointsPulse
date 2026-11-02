# Implementation Plan: "Why Did My Points Just Change?"

**Project:** PointsPulse (working name; Hinglish alt: *Kyun Badha?*)
**For:** Dream11 Forward Deployed Engineer Intern assignment
**Sport / format:** Cricket, T20
**Deliverables:** (1) a working, linkable artifact, (2) a note of 200 words or fewer
**Deadline:** 5 days from receiving the email (received around 2 Nov 2026; confirm the exact date on the email)

---

## 1. Problem statement

### The fan
A fantasy cricket player with a team of 11 who is watching a live T20 match on TV with the app open on their phone. They glance between the two screens and have only a few seconds of attention per glance.

### The moment
Their points total changes and they don't know why. A wicket falls, a six is hit, a catch is taken, and the number on the app moves by an amount that doesn't obviously match what they just saw on TV.

### What the fan is really asking
1. **Why did my score move?** (Which player, which event, how many points, was a Captain/VC multiplier applied?)
2. **Who of my 11 is actually in play right now?** (Batting, bowling, waiting to bat, out, or not involved.)
3. **Who is about to cost me points, and who could earn me more?** (Duck risk, expensive bowler, a batter who may never get to bat.)

### Why this matters
- Confusion at this moment turns into frustration and distrust of the scoring.
- It is the second-screen moment: the fan wants an answer in about 3 seconds, in plain language.
- It's directly tied to the core Dream11 loop (my team, my points, my contest), so it shows understanding of the fan and not just the tech.

### One-line pitch
> A live second-screen companion that tells a fantasy fan, in one plain sentence, why their score just moved, who is in play, and who is at risk.

---

## 2. Scope

### In scope (MVP)
- One simulated T20 match with ~30 scripted key events, replayable.
- One pre-built fantasy team of 11 with a Captain (2x) and Vice-Captain (1.5x).
- A deterministic scoring engine with a configurable T20 rules file.
- A "Why it changed" explanation for every point change affecting the fan's team.
- Live status for each of the 11 players (batting, bowling, yet to bat, out, etc.).
- At-risk and upside flags.
- A timeline so a fan who looked away can catch up.
- English plus Hinglish toggle.
- Mobile-first UI in a Dream11-inspired style.

### Out of scope (say this explicitly in the note or demo)
- Real-time live data feed (the production path; the prototype uses a simulated match).
- Real money, contests, leaderboards, authentication.
- Team building, other sports.
- Official Dream11 branding (logos, trademarks).

### Principles
1. **One fan, one moment, one outcome.** No feature bundle.
2. **AI explains, code calculates.** The model never computes points.
3. **Glanceable first.** The answer is visible without scrolling or tapping.
4. **Always works.** If the AI layer fails, a template explanation is shown instead.

---

## 3. User stories and acceptance criteria

| # | As a fan I want to... | Acceptance criteria |
|---|---|---|
| 1 | See my total and how it just changed | Total shown at top; delta (+/-) animates for ~2s on each change. |
| 2 | Know why it changed in one sentence | Explanation appears within the same update as the delta; names the player, the event, and the points; mentions C/VC multiplier if applied. |
| 3 | See the exact breakdown | Tapping the explanation expands an itemised breakdown that sums to the delta. |
| 4 | Know who of my 11 is in play | Each player row shows a status chip that matches the match state. |
| 5 | Know who is at risk | Risk tag shown with a short reason (e.g. "On 0 off 6 balls, duck risk"). |
| 6 | Catch up after looking away | Timeline lists all my-team changes in reverse order; tapping jumps to details. |
| 7 | Read it in my language | EN / Hinglish toggle changes explanations instantly. |
| 8 | Trust the numbers | Sum of per-player points x multipliers always equals the displayed total (unit-tested). |

---

## 4. UX design

### 4.1 Screen layout (single mobile screen, ~390px wide)

```
+----------------------------------------------+
| (LIVE) MUM 142/4 (16.2)  vs  CHE   RRR 8.7   |  <- sticky match header
+----------------------------------------------+
|  MY TEAM         412.5 pts         ▲ +38     |  <- total + animated delta
|  Rank-style chip (optional): "Mega Contest"  |
+----------------------------------------------+
|  WHY IT CHANGED                  [EN | HI]   |
|  Bumrah-type bowler took a wicket (bowled):  |
|  +25 wicket, +8 bowled bonus = 33, x2 because|
|  he's your Captain = +66.  [See breakdown v] |
+----------------------------------------------+
|  MY 11                                       |
|  (C)  Player A     BOWLING   124.0  ▲        |
|  (VC) Player B     BATTING*   58.5           |
|       Player C     BATTING    -2  ⚠ duck risk|
|       Player D     YET TO BAT  4  ⚠ may not bat|
|       ...                                    |
+----------------------------------------------+
|  TIMELINE (tap to expand)                    |
|  16.2  Wicket - Player A  +66                |
|  15.4  SIX - Player B     +9                 |
+----------------------------------------------+
|  [ Home ] [ My Matches ] [ Contests ] [ ... ]|  <- Dream11-style bottom nav (decorative)
+----------------------------------------------+
```

### 4.2 Player status chips
| Status | Meaning |
|---|---|
| BATTING | On strike or non-striker at the crease (show `*` for on strike). |
| BOWLING | Currently bowling this over. |
| BOWLED OUT / DONE | Has completed overs, no more bowling. |
| YET TO BAT | In the XI, hasn't batted. |
| OUT | Dismissed. |
| FIELDING | On the field, no current batting/bowling role. |
| NOT PLAYING | Not in the confirmed XI (shows 0). |
| IMPACT SUB | Optional: only if the Impact Player rule is modeled. |

### 4.3 Risk and upside tags
Short, colour-coded tags with a one-line reason. Rules in section 7.

### 4.4 Visual style (Dream11-inspired, approximations)
These are approximations of the general look. Replace with exact values if official assets are available.

| Token | Suggested value | Use |
|---|---|---|
| `--brand-red` | `#D6212B` | Primary actions, active nav, LIVE dot |
| `--bg-dark` | `#121212` / `#1A1A1A` | Header and nav |
| `--bg-card` | `#FFFFFF` (light) / `#242424` (dark) | Cards |
| `--gain` | `#1E9E4A` | Positive deltas |
| `--loss` | `#D6212B` | Negative deltas |
| `--gold` | `#F5B700` | C / VC badges |
| `--text` | `#111` / `#F2F2F2` | Body text |

- Font: system bold sans (Inter / Roboto stack), heavy weight for numerals.
- Cards with 12-16px radius, subtle shadow.
- C / VC badges: gold circles labelled `C` and `VC`, with multiplier shown in the breakdown (`x2`, `x1.5`).
- Motion: points count up/down over ~600ms; changed row flashes green/red for ~1.2s.
- Support light and dark mode.
- Do not use Dream11 logos, names in the UI chrome, or copyrighted assets. Label the artifact as an independent prototype.

### 4.5 Match controls (for demo only)
A small control bar under the header: `Play / Pause`, `Next ball`, `Speed 1x/5x`, `Reset`, and a scenario selector (for example "Late collapse", "Powerplay blitz"). This lets reviewers drive the demo themselves.

---

## 5. Architecture

```
+--------------------+
| Match script (JSON)|  ball-by-ball events (simulated)
+---------+----------+
          |
          v
+--------------------+     +------------------------+
| Match state engine |---->| Scoring engine         |
| (who bats/bowls,   |     | (rules.json + C/VC)    |
|  overs, wickets)   |     +-----------+------------+
+---------+----------+                 |
          |                            v
          |                +------------------------+
          |                | Delta detector         |
          |                | (what changed for MY   |
          |                |  team, per player)     |
          |                +-----------+------------+
          v                            |
+--------------------+                 v
| Risk engine        |     +------------------------+
| (rule-based flags) |---->| Explanation builder    |
+--------------------+     | 1. Template (always)   |
                           | 2. AI-enriched (if on) |
                           +-----------+------------+
                                       v
                           +------------------------+
                           | UI (single HTML page)  |
                           +------------------------+
```

### Key design decision: AI explains, code calculates
- The scoring engine produces exact, verified numbers.
- The AI layer only receives these numbers and writes language around them.
- The UI always shows the itemised breakdown beside the sentence so the fan can check the maths.
- A validator checks that every number in the AI text exists in the structured payload. If it doesn't, the template explanation is shown instead.

### Technology choices
| Layer | Choice | Reason |
|---|---|---|
| Delivery | Single self-contained HTML file (hosted as a published page) | Gives a working link in one step. |
| UI | Vanilla JS + CSS, or React via UMD build, pinned version | No build step; fast to ship in 5 days. |
| Logic | Plain JS modules (inlined) | Testable pure functions. |
| Data | Inline JSON (match script, team, rules) | No backend needed. |
| AI | See section 8 | Depends on what the hosting environment allows. |
| Storage | In-memory; localStorage only for language preference, wrapped in try/catch | Keep it simple. |

---

## 6. Data model

### 6.1 Match script (simulated T20)
Use fictional teams and players (e.g. "Mumbai Mariners vs Chennai Chargers") so it clearly reads as a simulation and avoids implying real match data. Keep realistic roles and batting orders.

```json
{
  "matchId": "SIM-001",
  "format": "T20",
  "teams": { "A": "Mumbai Mariners", "B": "Chennai Chargers" },
  "playingXI": { "A": ["p1", "..."], "B": ["p12", "..."] },
  "events": [
    {
      "id": "e001",
      "over": 0.1,
      "innings": 1,
      "batter": "p1",
      "nonStriker": "p2",
      "bowler": "p12",
      "runs": 0,
      "extras": null,
      "wicket": null,
      "fielders": [],
      "note": "Dot ball"
    },
    {
      "id": "e014",
      "over": 2.3,
      "innings": 1,
      "batter": "p1",
      "bowler": "p12",
      "runs": 6,
      "wicket": null
    },
    {
      "id": "e019",
      "over": 3.2,
      "innings": 1,
      "batter": "p2",
      "bowler": "p13",
      "runs": 0,
      "wicket": { "type": "caught", "playerOut": "p2", "fielders": ["p14"] }
    }
  ]
}
```

### 6.2 Players
```json
{ "id": "p1", "name": "...", "team": "A", "role": "BAT|BOWL|AR|WK", "credits": 9.5 }
```

### 6.3 User's fantasy team
```json
{
  "teamName": "My Team 1",
  "players": ["p1", "p3", "p5", "..."],
  "captain": "p5",
  "viceCaptain": "p9"
}
```
Rules: 11 players, 1 captain, 1 vice-captain, captain != vice-captain.

### 6.4 Derived state after each event
```json
{
  "scoreboard": { "runs": 142, "wickets": 4, "overs": 16.2 },
  "playerStats": {
    "p5": { "runs": 34, "balls": 22, "fours": 3, "sixes": 2,
            "wickets": 0, "oversBowled": 0, "runsConceded": 0,
            "catches": 1, "dots": 0, "status": "BATTING" }
  },
  "fantasyPoints": {
    "p5": { "base": 56, "multiplier": 2, "total": 112, "items": [ ... ] }
  },
  "myTotal": 412.5
}
```

### 6.5 Delta object (the unit the explanation layer consumes)
```json
{
  "eventId": "e019",
  "over": 3.2,
  "myTotalBefore": 112.5,
  "myTotalAfter": 178.5,
  "myDelta": 66,
  "changes": [
    {
      "playerId": "p5",
      "playerName": "...",
      "isCaptain": true,
      "multiplier": 2,
      "baseDelta": 33,
      "finalDelta": 66,
      "items": [
        { "label": "Wicket", "points": 25 },
        { "label": "Bowled bonus", "points": 8 }
      ],
      "cause": "Took a wicket (bowled)"
    }
  ],
  "provisionalChanges": []
}
```

---

## 7. Core logic specifications

### 7.1 Scoring engine

**Requirements**
- Pure function: `(playerStatsBefore, event, rules) -> (playerStatsAfter, pointItems)`.
- All point values come from `rules.json`. No numbers hardcoded in logic.
- Output is an itemised list so every point can be explained.
- Captain multiplier 2x and Vice-Captain multiplier 1.5x applied on the player's total, shown as a separate line item.

**IMPORTANT: verify the values.** Public sources list slightly different T20 values (e.g. 25 vs 30 per wicket, different bonus tiers). Before building, check Dream11's official points page for T20 and fill `rules.json` from it. The table below is a starting template only.

**`rules.json` (starting template, to be verified)**
```json
{
  "format": "T20",
  "startingXI": 4,
  "batting": {
    "run": 1,
    "four_bonus": 1,
    "six_bonus": 2,
    "milestones": { "25": 4, "50": 8, "75": 12, "100": 16 },
    "duck": -2,
    "duck_applies_to": ["BAT", "WK", "AR"]
  },
  "bowling": {
    "wicket": 25,
    "lbw_or_bowled_bonus": 8,
    "wicket_hauls": { "3": 4, "4": 8, "5": 16 },
    "maiden": 12,
    "dot_ball": 0
  },
  "fielding": {
    "catch": 8,
    "three_catch_bonus": 4,
    "stumping": 12,
    "run_out_direct": 12,
    "run_out_indirect": 6
  },
  "economy": {
    "min_overs": 2,
    "bands": [
      { "max": 5, "points": 6 },
      { "max": 6, "points": 4 },
      { "max": 7, "points": 2 },
      { "max": 10, "points": 0 },
      { "max": 11, "points": -2 },
      { "max": 12, "points": -4 },
      { "max": 999, "points": -6 }
    ]
  },
  "strike_rate": {
    "min_balls": 10,
    "applies_to_non_bowlers_only": true,
    "bands": [ "fill from official table" ]
  },
  "multipliers": { "captain": 2, "viceCaptain": 1.5 }
}
```

**Edge cases to handle and test**
| Case | Handling |
|---|---|
| Wicket types | Bowled / LBW get the bonus; run-outs give no bowler wicket points; caught-and-bowled counts as wicket plus catch. |
| Run out | Direct vs indirect fielding points (config). |
| Duck | Applies only to configured roles; only when dismissed for 0. |
| Economy / strike rate | Applied only after minimum overs/balls. Live, these are shown as **provisional** and can flip (label them "may change"). |
| Wides / no-balls | No batter run; bowler concedes; no legal ball counted. |
| Maiden | Six legal balls, zero runs off the bat and extras that count. |
| Catch bonus | Three or more catches triggers a bonus once. |
| Player not in XI | Zero points; shown as NOT PLAYING. |
| Super Over | Not scored (matches Dream11's behaviour per public sources; verify). |
| Rain / DLS | Scoring rules unchanged; UI shows an informational banner (see 7.4). |

### 7.2 Delta detector
After each event, diff the previous and new fantasy points for each of the user's 11.
- Include only players whose points changed.
- Compute `finalDelta = baseDelta x multiplier`.
- Include provisional changes (economy / strike-rate crossing a band) as separate entries.
- Sort by absolute impact.

### 7.3 Player status derivation
Derived from match state, not typed in manually:
- BATTING: batter or non-striker for the current ball.
- BOWLING: current bowler.
- OUT: dismissed (store dismissal text).
- YET TO BAT: in the batting side's XI, hasn't faced a ball and isn't dismissed.
- DONE BOWLING: used 4 overs.
- FIELDING: in the fielding side XI, no active role.

### 7.4 Risk and upside engine (rule-based)

| Flag | Trigger (configurable thresholds) | Reason shown |
|---|---|---|
| Duck risk | Batter on 0, balls faced >= 1, role eligible for duck penalty | "On 0 off N balls, duck risk (-2)" |
| Strike-rate drag | Batter with 10+ balls and SR in a penalty band | "Strike rate X, below the penalty line" |
| Expensive bowler | Bowler with 2+ overs and economy in a penalty band, or one bad over | "Economy X, could cost points" |
| May not bat | Player is yet to bat, and (batting position >= 8 and wickets fallen <= 3) or few overs left | "Yet to bat, may not get a chance" |
| May not bowl | Bowler with overs left but match state suggests capped overs (e.g. rain-reduced) | "Overs may be cut" |
| Milestone close | Batter within 5 runs of 25/50/75/100 | "N runs from a +X bonus" (upside) |
| Haul close | Bowler on 2 or 4 wickets with overs left | "One wicket from a +X bonus" (upside) |
| Captain at risk | Any of the above applied to C or VC | Highlighted with higher visual weight |

**Rain / reduced overs banner:** if the script includes an interruption event, show "Match interrupted. Overs may be reduced. Dream11 scoring rules don't change for DLS; bowlers' overs and batters' chances may." (Verify wording against official rules before using.)

Risk flags are computed in code. The AI only rephrases them.

---

## 8. AI layer

### 8.1 What the AI does
1. Turns a structured delta into one friendly sentence (EN or Hinglish).
2. Rewrites risk reasons in natural language.
3. (Optional) Generates a 2-line "what you missed" recap for the timeline.

### 8.2 What the AI must not do
- Compute or alter point values.
- Invent events, players, or stats not in the payload.
- Give betting or "you will win" predictions.

### 8.3 Three-tier explanation pipeline (always works)
| Tier | Source | When |
|---|---|---|
| 1. Template | Deterministic string templates filled from the delta | Always generated first; used as fallback. |
| 2. Pre-generated AI | Explanations written by Claude for each scripted event and stored in the match JSON | Default for the published prototype. Fast, free, reliable. |
| 3. Live AI | Runtime call to a model | Only if the hosting environment supports it. Used for an optional "Ask about my team" box. |

Reason for this approach: a published page may not be able to call the model API directly. Before building, check which runtime capabilities are available for the published page and choose tier 2 or 3 accordingly. State honestly in the note which tier is used.

### 8.4 Prompt (explanation)
```
SYSTEM:
You explain fantasy cricket score changes to casual fans.
Rules:
- Use ONLY the numbers and names in the JSON. Never compute new numbers.
- One or two short sentences, maximum 35 words.
- Mention: player, what happened, points, and the Captain/VC multiplier if present.
- Tone: friendly, clear, no jargon. No predictions or betting advice.
- Output language: {{lang}}  (en | hinglish)
- Output ONLY the text.

USER:
{{delta_json}}
```

**Example input (abridged)**
```json
{"player":"Aarav Mehta","isCaptain":true,"cause":"bowled a batter",
 "items":[{"label":"Wicket","points":25},{"label":"Bowled bonus","points":8}],
 "baseDelta":33,"multiplier":2,"finalDelta":66,"myTotalAfter":178.5}
```
**Example output (EN)**
> Aarav Mehta bowled a batter: +25 for the wicket and +8 bowled bonus. He's your Captain, so it counts double: +66. Your total is now 178.5.

**Example output (Hinglish)**
> Aarav Mehta ne batter ko bowled kiya: wicket ke +25 aur bowled bonus ke +8. Woh aapke Captain hain, toh points double: +66. Ab total 178.5 hai.

### 8.5 Prompt (risk phrasing)
```
SYSTEM:
Rewrite each risk flag as a short, friendly warning (max 14 words).
Use only the facts provided. No predictions. Language: {{lang}}.
Return a JSON array of strings, same order, nothing else.

USER:
{{risk_flags_json}}
```

### 8.6 Validation
- Extract all numbers from the AI text; each must appear in the payload (or be a sum of listed items). If not, discard and use the template.
- Max length check; strip markdown.
- Language check for Hinglish (Latin script).

### 8.7 Tools to name in the submission note
Claude (for explanation text and for building the prototype), plus any others actually used. Only list tools you really used.

---

## 9. Simulated match design

Design the script to showcase each type of "why did my points change" moment. Target ~30 key events (not every ball), plus filler balls so over counts look right.

| # | Scenario | What it demonstrates |
|---|---|---|
| 1 | Dot balls and singles early | Quiet baseline, no change |
| 2 | Boundary by a batter in the user's team | Simple +runs +boundary bonus |
| 3 | Six by the Vice-Captain | Multiplier x1.5 explained |
| 4 | Batter reaches 25 / 50 | Milestone bonus |
| 5 | Wicket (bowled) by Captain bowler | Wicket + bowled bonus, x2 |
| 6 | Wicket (caught), fielder on the user's team | Two players gain points |
| 7 | Duck for a batter on the user's team | Negative points |
| 8 | Run-out (direct) | Fielding points |
| 9 | Expensive over for a user's bowler | Economy band change (provisional) |
| 10 | Maiden over | Bowling bonus |
| 11 | Rain interruption, overs reduced | Banner + "may not bowl/bat" risk |
| 12 | Collapse: 3 wickets in 2 overs | At-risk "yet to bat" tags |
| 13 | A player on the user's team not in the XI | NOT PLAYING, 0 points |
| 14 | Event that doesn't affect the user's team | No delta; UI says "No change to your team" |

The user's team should include a mix of batters, bowlers, an all-rounder, a keeper, with C and VC chosen so scenarios 3 and 5 trigger multipliers.

---

## 10. Project structure (single-file output, authored in modules)

Author as separate sections, then inline into one `index.html`:

```
pointspulse/
  index.html            # final single-file artifact
  src/
    data/
      match.json        # simulated match events
      players.json
      myTeam.json
      rules.json        # T20 scoring config (verified)
      explanations.json # pre-generated AI text keyed by eventId + lang
    engine/
      matchState.js     # derive scoreboard + player status
      scoring.js        # points per event, itemised
      delta.js          # diff before/after for my team
      risk.js           # flags
      explain.js        # template + AI-text selection + validation
    ui/
      app.js            # state, controls, render loop
      components.js     # header, team card, explanation card, player row, timeline
      styles.css
  tests/
    scoring.test.js
    delta.test.js
    risk.test.js
  README.md
```

---

## 11. Build plan (5 days)

### Day 1: Foundations and data
- [ ] Confirm deadline date from the email.
- [ ] Verify the T20 scoring table against Dream11's official page; finalize `rules.json`.
- [ ] Define the fictional teams, 22 players, batting orders, and the user's team (C and VC chosen).
- [ ] Write the match script (~30 key events + filler).
- [ ] Sketch the single screen (paper or quick wireframe).
**Exit criteria:** `rules.json`, `players.json`, `myTeam.json`, `match.json` exist and parse.

### Day 2: Engines
- [ ] `matchState.js`: scoreboard + statuses per event.
- [ ] `scoring.js`: batting, bowling, fielding, economy and strike-rate (provisional) points; itemised output.
- [ ] `delta.js`: before/after diff, multipliers.
- [ ] Unit tests for the edge cases listed in 7.1.
**Exit criteria:** replaying the whole match gives point totals that match a hand-calculated spreadsheet for at least 3 players.

### Day 3: UI
- [ ] Static layout with the design tokens (header, team card, explanation card, 11 rows, timeline, bottom nav).
- [ ] Replay controls (play, pause, next ball, speed, reset).
- [ ] Animated delta, row flash, status chips, C/VC badges.
- [ ] Dark/light mode, responsive down to 360px.
**Exit criteria:** you can drive the match from start to finish and the screen updates correctly.

### Day 4: Intelligence and polish
- [ ] `risk.js` with all flags in 7.4.
- [ ] Template explanations for every event type.
- [ ] Generate and store AI explanations (EN + Hinglish) for each scripted event; add the validator.
- [ ] Optional: "Ask about my team" if live AI is available.
- [ ] Breakdown drawer, "No change to your team" state, rain banner.
**Exit criteria:** every delta has a good explanation in both languages; risk tags appear at the right moments.

### Day 5: Ship
- [ ] Test on a phone-sized viewport and in dark mode.
- [ ] Run through the demo script (section 13) twice.
- [ ] Publish and open the link in a private window to confirm it works.
- [ ] Write and trim the 200-word note.
- [ ] Submit via the Google Form with time to spare (don't submit at the last minute).

---

## 12. Testing and quality checklist

### Correctness
- [ ] Sum of per-player (base x multiplier) equals displayed total after every event.
- [ ] Each explanation's numbers match the delta payload.
- [ ] Hand-check: at least one batter, one bowler, one fielder, the captain and the vice-captain.
- [ ] Provisional items (economy/strike-rate) are clearly labelled and can reverse.

### UX
- [ ] The answer to "why did it change" is visible without scrolling on a 390x844 viewport.
- [ ] No more than ~35 words in the main explanation.
- [ ] Contrast meets accessibility guidelines; delta isn't conveyed by colour alone (use arrows and +/-).
- [ ] Tap targets >= 44px.

### Robustness
- [ ] AI text fails validation: falls back to template.
- [ ] Missing explanation for an event: falls back to template.
- [ ] Reset works mid-match.
- [ ] Fast speed doesn't break animations or ordering.
- [ ] localStorage errors don't break the page.

### Honesty
- [ ] The UI labels the match as simulated.
- [ ] The note states which AI tools were used and for what.

---

## 13. Demo script (for the virtual demo round, ~5 minutes)

1. **Frame the fan (30s):** "It's over 16, you're watching on TV, your phone just jumped by 66 and you don't know why."
2. **Show the moment (60s):** run to the Captain's wicket. Walk through the delta, the one-sentence explanation, then the breakdown.
3. **Who's in play (45s):** point to status chips and the "yet to bat" player.
4. **At risk (45s):** run to the duck-risk and collapse scenarios; show warnings and upside tags.
5. **Catch-up (30s):** open the timeline for someone who looked away.
6. **Hinglish toggle (20s).**
7. **How it works (60s):** deterministic scoring, AI only explains, validator, fallback.
8. **What's next (30s):** live data feed, push notifications ("Your Captain is out"), multiple teams, other sports.

**Likely questions to prepare for**
- Why not let the LLM do everything? (Trust and correctness.)
- How would this scale to a real match? (Event stream, same engine, caching of explanations, per-user diffing.)
- How would you measure success? (Fewer support queries about scoring, session time during live matches, explanation tap-through rate.)
- What did you cut and why?

---

## 14. Submission note skeleton (max 200 words)

> **Fan problem:** During a live T20 match, fantasy players see their points change and don't know why, who is actually in play, or who is about to cost them points, all while glancing between TV and phone.
>
> **How it helps:** PointsPulse gives a one-sentence, plain-language reason for every score change (player, event, points, Captain/VC multiplier), shows live status of all 11 players, flags at-risk and upside moments (duck risk, expensive overs, players who may not bat), and offers a catch-up timeline with an English/Hinglish toggle. Scoring is calculated by a deterministic engine; AI only explains, so numbers can be trusted.
>
> **AI tools:** [list only what you used, e.g. Claude for explanation text, validation prompts and building the prototype.]
>
> **Note:** Built on a simulated match; the production path is a live ball-by-ball feed.

Trim to <= 200 words before submitting.

---

## 15. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Scoring values are wrong or outdated | Medium | Verify from the official page; keep in config; label as T20 prototype. |
| Overbuilding in 5 days | High | Hard scope: one match, one screen, one team. |
| AI hallucinated numbers | Medium | AI never computes; validator; template fallback. |
| Published page can't call the model API | Medium | Pre-generated explanations (tier 2). |
| Looks like a Dream11 copy | Low | "Inspired by" styling, no logos, labelled independent prototype. |
| Hinglish quality | Low | Review all strings manually; keep sentences short. |
| Live demo glitch | Medium | Reset button, scripted scenarios, a recorded backup of the demo. |

---

## 16. Future work (mention, don't build)
- Live ball-by-ball data integration and per-user event stream.
- Push notifications for captain/vice-captain events.
- Multiple teams and contests, rank-impact explanations ("you moved from #2,340 to #1,980").
- Voice mode for hands-free updates.
- Other formats (ODI, Test) and other sports.
- Personalisation of explanation depth (new vs experienced fans).
- Accessibility: screen-reader-friendly live regions, larger text mode.

---

## 17. Final submission checklist
- [ ] Working link opens on mobile and desktop in a private window.
- [ ] Match clearly labelled as simulated; no Dream11 logos or trademarks.
- [ ] All numbers reconcile (tests passing).
- [ ] Note <= 200 words, covers the problem, the solution, and the AI tools used.
- [ ] Google Form submitted before the deadline.
- [ ] Demo script rehearsed; backup recording saved.
