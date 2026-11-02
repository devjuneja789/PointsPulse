# PointsPulse — Phase-by-Phase Build Plan

**Status:** Locked  
**Date:** 2 November 2026  
**Working directory:** `/mnt/e/dream11`  
**Artifact:** Linkable web app (Render) + public repo  
**Assignment:** Dream11 Forward Deployed Engineer Intern — “Why Did My Points Just Change?”

---

## 1. Locked decisions

| Item | Decision |
|---|---|
| Sport / format | Cricket, T20 |
| Match data | Simulated, scripted events; clearly labelled |
| Teams | Mumbai Indians vs Chennai Super Kings, latest completed IPL season |
| Squads | Real IPL player names and roles; source cited; no logos or official assets |
| Fantasy team | 11 players, 1 Captain (2x), 1 Vice-Captain (1.5x), 1 real benched player |
| Scoring | Deterministic engine; values verified from Dream11’s official T20 page |
| AI | OpenRouter `cohere/north-mini-code:free` for live phrasing; hand-written fallback always available |
| Languages | English and Hinglish, hand-reviewed |
| Frontend | React + TypeScript + Vite |
| Backend | Express + TypeScript, serves the built frontend and `/api/*` |
| Hosting | Render Free web service |
| Repo | Owner creates and pushes; local git history prepared for handoff |
| Scope | Full in-scope MVP + live AI, ask box, catch-up recap, Impact Sub, scenario selector, light/dark mode, CI, docs |
| Out of scope | Live data feed, push notifications, multiple teams/contests, voice, other sports, real money, auth |
| Effort estimate | ~7.5–8 focused sessions |

**Core invariant:** the engine calculates; the model only phrases. The model never computes, changes, or invents a number.

---

## 2. Deliverables

1. Working Render URL that opens on mobile and desktop in a private window.
2. Public repo containing:
   - application source
   - verified scoring rules
   - real squad data with sources
   - engine tests and E2E tests
   - `render.yaml`, `.env.example`
   - README with architecture, setup, AI safety, limitations, disclaimer
   - `SUBMISSION.md` with the ≤200-word note
3. Backup demo recording (silent Playwright walkthrough) plus a rehearsed 5-minute demo script.

### Definition of done

- Every point change has a validated explanation in English and Hinglish.
- Per-player points × multipliers always equal the displayed total.
- All 14 scripted demo scenarios are reachable.
- Live AI failure, quota exhaustion, timeout, or invalid output never breaks the UI.
- Match is visibly labelled simulated; no Dream11/IPL/BCCI logos or trademarks.
- Repo link and Render link both work.

---

## 3. Architecture

```
Browser (React + TypeScript + Vite)
  │  same origin
  ▼
Express API on Render
  ├── POST /api/explain   → one-sentence delta explanation (EN / Hinglish)
  ├── POST /api/ask       → grounded team Q&A + “catch me up” recap
  ├── GET  /api/health    → Render health check + warm-up
  └── serves the Vite production build

Shared pure TypeScript engine
  ├── matchState  → scoreboard, statuses, dismissals, Impact Sub
  ├── scoring     → itemised points from cumulative stats
  ├── delta       → before/after diff for the user’s 11
  ├── risk        → 9 rule-based flags
  └── explain     → templates + number validator
  Used by the client for replay and by the server to re-derive truth.

Data (committed)
  ├── rules.json                 verified Dream11 T20 scoring + source/date
  ├── squads/*.json              real IPL squads + source/season
  ├── scripts/*.json             3 match scripts + filler balls
  └── fallback-explanations/     hand-written EN + Hinglish, per event
```

### Repository layout (single package, npm scripts)

```
pointspulse/
  src/
    data/
      rules.json
      squads/
      scripts/
      teams.json
      fallback-explanations/
    engine/
      matchState.ts
      scoring.ts
      delta.ts
      risk.ts
      explain.ts
      types.ts
    ui/
      App.tsx
      components/
      hooks/
      styles/
    server/
      index.ts
      routes/
      llm/
      validation/
  tests/
    unit/
    e2e/
  docs/
    ARCHITECTURE.md
    SCORING.md
    AI.md
    HINGLISH.md
    DEMO.md
  public/
  render.yaml
  .env.example
  .github/workflows/ci.yml
  README.md
  SUBMISSION.md
```

