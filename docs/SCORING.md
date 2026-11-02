# PointsPulse — Verified Dream11 T20 Scoring Specification

**Status:** Verified & Locked  
**Source:** Dream11 Official Help Centre (Fantasy Cricket Points System — T20)  
**Rules Version:** `2026.1-t20`  
**Verified On:** 2 November 2026  

---

## 1. Core Points Table

### 1.1 Match Participation
- **Starting XI:** +4 pts
- **Substitute / Impact Player:** +4 pts (awarded upon being fielded/introduced)

### 1.2 Batting Points
| Event | Points |
|---|---|
| Run scored | +1 pt |
| Boundary Bonus (Four) | +1 pt |
| Six Bonus | +2 pts |
| 30 Run Bonus | +4 pts |
| Half-Century (50 runs) Bonus | +8 pts *(replaces 30 run bonus)* |
| Century (100 runs) Bonus | +16 pts *(replaces 50 & 30 run bonuses)* |
| Dismissal for Duck (0 runs) | -2 pts *(Applies to BAT, WK, AR roles only)* |

### 1.3 Bowling Points
| Event | Points |
|---|---|
| Wicket (excl. run-out) | +25 pts |
| Bowled / LBW Bonus | +8 pts |
| 3-Wicket Haul Bonus | +4 pts |
| 4-Wicket Haul Bonus | +8 pts *(replaces 3-wicket bonus)* |
| 5-Wicket Haul Bonus | +16 pts *(replaces 4 & 3-wicket bonuses)* |
| Maiden Over | +12 pts |
| Dot Ball | 0 pts |

### 1.4 Fielding Points
| Event | Points |
|---|---|
| Catch | +8 pts |
| 3-Catch Bonus | +4 pts *(triggered once on 3rd catch)* |
| Stumping | +12 pts |
| Run Out (Direct Hit) | +12 pts |
| Run Out (Indirect / Thrower & Catcher) | +6 pts each |

### 1.5 Multipliers
- **Captain (C):** 2.0x applied to player's total points
- **Vice-Captain (VC):** 1.5x applied to player's total points

---

## 2. Threshold-Based Scoring (Economy & Strike Rate)

### 2.1 Economy Rate Bands (Minimum 2 Overs Bowled)
| Runs Per Over (RPO) | Points |
|---|---|
| Below 5.00 rpo | +6 pts |
| 5.00 – 5.99 rpo | +4 pts |
| 6.00 – 7.00 rpo | +2 pts |
| 7.01 – 9.99 rpo | 0 pts |
| 10.00 – 11.00 rpo | -2 pts |
| 11.01 – 12.00 rpo | -4 pts |
| Above 12.00 rpo | -6 pts |

*Note: Economy rate points are **provisional** during live play until the bowler's spell finishes, and can adjust after each ball.*

### 2.2 Strike Rate Bands (Minimum 10 Balls Faced, Non-Bowlers)
| Strike Rate (runs per 100 balls) | Points |
|---|---|
| Above 170.00 | +6 pts |
| 150.01 – 170.00 | +4 pts |
| 130.00 – 150.00 | +2 pts |
| 70.01 – 129.99 | 0 pts |
| 60.00 – 70.00 | -2 pts |
| 50.00 – 59.99 | -4 pts |
| Below 50.00 | -6 pts |

---

## 3. Golden Anchors (Phase 2 Fixtures)

The following totals are hand-calculated and serve as deterministic test anchors:

| Role | Player | Expected Base | Multiplier | Expected Final Total | Key Events |
|---|---|---|---|---|---|
| **Batter** | Rohit Sharma (`mi_rohit`) | 9.0 | 1.0x | **9.0 pts** | XI (4), 4 runs + four bonus (5) |
| **Bowler** | Matheesha Pathirana (`csk_pathirana`) | 101.0 | 1.0x | **101.0 pts** | XI (4), 3 wkts (25+33+33), 3-haul (4), Econ (2) |
| **Fielder** | Ravindra Jadeja (`csk_jadeja`) | 44.0 | 1.0x | **44.0 pts** | XI (4), 3 catches (8+8+8), 3-catch bonus (4), direct run-out (12) |
| **Captain** | Jasprit Bumrah (`mi_bumrah`) | 81.0 | 2.0x | **162.0 pts** | XI (4), bowled wkt (33), maiden (12), cgt wkt (25), econ (6), 1 run (1) |
| **Vice-Captain** | Suryakumar Yadav (`mi_sky`) | 88.0 | 1.5x | **132.0 pts** | XI (4), 52 runs + 4 fours + 3 sixes + 50 bonus + SR bonus (76), catch (8) |
