# Hinglish Transliteration & Language Standards

PointsPulse provides full dual-language support in **English** and **Hinglish** (Romanized Hindi written in Latin script). This document defines the grammar, tone, vocabulary rules, and verification procedures used across the deterministic engine, pre-authored fallbacks, and the AI phrasing layer.

---

## 1. Principles of PointsPulse Hinglish

1. **Latin Script Strictness:** All Hinglish must be transliterated in standard Latin/English alphabet characters (`A-Z`, `a-z`). Devanagari Unicode (`\u0900-\u097F`) is strictly rejected by the validation pipeline.
2. **Cricket Loanwords Remain English:** Technical cricket and fantasy terms are never translated into literal Hindi. Terms like *wicket*, *six*, *four*, *captain*, *multiplier*, *economy rate*, *points*, and *yorker* remain in English.
3. **Conversational Second-Screen Tone:** Language mirrors how Indian fantasy sports fans discuss live cricket matches with friends: natural, concise, and direct.
4. **Number Placement:** Point deltas (`+66 pts`, `+8 pts`) and multipliers (`2x Captain`, `1.5x Vice-Captain`) must remain clearly visible and uncorrupted by phrasing.

---

## 2. Terminology Glossary

| English Fantasy Term | Approved Hinglish Transliteration | Disallowed / Awkward |
|---|---|---|
| Points increased | Points badhe | Ank me vriddhi huyi |
| Points decreased | Points kam hue / minus hue | Ank ghate |
| Captain multiplier | Captain 2x multiplier ke sath | Adhyaksh guna |
| Bowled / Clean bowled | Clean bowled kiya | Gend se out |
| Catch taken | Catch pakda | Gend lapki |
| Run out | Run out kiya | Daudte out |
| Maiden over | Maiden over dala | Shunya run over |
| Duck out | Duck par out | Shunya par out |
| Strike rate negative | Strike rate kam hone se penalty | Mand gati danda |
| Expensive economy | Mehenge over se penalty | Kharchila over |

---

## 3. Sample Translations Across Scenarios

### Event 1: Captain Wicket + Bowled Bonus
- **English:** `Jasprit Bumrah bowled Ruturaj Gaikwad: +25 wicket, +8 bowled bonus. Captain 2x multiplier applied (+66 pts). Total is now 70 pts.`
- **Hinglish:** `Jasprit Bumrah ne Ruturaj Gaikwad ko bowled kiya: +25 wicket, +8 bowled bonus. Captain 2x multiplier ke sath +66 pts mile. Ab total 70 pts hai.`

### Event 2: Six + Milestone Bonus (30 Runs)
- **English:** `Suryakumar Yadav hit a six and crossed 30 runs: +12 runs, +2 boundary bonus, +4 milestone bonus. 1.5x VC multiplier applied (+27 pts). Total is now 117 pts.`
- **Hinglish:** `Suryakumar Yadav ne chakka lagakar 30 runs pure kiye: +12 runs, +2 boundary bonus, +4 30-run bonus. Vice-Captain 1.5x ke sath +27 pts mile. Ab total 117 pts hai.`

### Event 3: Boundary Catch + 3-Catch Haul
- **English:** `Ravindra Jadeja took a boundary catch: +8 catch bonus plus +4 3-catch haul bonus (+12 pts). Total is now 169 pts.`
- **Hinglish:** `Ravindra Jadeja ne shandar catch pakda aur 3-catch haul bonus bhi mila (+12 pts). Ab total 169 pts hai.`

### Event 4: Duck Dismissal Penalty
- **English:** `Hardik Pandya was dismissed for a duck (0 runs): -2 pts duck penalty. Total is now 167 pts.`
- **Hinglish:** `Hardik Pandya duck par out ho gaye: -2 pts duck penalty. Ab total 167 pts hai.`

### Event 5: Ball with No Team Points Impact
- **English:** `No change to your fantasy team points on this ball.`
- **Hinglish:** `Is ball par aapki fantasy team ke points me koi badlav nahi hua.`

---

## 4. Pre-Authored Fallback Registry

All match scenarios have 100% pre-authored fallback explanations authored in both English and Hinglish:
- [`src/data/fallback-explanations/full-match.json`](file:///mnt/e/dream11/src/data/fallback-explanations/full-match.json)
- [`src/data/fallback-explanations/powerplay-blitz.json`](file:///mnt/e/dream11/src/data/fallback-explanations/powerplay-blitz.json)
- [`src/data/fallback-explanations/late-collapse.json`](file:///mnt/e/dream11/src/data/fallback-explanations/late-collapse.json)

These guarantees ensure that even in `LLM_MODE=off`, network disconnection, or daily API limit exhaustion, the application continues to deliver fluent English and Hinglish explanations for every scripted ball.

---

## 5. Automated Verification

The Hinglish output safety is automatically verified by the test suite:
1. **Case 8 (`tests/unit/ai-eval.test.ts`):** Verifies that text containing Devanagari characters (e.g. `विकेट`) is rejected.
2. **Case 9 (`tests/unit/ai-eval.test.ts`):** Verifies that clean Latin-script Hinglish passes validation.
3. **Template Engine (`src/engine/explain.ts`):** Built-in template generator formats localized fallback strings with correct grammar and number signs.