### Provider adapter

```
LLM_MODE=live | mock | off
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=<set in Render / local .env only>
LLM_MODEL=cohere/north-mini-code:free
LLM_DAILY_LIMIT=40
LLM_MIN_INTERVAL_MS=4000
APP_URL=<render url, used for HTTP-Referer>
```

`mock` is the default for local development and CI. `off` forces fallback copy. `live` is used only when a key is present.

---

## 4. Phase overview

| Phase | Effort | Focus | Exit gate |
|---|---|---|---|
| **P0** Foundation | 0.5 | Repo, scaffold, CI, mock LLM, first Render deploy | Public hello-world URL + `/api/health`; CI green |
| **P1** Truth | 1.5 | Verified rules, real squads, 3 scripts, coverage | Schema, continuity, legality, coverage, anchors pass |
| **P2** Engine | 1.5 | Match state, scoring, delta, risk, templates | Reconciliation invariant passes after every event |
| **P3** UI | 1.5 | Full screen, replay, scenarios, themes, a11y | E2E happy path; above-fold answer; axe clean |
| **P4** AI | 1.5 | Live explain, ask, recap, validation, cache, fallback | Live call verified; adversarial outputs rejected |
| **P5** QA | 1.0 | Security, quota, outage, cross-browser, E2E | Full checklist signed off |
| **P6** Ship | 0.5 | Render prod, docs, note, recording | Both links verified incognito |

---

## 5. P0 — Foundation and first deploy

**Goal:** never discover a packaging, CI, or Render problem on ship day.

### Tasks

- [ ] Initialise local git in `/mnt/e/dream11`; keep `implementation_plan.md` and move it to `docs/` if appropriate.
- [ ] Create `package.json` with scripts:
  - `dev` — Vite + Express concurrently
  - `build` — client build + server compile
  - `start` — production server
  - `test` — Vitest
  - `test:e2e` — Playwright
  - `lint` — ESLint
  - `typecheck` — `tsc --noEmit`
  - `validate:data` — schemas, continuity, coverage
- [ ] Scaffold React + TypeScript + Vite frontend.
- [ ] Scaffold Express + TypeScript server with `/api/health`.
- [ ] Add shared engine folder and path aliases.
- [ ] Add `helmet`, JSON body limit, `trust proxy`, static caching, SPA fallback.
- [ ] Add `.gitignore` (`.env`, `node_modules`, `dist`, Playwright artefacts).
- [ ] Add `.env.example` and `render.yaml`.
- [ ] Implement LLM adapter with `live | mock | off`; mock returns deterministic text.
- [ ] Add GitHub Actions CI: install → lint → typecheck → unit tests → build.
- [ ] Deploy the hello-world build to Render via blueprint.
- [ ] Confirm no secret is in the repo.

**Gate:** public Render URL serves the placeholder, `/api/health` returns 200, CI is green, local `npm run dev` works.

---

## 6. P1 — Rules, real squads, scripts

**Goal:** lock the truth the whole demo depends on.

### 6.1 Scoring rules

- [ ] Verify Dream11’s official T20 points table.
- [ ] Record `source`, `verifiedOn`, and any assumptions in `rules.json` metadata.
- [ ] Check the template’s boundary values (`four_bonus`, `six_bonus`, milestone tiers, wicket and haul values) — the starting template is not trusted.
- [ ] Fill the strike-rate bands, which are missing from the template.
- [ ] Encode: batting, milestones, duck eligibility, bowling, wicket-type bonus, wicket hauls, maiden, fielding (direct/indirect run-out), economy bands, strike-rate bands, starting XI, multipliers.
- [ ] Add a `rulesVersion` so cached AI copy can be invalidated when values change.

### 6.2 Real IPL squads

- [ ] Select MI vs CSK, latest completed IPL season.
- [ ] Build 22+ real players: id, name, team, role (`BAT | BOWL | AR | WK`), batting order, bowling quota.
- [ ] Cite source and retrieval date in `squads/*.json`.
- [ ] Select a plausible simulated XI for each side; this is not a real match XI.
- [ ] Build the user’s 11:
  - [ ] Captain is a bowler (triggers the x2 wicket scenario).
  - [ ] Vice-Captain is a batter (triggers the x1.5 six scenario).
  - [ ] One real player is benched / not in the simulated XI (NOT PLAYING).
  - [ ] Team is Dream11-legal: 11 players, C ≠ VC, role minimums, max 7 from one team.
