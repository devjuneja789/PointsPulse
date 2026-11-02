# Submission Note: PointsPulse

Fantasy cricket fans watch live matches with split attention between the TV and their phone. When their score changes, they need an answer in three seconds, not a spreadsheet.

PointsPulse solves the second-screen moment with a strict architectural boundary: **code calculates; AI only phrases**. A deterministic pure TypeScript engine computes itemised Dream11 T20 points, state transitions, and rule-based risk flags directly from simulated match events. The AI layer (backed by OpenRouter with instant deterministic fallback) turns the delta into one clear sentence in English or Hinglish without ever inventing or altering a number.

Built with React, Vite, and Express, the application delivers a glanceable mobile UI displaying instant score deltas, live player statuses, 9 automated risk flags, reverse chronological timelines, and interactive team Q&A.
