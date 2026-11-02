# Submission Note: PointsPulse

Fantasy cricket fans watch live matches with split attention between the TV and their phone. When their score changes, they need an answer in three seconds, not a spreadsheet.

PointsPulse solves this second-screen moment with a strict architectural boundary: **code calculates; AI only phrases**. A deterministic pure TypeScript engine computes itemised Dream11 T20 points, state transitions, and 9 rule-based risk flags directly from ball-by-ball match events. The AI layer (backed by OpenRouter with instant deterministic fallback) turns the delta into one clear sentence in English or Hinglish without ever inventing or altering a number.

Built with React, Vite, and Express, the application delivers a glanceable mobile UI (under 390×844) displaying instant score deltas, live player statuses, Captain/VC multipliers, a timeline, itemised breakdowns, and grounded Q&A.

**Live Artifact:** https://pointspulse.onrender.com  
**Repository:** https://github.com/devjuneja789/pointspulse