- [ ] Omit player credits from the UI; if retained in data, label them indicative.
- [ ] Add a persistent “SIMULATED” label and disclaimer metadata.

### 6.3 Match scripts

- [ ] **Full match** — covers all 14 scenarios, including rain interruption, collapse, Impact Sub, and a no-change event.
- [ ] **Powerplay blitz** — batting-friendly narrative; VC six, milestones, high strike rate.
- [ ] **Late collapse** — three wickets in two overs, duck, run-out, “may not bat” risk.
- [ ] Each script: ~25 key events plus filler balls so over counts look right.
- [ ] Every event has: id, innings, over, batter, non-striker, bowler, runs, extras, wicket, fielders, note.
- [ ] Add one Impact Sub entry per side where relevant.
- [ ] Build a coverage matrix: scenario → script → event ID(s) → expected point movement.

### 6.4 Fallback copy

- [ ] Hand-write an English and Hinglish fallback for every event that touches the user’s team.
- [ ] Keep each ≤35 words; mention player, event, points, and C/VC multiplier when present.
- [ ] Store keyed by `scriptId + eventId + lang`.

### 6.5 Golden anchors

- [ ] Hand-calculate expected totals for a batter, a bowler, a fielder, the Captain, and the Vice-Captain.
- [ ] Store as fixtures for P2.

**Gate:** all JSON parses; Zod schemas pass; continuity validator clean; squad legality passes; no section-9 scenario unmapped; five golden anchors documented.

---

## 7. P2 — Deterministic engine

**Goal:** exact, itemised, reproducible points.

### Tasks

- [ ] `matchState.ts` — pure reducer over events:
  - scoreboard (runs, wickets, overs)
  - per-player batting, bowling, fielding stats
  - statuses: BATTING, BOWLING, BOWLED OUT, YET TO BAT, OUT, FIELDING, NOT PLAYING, IMPACT SUB
  - dismissal text
  - current batter / non-striker / bowler
- [ ] `scoring.ts`:
  - [ ] **Compute from cumulative stats after each event, not incrementally.**
  - [ ] Itemise every line: runs, fours, sixes, milestones, duck, wickets, wicket-type bonus, hauls, maiden, economy, strike rate, catches, stumping, run-out, three-catch bonus, starting XI, multiplier.
  - [ ] Mark economy/strike-rate items as provisional until minimum overs/balls.
  - [ ] Apply C/VC multiplier as a separate line item.
  - [ ] Handle wides/no-balls, super over (not scored), rain/DLS (rules unchanged).
- [ ] `delta.ts`:
  - [ ] Diff previous and new totals for the user’s 11 only.
  - [ ] Include only changed players.
  - [ ] `finalDelta = baseDelta × multiplier`.
  - [ ] Separate provisional changes.
  - [ ] Sort by absolute impact.
  - [ ] Return an explicit “no change to your team” object.
- [ ] `risk.ts` — all 9 flags with configurable thresholds and stable reason keys:
  - duck risk, strike-rate drag, expensive bowler, may not bat, may not bowl, milestone close, haul close, captain at risk, rain-reduced overs.
- [ ] `explain.ts`:
  - [ ] Deterministic templates for every item/cause.
  - [ ] Number validator: every number in the text must exist in the payload or be an allowed structural number (`11`, `2x`, `1.5x`).
  - [ ] Length, language, and banned-prediction checks.
  - [ ] Fallback selection.

### Tests

- [ ] Wicket types: bowled/LBW bonus, run-out (no bowler wicket), caught-and-bowled.
- [ ] Direct vs indirect run-out.
- [ ] Duck applies only to eligible roles and only on dismissal for 0.
- [ ] Economy and strike-rate thresholds, minimums, and provisional reversal.
- [ ] Wides/no-balls; maiden over.
- [ ] Three-catch bonus triggers once.
- [ ] Player not in XI scores 0 and shows NOT PLAYING.
- [ ] Super over not scored.
- [ ] Multiplier maths.
- [ ] Invariant: sum of player totals equals displayed total after **every** event.
- [ ] Invariant: `after − before = delta` after every event.
- [ ] Replay determinism.
- [ ] Golden anchors match.

