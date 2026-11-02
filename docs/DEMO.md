# PointsPulse: 5-Minute Live Demo Script

**Project:** PointsPulse (*Kyun Badha?*)  
**Role:** Dream11 Forward Deployed Engineer Intern Assignment  
**Presenter:** Candidate  
**Target Duration:** 4 minutes 45 seconds  
**Live URL:** [https://pointspulse.onrender.com](https://pointspulse.onrender.com)

---

## Demo Schedule & Flow

```mermaid
flowchart LR
    A["0:00 - 0:45<br/>The Fan's Problem"] --> B["0:45 - 1:30<br/>The Core Invariant"]
    B --> C["1:30 - 2:45<br/>Live Walkthrough & Golden Path"]
    C --> D["2:45 - 3:45<br/>Scenarios & 9 Risk Flags"]
    D --> E["3:45 - 4:30<br/>Catch-Up & Grounded Q&A"]
    E --> F["4:30 - 5:00<br/>Engineering Rigor & Wrap-up"]
```

---

## 1. The Fan's Problem (0:00 – 0:45)

> *"Hi everyone, today I'm presenting PointsPulse — a second-screen companion built for the fantasy cricket fan.*
>
> *Picture a fan watching an intense IPL match on TV with the Dream11 app open on their phone. They have only a few seconds of attention per glance. Suddenly, a wicket falls or a boundary is hit, their total points change, and they don're understand why. Did their bowler get the points? Did their captain multiplier kick in? Is someone at risk of losing points?*
>
> *Spreadsheets and raw stats don't answer that in three seconds. PointsPulse does."*

---

## 2. The Core Architectural Invariant (0:45 – 1:30)

> *"Before I show you the interface, let's talk about the cardinal engineering principle behind this project:*
>
> ***The engine calculates; the AI only phrases.***
>
> *Language models should never do arithmetic in production. A pure TypeScript deterministic scoring engine calculates cumulative scores, point deltas, Captain/VC multipliers, and risk flags according to official Dream11 T20 scoring rules.*
>
> *The AI layer — connected to OpenRouter's free tier with automated rate-limiting, daily quota guarding, and in-memory caching — takes the server's ground truth delta and translates it into one plain sentence in English or Hinglish. If the AI is slow, offline, or exhausts its quota, pre-authored deterministic fallback copy takes over seamlessly without ever halting the user experience."*

---

## 3. Live Walkthrough: The Golden Path (1:30 – 2:45)

*(Presenter opens mobile viewport: 390×844)*

> *"Here is the mobile interface. Above the fold, everything the fan needs is visible without scrolling:*
> 1. *Sticky match header with simulated status.*
> 2. *The fan's total score (starting at 46.0 pts for starting XI selections and active multipliers).*
> 3. *The 'Why It Changed' explanation card.*
> 4. *Replay controls to step through match events.*
>
> *Let's step forward one ball. Rohit Sharma drives for four. The score counts up to 51.0 (+5.0 pts). The explanation updates instantly.*
>
> *Now, ball 3: Tushar Deshpande clean bowls Rohit Sharma. The score leaps by +33.0 pts to 84.0. The delta badge lights up green with an arrow.*
>
> *The explanation card tells us: **'Rohit Sharma is bowled by Tushar Deshpande (+25 wicket, +8 bowled = +33 pts for Tushar).'** Notice the text is concise — strictly under 35 words.*
>
> *If the fan wants full transparency, they tap **'See breakdown ▾'**. The bottom drawer slides up displaying an itemized audit: Base wicket points (+25), Bowled dismissal bonus (+8), and starting selection (+4).*
>
> *Now, let's tap the language toggle at the top right from **EN** to **HI**. Instantly, the copy transforms into natural Romanized Hinglish: **'Kyun badha / ghata'** with fluent phrasing that mirrors how Indian cricket fans converse."*

---

## 4. Scenarios & 9 Rule-Based Risk Flags (2:45 – 3:45)

*(Presenter switches scenario dropdown to 'Late Collapse')*

> *"PointsPulse is not a static demo. We have three complete scripted scenarios:*
> 1. ***Full Match:*** *Covering 14 distinct scoring edge cases.*
> 2. ***Powerplay Blitz:*** *Fast boundaries and milestone bonuses.*
> 3. ***Late Collapse:*** *Middle-order wickets and duck penalties.*
>
> *In Late Collapse, our risk engine comes to life. It tracks 9 automated risk flags, including:*
> - *Duck risk when a batter faces balls on 0.*
> - *Expensive economy warnings when a bowler goes over 10.0 RPO.*
> - *Collapse in progress when 3 wickets fall in rapid succession.*
> - *Batters yet to bat who might never get to the crease in a chase.*
>
> *Each player row displays their live status chip: BATTING with an active strike asterisk, BOWLING, OUT, or NOT PLAYING for benched squad members."*

---

## 5. Catch-Up Timeline & Grounded Q&A (3:45 – 4:30)

*(Presenter scrolls to Timeline and Ask Team Box)*

> *"If a fan looks away from the screen for twenty minutes, they can glance at the reverse chronological match timeline.*
>
> *Better yet, they can tap **'⚡ Catch Me Up'**. The system produces a two-line summary recapping the major point-scoring moments since they last looked.*
>
> *Below the timeline is our **'Ask About My Team'** box. Let's ask: 'Who is my captain?'*
>
> *(Types 'Who is my captain?' and taps Ask)*
>
> *The server provides a grounded snapshot of the user's team. The assistant replies: **'Your fantasy team captain is Jasprit Bumrah with a 2x multiplier.'** Prompt injection defenses and strict number validators ensure it never hallucinates fake scores or provides gambling advice."*

---

## 6. Engineering Rigor & Wrap-up (4:30 – 5:00)

> *"To ensure production quality:*
> - ***60 unit and integration tests*** *verify all scoring rules, golden anchors, 20-case AI safety constraints, and state immutability.*
> - ***12 Playwright E2E tests*** *run in CI across Mobile Chrome and Desktop Chrome.*
> - *Zero API keys are exposed to the client bundle.*
> - *The entire app is deployed live on Render with an active health endpoint at `/api/health`.*
>
> *Thank you! I'm happy to answer any questions or walk through specific scoring edge cases."*
