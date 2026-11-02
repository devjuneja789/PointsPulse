import { describe, it, expect } from 'vitest';
import {
  createInitialMatchStats,
  createInitialMatchState,
  reduceMatchState,
  calculatePlayerFantasyScore,
  calculateTeamDelta,
  evaluateRiskFlags,
  validateExplanationText,
  getExplanationForEvent,
  MatchEvent,
  MatchInfo,
  Player,
  UserTeamConfig,
  PlayerFantasyScore,
} from '../../src/engine';

import miSquadData from '../../src/data/squads/mi.json';
import cskSquadData from '../../src/data/squads/csk.json';
import myTeamData from '../../src/data/myTeam.json';
import fullMatchScript from '../../src/data/scripts/full-match.json';
import goldenAnchorsData from '../../src/data/golden-anchors.json';
import rulesData from '../../src/data/rules.json';

const allPlayers: Player[] = [
  ...(miSquadData.players as Player[]),
  ...(cskSquadData.players as Player[]),
];

const matchInfo: MatchInfo = fullMatchScript.matchInfo as MatchInfo;
const userTeam: UserTeamConfig = myTeamData as UserTeamConfig;

describe('Phase 2: Deterministic Engine Tests', () => {
  describe('Edge Cases & Rule-Specific Scoring', () => {
    it('awards bowled and LBW bonus (+8) along with wicket (+25)', () => {
      const stats = createInitialMatchStats('mi_bumrah', true);
      stats.wickets = 1;
      stats.bowledLbwCount = 1;

      const score = calculatePlayerFantasyScore(
        stats,
        'BOWL',
        'Jasprit Bumrah',
        false,
        false,
        'BOWLING',
        rulesData
      );

      const wicketItem = score.items.find((i) => i.label.includes('Wickets'));
      const bonusItem = score.items.find((i) => i.label.includes('Bowled/LBW'));

      expect(wicketItem?.points).toBe(25);
      expect(bonusItem?.points).toBe(8);
      expect(score.basePoints).toBe(4 + 25 + 8); // 4 for starting XI
    });

    it('run-out does not credit the bowler with a wicket', () => {
      let state = createInitialMatchState(matchInfo, allPlayers);
      const runOutEvent: MatchEvent = {
        id: 'test_ro',
        innings: 1,
        over: 3.1,
        ball: 19,
        batter: 'mi_hardik',
        bowler: 'csk_pathirana',
        runs: 0,
        extras: 0,
        wicket: {
          type: 'run_out',
          playerOut: 'mi_hardik',
          fielders: ['csk_jadeja'],
        },
        fielders: ['csk_jadeja'],
        note: 'Direct hit run-out',
      };

      state = reduceMatchState(state, runOutEvent, matchInfo);

      expect(state.playerStats['csk_pathirana'].wickets).toBe(0);
      expect(state.playerStats['csk_jadeja'].runOutsDirect).toBe(1);
    });

    it('direct run-out awards +12 pts, indirect awards +6 pts each', () => {
      const directStats = createInitialMatchStats('p1', true);
      directStats.runOutsDirect = 1;
      const directScore = calculatePlayerFantasyScore(
        directStats,
        'AR',
        'Fielder 1',
        false,
        false,
        'FIELDING',
        rulesData
      );
      expect(directScore.items.find((i) => i.label.includes('Direct'))?.points).toBe(12);

      const indirectStats = createInitialMatchStats('p2', true);
      indirectStats.runOutsIndirect = 1;
      const indirectScore = calculatePlayerFantasyScore(
        indirectStats,
        'AR',
        'Fielder 2',
        false,
        false,
        'FIELDING',
        rulesData
      );
      expect(indirectScore.items.find((i) => i.label.includes('Indirect'))?.points).toBe(6);
    });

    it('duck penalty applies only to eligible roles (BAT/WK/AR) and only on dismissal for 0', () => {
      // Batter out on 0
      const batStats = createInitialMatchStats('mi_rohit', true);
      batStats.isOut = true;
      batStats.runs = 0;
      batStats.ballsFaced = 2;
      const batScore = calculatePlayerFantasyScore(
        batStats,
        'BAT',
        'Batter',
        false,
        false,
        'OUT',
        rulesData
      );
      expect(batScore.items.find((i) => i.label.includes('Duck'))?.points).toBe(-2);

      // Bowler out on 0 (exempt from duck penalty in rules)
      const bowlStats = createInitialMatchStats('mi_bumrah', true);
      bowlStats.isOut = true;
      bowlStats.runs = 0;
      bowlStats.ballsFaced = 2;
      const bowlScore = calculatePlayerFantasyScore(
        bowlStats,
        'BOWL',
        'Bowler',
        false,
        false,
        'OUT',
        rulesData
      );
      expect(bowlScore.items.find((i) => i.label.includes('Duck'))).toBeUndefined();

      // Batter not out on 0 (no penalty until dismissed)
      const notOutStats = createInitialMatchStats('mi_rohit', true);
      notOutStats.isOut = false;
      notOutStats.runs = 0;
      notOutStats.ballsFaced = 2;
      const notOutScore = calculatePlayerFantasyScore(
        notOutStats,
        'BAT',
        'Batter',
        false,
        false,
        'BATTING',
        rulesData
      );
      expect(notOutScore.items.find((i) => i.label.includes('Duck'))).toBeUndefined();
    });

    it('economy rate requires minimum 2.0 overs bowled and reflects provisional tag while bowling', () => {
      const stats = createInitialMatchStats('csk_tushar', true);
      stats.oversBowled = 1.0;
      stats.runsConceded = 4; // 4.0 rpo, but only 1 over bowled

      let score = calculatePlayerFantasyScore(
        stats,
        'BOWL',
        'Tushar Deshpande',
        false,
        false,
        'BOWLING',
        rulesData
      );
      expect(score.items.find((i) => i.label.includes('Economy'))).toBeUndefined();

      // After 2.0 overs
      stats.oversBowled = 2.0;
      stats.runsConceded = 8; // 4.0 rpo (<5.0) -> +6 pts
      score = calculatePlayerFantasyScore(
        stats,
        'BOWL',
        'Tushar Deshpande',
        false,
        false,
        'BOWLING',
        rulesData
      );
      const econItem = score.items.find((i) => i.label.includes('Economy'));
      expect(econItem?.points).toBe(6);
      expect(econItem?.isProvisional).toBe(true); // marked provisional while bowling
    });

    it('three-catch bonus (+4) triggers only once when 3 or more catches are taken', () => {
      const stats = createInitialMatchStats('csk_jadeja', true);
      stats.catches = 3;

      const score = calculatePlayerFantasyScore(
        stats,
        'AR',
        'Ravindra Jadeja',
        false,
        false,
        'FIELDING',
        rulesData
      );

      const catchPoints = score.items.find((i) => i.label.includes('Catches'))?.points;
      const bonusPoints = score.items.find((i) => i.label.includes('3-Catch Bonus'))?.points;

      expect(catchPoints).toBe(24); // 3 * 8
      expect(bonusPoints).toBe(4); // bonus triggers once
    });

    it('player not in match XI scores 0 and shows NOT PLAYING', () => {
      const benchedStats = createInitialMatchStats('mi_brevis', false);
      const score = calculatePlayerFantasyScore(
        benchedStats,
        'BAT',
        'Dewald Brevis',
        false,
        false,
        'NOT PLAYING',
        rulesData
      );

      expect(score.totalPoints).toBe(0);
      expect(score.basePoints).toBe(0);
      expect(score.items).toHaveLength(0);
    });

    it('super over events are ignored and not scored', () => {
      const initial = createInitialMatchState(matchInfo, allPlayers);
      const superOverEvent: MatchEvent = {
        id: 'so_1',
        innings: 1,
        over: 0.1,
        ball: 1,
        batter: 'mi_rohit',
        bowler: 'csk_pathirana',
        runs: 6,
        extras: 0,
        isSuperOver: true,
        wicket: null,
        note: 'Super over six',
      };

      const next = reduceMatchState(initial, superOverEvent, matchInfo);
      expect(next).toBe(initial); // Same reference, no change
    });

    it('correctly applies multipliers: Captain 2.0x and Vice-Captain 1.5x', () => {
      const stats = createInitialMatchStats('p1', true);
      stats.runs = 20;

      const captainScore = calculatePlayerFantasyScore(
        stats,
        'BAT',
        'Player 1',
        true,
        false,
        'BATTING',
        rulesData
      );
      expect(captainScore.basePoints).toBe(24); // 4 starting + 20 runs
      expect(captainScore.multiplier).toBe(2.0);
      expect(captainScore.totalPoints).toBe(48);

      const vcScore = calculatePlayerFantasyScore(
        stats,
        'BAT',
        'Player 1',
        false,
        true,
        'BATTING',
        rulesData
      );
      expect(vcScore.multiplier).toBe(1.5);
      expect(vcScore.totalPoints).toBe(36);
    });
  });

  describe('Strict Number & Safety Validator', () => {
    const mockDelta = {
      eventId: 'test_1',
      myTotalBefore: 100,
      myTotalAfter: 166,
      totalDelta: 66,
      changedPlayers: [
        {
          playerId: 'mi_bumrah',
          playerName: 'Jasprit Bumrah',
          isCaptain: true,
          isViceCaptain: false,
          multiplier: 2,
          baseDelta: 33,
          finalDelta: 66,
          items: [{ category: 'bowling' as const, label: 'Wicket', points: 25 }, { category: 'bowling' as const, label: 'Bowled', points: 8 }],
          cause: 'Took a wicket',
        },
      ],
      provisionalChanges: [],
      noChange: false,
    };

    it('accepts valid text containing only numbers in payload or structural allowed numbers', () => {
      const text = 'Jasprit Bumrah took a wicket (25 pts) and bowled bonus (8 pts) = 33 base x 2 Captain = +66 pts. Total: 166 pts.';
      const res = validateExplanationText(text, mockDelta, 'EN');
      expect(res.isValid).toBe(true);
    });

    it('rejects text containing invented or halluncinated numbers', () => {
      const text = 'Jasprit Bumrah took a wicket for 99 pts! Your team now has 500 pts.';
      const res = validateExplanationText(text, mockDelta, 'EN');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('Invented or unverified number');
    });

    it('rejects text exceeding 35 words', () => {
      const longText =
        'This is a very very long explanation written by a verbose model that goes on and on without stopping to explain simple fantasy points in way more detail than the thirty-five word maximum allowed limit under any circumstance whatsoever.';
      const res = validateExplanationText(longText, mockDelta, 'EN');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('exceeds 35 words');
    });

    it('rejects Hinglish containing Devanagari script', () => {
      const devanagariText = 'Jasprit Bumrah ne Ruturaj ko आउट kiya (+66 pts).';
      const res = validateExplanationText(devanagariText, mockDelta, 'HI');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('Devanagari script detected');
    });

    it('rejects banned betting or gambling terms', () => {
      const gamblingText = 'Jasprit Bumrah got +66 pts! Bet on Mumbai to win big profit today!';
      const res = validateExplanationText(gamblingText, mockDelta, 'EN');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('Banned word detected');
    });
  });

  describe('Full Match Replay: Invariants & Golden Anchors', () => {
    it('satisfies both invariants after EVERY single ball in full-match.json and matches all 5 Golden Anchors', () => {
      let state = createInitialMatchState(matchInfo, allPlayers);

      // Track player scores map
      const playerScores: Record<string, PlayerFantasyScore> = {};

      // Compute initial points (starting XI participation)
      for (const p of allPlayers) {
        const isC = userTeam.captain === p.id;
        const isVC = userTeam.viceCaptain === p.id;
        playerScores[p.id] = calculatePlayerFantasyScore(
          state.playerStats[p.id],
          p.role,
          p.name,
          isC,
          isVC,
          state.playerStatuses[p.id],
          rulesData
        );
      }

      // Replay all events
      for (let i = 0; i < fullMatchScript.events.length; i++) {
        const ev = fullMatchScript.events[i] as MatchEvent;
        state = reduceMatchState(state, ev, matchInfo);

        // Recompute fantasy scores from cumulative stats
        const prevScoresSnapshot = { ...playerScores };
        for (const p of allPlayers) {
          const isC = userTeam.captain === p.id;
          const isVC = userTeam.viceCaptain === p.id;
          playerScores[p.id] = calculatePlayerFantasyScore(
            state.playerStats[p.id],
            p.role,
            p.name,
            isC,
            isVC,
            state.playerStatuses[p.id],
            rulesData
          );
        }

        // Calculate delta for user team
        const delta = calculateTeamDelta(prevScoresSnapshot, playerScores, userTeam.players, ev);

        // INVARIANT 1: Sum of player totals in user team equals displayed total
        const actualUserTotal = userTeam.players.reduce(
          (sum, pId) => sum + playerScores[pId].totalPoints,
          0
        );
        expect(delta.myTotalAfter).toBeCloseTo(actualUserTotal, 4);

        // INVARIANT 2: myTotalAfter - myTotalBefore === totalDelta
        expect(delta.myTotalAfter - delta.myTotalBefore).toBeCloseTo(delta.totalDelta, 4);

        // INVARIANT 3: sum of changedPlayers.finalDelta === totalDelta
        const sumChangedFinal = delta.changedPlayers.reduce((acc, cp) => acc + cp.finalDelta, 0);
        expect(sumChangedFinal).toBeCloseTo(delta.totalDelta, 4);

        // INVARIANT 4: Explanation text passes validation or selects clean fallback
        const explanation = getExplanationForEvent('full-match', ev.id, delta, 'EN');
        expect(explanation.text).toBeTruthy();
        expect(explanation.text.split(/\s+/).length).toBeLessThanOrEqual(35);
      }

      // Assert All 5 Golden Anchors against final calculated totals!
      const anchors = goldenAnchorsData.anchors;

      // 1. Batter Anchor (Rohit Sharma)
      const rohitScore = playerScores[anchors.batter.playerId];
      expect(rohitScore.basePoints).toBeCloseTo(anchors.batter.expectedBase, 2);
      expect(rohitScore.totalPoints).toBeCloseTo(anchors.batter.expectedTotal, 2);

      // 2. Bowler Anchor (Matheesha Pathirana)
      const pathiranaScore = playerScores[anchors.bowler.playerId];
      expect(pathiranaScore.basePoints).toBeCloseTo(anchors.bowler.expectedBase, 2);
      expect(pathiranaScore.totalPoints).toBeCloseTo(anchors.bowler.expectedTotal, 2);

      // 3. Fielder Anchor (Ravindra Jadeja)
      const jadejaScore = playerScores[anchors.fielder.playerId];
      expect(jadejaScore.basePoints).toBeCloseTo(anchors.fielder.expectedBase, 2);
      expect(jadejaScore.totalPoints).toBeCloseTo(anchors.fielder.expectedTotal, 2);

      // 4. Captain Anchor (Jasprit Bumrah, 2.0x)
      const bumrahScore = playerScores[anchors.captain.playerId];
      expect(bumrahScore.basePoints).toBeCloseTo(anchors.captain.expectedBase, 2);
      expect(bumrahScore.multiplier).toBe(2.0);
      expect(bumrahScore.totalPoints).toBeCloseTo(anchors.captain.expectedTotal, 2);

      // 5. Vice-Captain Anchor (Suryakumar Yadav, 1.5x)
      const skyScore = playerScores[anchors.viceCaptain.playerId];
      expect(skyScore.basePoints).toBeCloseTo(anchors.viceCaptain.expectedBase, 2);
      expect(skyScore.multiplier).toBe(1.5);
      expect(skyScore.totalPoints).toBeCloseTo(anchors.viceCaptain.expectedTotal, 2);
    });

    it('evaluates rule-based risk flags accurately', () => {
      let state = createInitialMatchState(matchInfo, allPlayers);

      // Advance to collapse scenario
      for (const ev of fullMatchScript.events) {
        state = reduceMatchState(state, ev as MatchEvent, matchInfo);
      }

      const flags = evaluateRiskFlags(state, allPlayers, userTeam);
      expect(flags.length).toBeGreaterThan(0);

      // Rain reduced flag present
      const rainFlag = flags.find((f) => f.flagType === 'RAIN_REDUCED_OVERS');
      expect(rainFlag).toBeDefined();
    });
  });
});