**Gate:** full replay matches all five anchors; both invariants pass at every event; edge-case suite green.

---

## 8. P3 — Product UI

**Goal:** the answer is glanceable in about three seconds.

### Tasks

- [ ] Design tokens: brand red, dark/light surfaces, gain/loss, gold, text; system font stack; 12–16px radii.
- [ ] Layout:
  - [ ] sticky match header with LIVE and simulated badge
  - [ ] total + animated delta
  - [ ] explanation card with EN/HI toggle
  - [ ] 11 player rows with status chips, C/VC badges, score, risk/upside tag
  - [ ] timeline in reverse order
  - [ ] breakdown drawer
  - [ ] decorative bottom nav
  - [ ] demo control bar
- [ ] Player status chips: BATTING (`*` on strike), BOWLING, BOWLED OUT/DONE, YET TO BAT, OUT, FIELDING, NOT PLAYING, IMPACT SUB.
- [ ] Replay controls: play/pause, next ball, 1x/5x, reset, scenario selector.
- [ ] Animations: ~600ms count up/down, ~1.2s row flash, reduced-motion support.
- [ ] States: rain banner, “no change to your team”, provisional “may change” tags, missing explanation, AI/fallback indicator.
- [ ] Language toggle: instant, persisted in `localStorage` inside `try/catch`.
- [ ] Light and dark mode.
- [ ] Responsive at 360/390/430px.
- [ ] Accessibility: `aria-live`, arrows and signs in addition to colour, 44px targets, focus states, contrast.
- [ ] Add `data-testid` hooks for Playwright.
- [ ] Start this phase against a hand-written mock delta while P2 finishes.

**Gate:** every scenario drivable start→finish; on 390×844 the total, delta, and explanation are visible without scrolling; axe passes; no console errors.

---

## 9. P4 — Live AI layer

**Goal:** natural language that is always grounded and never blocks the demo.

### Endpoints

- [ ] `POST /api/explain` — body `{ scriptId, eventIndex, lang }`.
  - Server replays the engine to derive the delta; never trusts client numbers.
- [ ] `POST /api/ask` — body `{ scriptId, eventIndex, lang, question }`.
  - Server derives the team snapshot.
  - Powers both “Ask about my team” and “Catch me up”.
- [ ] `GET /api/health` — includes safe status metadata only (mode, cache size, remaining local budget); no secrets.

### OpenRouter integration

- [ ] Adapter for OpenAI-compatible chat completions at `https://openrouter.ai/api/v1/chat/completions`.
- [ ] Headers: bearer key, `HTTP-Referer` from `APP_URL`, `X-Title: PointsPulse`.
- [ ] Model: `cohere/north-mini-code:free`; override via `LLM_MODEL`.
- [ ] No `response_format` (unsupported); request plain text only.
- [ ] Temperature ~0.3, `max_tokens` ~120.
- [ ] Timeout 8s; one retry on validation failure; no retry storm.
- [ ] On 429/5xx/timeout/moderation/invalid output → fallback copy.

### Prompting

- [ ] System prompt: friendly, ≤35 words, use only payload numbers, mention player + event + points + multiplier, no predictions/betting, output text only.
- [ ] 3 English and 3 Hinglish few-shot examples.
- [ ] Separate prompt for risk phrasing (short, max 14 words).
- [ ] Separate prompt for 2-line catch-up recap.
- [ ] Ask-box prompt: answer only from the supplied snapshot; refuse predictions, betting advice, and off-topic questions.

### Validation

- [ ] Extract numbers; each must be in the payload or an allowed structural number.
- [ ] Max length and markdown stripping.
- [ ] Latin-script Hinglish enforcement.
- [ ] Banned-word list for predictions/betting.
- [ ] Reject invented players/events (names must appear in the payload).
- [ ] Retry once; then fallback.

### Quota and caching

- [ ] Global in-memory cache keyed by `scriptId:eventIndex:lang:promptVersion:rulesVersion`.
- [ ] Single-flight queue with ≥4s spacing (≤15 RPM; OpenRouter free limit is 20 RPM).
- [ ] `LLM_DAILY_LIMIT=40` local guard (OpenRouter free limit is 50/day unless ≥$10 lifetime credit).
- [ ] On quota exhaustion, switch to fallback for the rest of the UTC day.
- [ ] Deduplicate simultaneous requests.
- [ ] Autoplay uses cached/fallback copy; live text hydrates only when paused.

