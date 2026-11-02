# PointsPulse — "Why Did My Points Just Change?"

A live, second-screen fantasy cricket companion that explains in one glanceable sentence why your points just changed, who of your 11 is in play, and who is at risk.

> **Disclaimer:** Unofficial prototype. Not affiliated with Dream11, BCCI, IPL, or any franchise. Match events and player movements are simulated.

---

## Architecture & Tech Stack

```
Browser (React + TypeScript + Vite)
  │  same origin
  ▼
Express API on Render
  ├── GET  /api/health    → Render health check + warm-up
  ├── POST /api/explain   → Grounded delta explanation (EN / Hinglish)
  ├── POST /api/ask       → Grounded team Q&A + catch-up recap
  └── Serves Vite production build with SPA fallback

Shared Deterministic Engine (src/engine)
  ├── matchState.ts  → Scoreboard, player statuses, dismissals
  ├── scoring.ts     → Itemised Dream11 T20 scoring rules
  ├── delta.ts       → Before/after diff for user's 11
  ├── risk.ts        → 9 rule-based risk flags
  └── explain.ts     → Templates & strict number validator
```

- **Frontend:** React 18, TypeScript, Vite (mobile-first 390px viewport target).
- **Backend:** Express, TypeScript, Helmet, CORS, strict JSON body limits.
- **AI Phrasing:** OpenRouter (`cohere/north-mini-code:free`) with deterministic mock fallback.
- **Invariant:** The engine calculates all numbers; AI only phrases. The AI model is strictly prohibited from inventing or computing numbers.

---

## Getting Started

### Prerequisites
- Node.js 20+ (developed with Node 26)
- npm 10+

### Setup
```bash
git clone <your-repo-url>
cd dream11
npm install
cp .env.example .env
```

### Development
```bash
# Runs Express backend (port 3001) and Vite frontend (port 5173) concurrently
npm run dev
```

### Testing & Verification
```bash
# Run unit tests (Vitest)
npm test

# Run TypeScript type check
npm run typecheck

# Run linter
npm run lint

# Validate data schemas
npm run validate:data

# Production build (frontend + server)
npm run build

# Start production server
npm start
```

---

## Deployment to Render

The repository includes a [render.yaml](render.yaml) blueprint:
1. Connect your GitHub repository to Render.
2. Select **New > Blueprint** and choose the repository.
3. Add `LLM_API_KEY` in the Render Environment Variables tab if live AI mode is desired (`LLM_MODE=live`).
4. Render will automatically build via `npm ci && npm run build` and launch via `npm start`.