### Product

- [ ] “Ask about my team” UI with suggested questions.
- [ ] “Catch me up” button on the timeline.
- [ ] Small indicator: “AI-phrased” vs “Standard explanation”.
- [ ] Privacy hint: demo Q&A, do not enter personal information.

### Quality

- [ ] Run a 20-case EN/Hinglish eval against representative deltas.
- [ ] Record pass/fail in `docs/AI.md`.
- [ ] If Hinglish is poor: show samples, tune prompt, and if still poor recommend `google/gemma-4-31b-it:free` or a $10 OpenRouter top-up. Do not silently switch models.
- [ ] Hand-review all Hinglish fallbacks and final live outputs; record in `docs/HINGLISH.md`.

**Gate:** a real live call works with the owner’s key; mocked tests reject invented numbers, wrong language, over-length, and off-topic answers; key never appears in the client bundle; rate-limit and quota drills pass.

---

## 10. P5 — QA and hardening

### Correctness

- [ ] Re-run all engine tests and both invariants.
- [ ] Check every explanation’s numbers against the delta payload.
- [ ] Hand-check batter, bowler, fielder, Captain, Vice-Captain.
- [ ] Confirm provisional items are labelled and can reverse.

### UX

- [ ] Answer visible without scrolling at 390×844.
- [ ] Main explanation ≤35 words.
- [ ] Contrast passes; delta uses arrows and signs, not colour alone.
- [ ] Tap targets ≥44px.
- [ ] Reduced motion respected.
- [ ] Light and dark mode both checked.

### Robustness

- [ ] AI invalid → fallback.
- [ ] AI missing → fallback.
- [ ] AI 429/timeout/moderation → fallback.
- [ ] Quota exhausted → fallback.
- [ ] Reset mid-match.
- [ ] 5x replay does not break ordering or animations.
- [ ] `localStorage` throwing does not break the page.
- [ ] Rapid “Next ball” clicks are coalesced.
- [ ] Render cold start shows a proper loading state.

### Security

- [ ] Key server-side only; `.env` gitignored.
- [ ] Zod validation on every request.
- [ ] Body size limit; rate limits per IP.
- [ ] Prompt injection resistance: server-derived state, no client numbers, system-prompt isolation.
- [ ] CSP/helmet; no inline secrets; no prompt logging.
- [ ] Dependency audit.

### Testing

- [ ] Playwright E2E with `LLM_MODE=mock` in CI:
  - load → play to Captain wicket → explanation → breakdown
  - status chips and “yet to bat”
  - duck risk and collapse warnings
  - timeline and catch-up
  - EN/Hinglish toggle
  - scenario switch and reset
  - theme toggle
  - ask box with mocked response
- [ ] axe accessibility check in Playwright.
- [ ] One manual `LLM_MODE=live` pass.
- [ ] Private-window test on mobile and desktop.

**Gate:** every checklist item ticked or explicitly waived with a reason.

---

## 11. P6 — Ship

- [ ] Create Render web service from the owner’s repo; use `render.yaml`.
- [ ] Set env vars: `LLM_MODE=live`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`, `LLM_DAILY_LIMIT`, `APP_URL`, `NODE_ENV`.
- [ ] Confirm `/api/health`, static assets, and one live explain call.
- [ ] Verify the public URL in a private window on phone and desktop.
- [ ] Set up UptimeRobot or a 10-minute cron ping to avoid Free-tier cold starts; otherwise warm 60s before the demo.
- [ ] Write README with problem, demo link, screenshots/GIF, architecture, scoring source, AI safety, tests, deployment, limitations, disclaimer.
- [ ] Write `docs/DEMO.md` (5-minute script).
- [ ] Record silent Playwright walkthrough as backup.
- [ ] Write `SUBMISSION.md`; verify ≤200 words.
- [ ] Rehearse the demo twice.
- [ ] Hand off local commits; owner pushes to their repo.
- [ ] Submit repo + Render links.

**Gate:** both links work incognito; note word count verified; backup recording exists; submission complete.

---

## 12. OpenRouter free-tier plan

| Constraint | Value | Design response |
|---|---|---|
| Model | `cohere/north-mini-code:free` | Primary; env override available |
| Context | 256k | Payloads stay tiny |
| JSON mode | Not supported | Plain-text prompts + validator |
| Requests/minute | 20 | Queue at ≤15 RPM |
| Requests/day | 50 (unless ≥$10 lifetime credit → 1,000) | Daily cap 40; fallback after |
| Model type | Coding model | 20-case language eval; few-shot prompts; fallback |
| Data policy | Free routing may require opt-in | Owner enables free-model data routing |
| Cost | $0 | Optional $10 top-up only to raise daily cap |

**Call budget for a typical demo:** 8–15 unique explanations + 2–3 ask/recap calls, well within 50/day. Cache means repeat runs are free. Fallback means exhaustion is invisible.

---

## 13. Real IPL data and legal handling

- Real team and player names; **simulated events only**.
- Persistent “SIMULATED” badge in the header; disclaimer in the footer.
- Disclaimer text: “Unofficial prototype. Not affiliated with Dream11, BCCI, IPL or any franchise. Match events are simulated.”
- No franchise logos, official fonts, player images, or copyrighted assets.
- Team colour accents only.
- Cite squad source and retrieval date in data files and README.
- Do not present the match as a real fixture or the XI as an official XI.
- Do not use real player credits in the UI; if kept in data, label indicative.

---

## 14. Testing strategy

| Layer | Tool | Coverage |
|---|---|---|
| Engine | Vitest | scoring, delta, risk, match state, invariants |
| Data | Vitest + Zod | schemas, continuity, squad legality, coverage matrix |
| Server | Vitest + mocked LLM | validation, fallback, quota, rate limits, prompt injection |
| UI | React Testing Library (targeted) | explanation, breakdown, toggle, player row |
| E2E | Playwright | golden path, scenarios, themes, ask box, reset |
| Accessibility | axe-core via Playwright | key screens |
| CI | GitHub Actions | lint, typecheck, unit, build, E2E (mock) |

---

## 15. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Free model Hinglish quality is poor | High | Few-shot prompts; hand-written fallback; eval gate; recommend better free model if needed |
| 50 requests/day exhausted | Medium | Global cache, 40-call cap, fallback copy, optional $10 top-up |
| Render Free cold start (~50s) | High | Health endpoint, warm-up, UptimeRobot/cron ping |
| Live model returns invented numbers | Medium | Server-derived payload, number validator, retry, fallback |
| Scoring values wrong or outdated | Medium | Verify official source; config-driven; cite date |
| Data authoring errors | Medium | Continuity + coverage + invariance tests |
| Real IPL branding looks official | Low | No logos, SIMULATED badge, disclaimer, no real-match claims |
| Single-file/ship issues | Low | Deploy hello-world in P0; CI builds every commit |
| Demo glitch | Medium | Reset, scripted scenarios, silent backup recording |

---

## 16. Setup required from the owner

1. Create an OpenRouter API key; place it in local `.env` (gitignored) and Render env vars. Do not paste it in chat.
2. Enable free-model data routing in OpenRouter privacy settings.
3. Create the GitHub repo when ready; add the local project as remote and push.
4. Create the Render web service from the repo after P0; set env vars.
5. Optional: UptimeRobot/cron ping for Render Free; optional $10 OpenRouter top-up.

---

## 17. Optional decisions already made

- **Hinglish:** hand-write fallbacks, review live output, keep `docs/HINGLISH.md`. No external native-speaker review assumed.
- **Demo video:** write the 5-minute script and record a silent Playwright walkthrough as backup; owner narrates live.
- **No cuts:** all in-scope features plus the plan’s optional features are delivered; section-16 future work remains out of scope.

---

## 18. Submission checklist

- [ ] Render link opens on mobile and desktop in a private window.
- [ ] Repo is public and contains README, tests, CI, `render.yaml`, `.env.example`, docs.
- [ ] Match labelled simulated; no Dream11/IPL/BCCI logos or trademarks.
- [ ] All numbers reconcile; tests pass.
- [ ] Live AI verified; fallback verified.
- [ ] Hinglish reviewed.
- [ ] `SUBMISSION.md` note ≤200 words.
- [ ] Backup recording saved.
- [ ] Demo rehearsed twice.
- [ ] Repo + Render links submitted.
