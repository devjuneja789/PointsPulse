import { describe, it, expect } from 'vitest';
import miSquadData from '../../src/data/squads/mi.json';
import cskSquadData from '../../src/data/squads/csk.json';
import myTeamData from '../../src/data/myTeam.json';
import rulesData from '../../src/data/rules.json';
import fullMatchScript from '../../src/data/scripts/full-match.json';
import powerplayScript from '../../src/data/scripts/powerplay-blitz.json';
import collapseScript from '../../src/data/scripts/late-collapse.json';
import { Player, MatchInfo, MatchEvent, PlayerFantasyScore, UserTeamConfig } from '../../src/engine/types';
import { createInitialMatchState, reduceMatchState } from '../../src/engine/matchState';
import { calculatePlayerFantasyScore } from '../../src/engine/scoring';
import { calculateTeamDelta } from '../../src/engine/delta';
import { evaluateRiskFlags } from '../../src/engine/risk';

const allPlayers: Player[] = [
  ...(miSquadData.players as Player[]),
  ...(cskSquadData.players as Player[]),
];

const scripts = [
  { id: 'full-match', data: fullMatchScript },
  { id: 'powerplay-blitz', data: powerplayScript },
  { id: 'late-collapse', data: collapseScript },
];

describe('Phase 5: QA & Hardening Suite', () => {
  // Invariant 1: Team total equals sum of 11 player points at every single event across all scripts
  it('Invariant 1: Team total equals sum of 11 player points at every event across all 3 scripts', () => {
    for (const { data } of scripts) {
      const matchInfo = data.matchInfo as MatchInfo;
      let state = createInitialMatchState(matchInfo, allPlayers);
      const playerScores: Record<string, PlayerFantasyScore> = {};

      for (const p of allPlayers) {
        const isCap = p.id === myTeamData.captain;
        const isVC = p.id === myTeamData.viceCaptain;
        playerScores[p.id] = calculatePlayerFantasyScore(
          state.playerStats[p.id],
          p.role,
          p.name,
          isCap,
          isVC,
          state.playerStatuses[p.id],
          rulesData
        );
      }

      for (const ev of data.events as MatchEvent[]) {
        const prevScoresSnapshot = { ...playerScores };
        state = reduceMatchState(state, ev, matchInfo);

        for (const p of allPlayers) {
          const isCap = p.id === myTeamData.captain;
          const isVC = p.id === myTeamData.viceCaptain;
          playerScores[p.id] = calculatePlayerFantasyScore(
            state.playerStats[p.id],
            p.role,
            p.name,
            isCap,
            isVC,
            state.playerStatuses[p.id],
            rulesData
          );
        }

        const delta = calculateTeamDelta(prevScoresSnapshot, playerScores, myTeamData.players, ev);
        const actualUserTotal = myTeamData.players.reduce(
          (sum, pId) => sum + playerScores[pId].totalPoints,
          0
        );

        expect(delta.myTotalAfter).toBeCloseTo(actualUserTotal, 4);
        expect(delta.myTotalAfter - delta.myTotalBefore).toBeCloseTo(delta.totalDelta, 4);
      }
    }
  });

  // Invariant 2: Multipliers are exact
  it('Invariant 2: Multiplier arithmetic is strictly exact (2.0x Captain, 1.5x VC)', () => {
    const bumrah = allPlayers.find((p) => p.id === 'mi_bumrah')!;
    const sky = allPlayers.find((p) => p.id === 'mi_sky')!;
    const state = createInitialMatchState(fullMatchScript.matchInfo as MatchInfo, allPlayers);

    // Captain Bumrah (2.0x)
    const capScore = calculatePlayerFantasyScore(
      state.playerStats[bumrah.id],
      bumrah.role,
      bumrah.name,
      true,
      false,
      'BOWLING',
      rulesData
    );
    expect(capScore.multiplier).toBe(2.0);
    expect(capScore.totalPoints).toBe(capScore.basePoints * 2.0);

    // VC SKY (1.5x)
    const vcScore = calculatePlayerFantasyScore(
      state.playerStats[sky.id],
      sky.role,
      sky.name,
      false,
      true,
      'BATTING',
      rulesData
    );
    expect(vcScore.multiplier).toBe(1.5);
    expect(vcScore.totalPoints).toBe(vcScore.basePoints * 1.5);
  });

  // Invariant 3: Provisional items are flagged correctly
  it('Invariant 3: Provisional economy items are flagged while bowler is still active', () => {
    let state = createInitialMatchState(fullMatchScript.matchInfo as MatchInfo, allPlayers);
    for (let i = 0; i < 15; i++) {
      state = reduceMatchState(state, fullMatchScript.events[i] as MatchEvent, fullMatchScript.matchInfo as MatchInfo);
    }

    const bumrahScore = calculatePlayerFantasyScore(
      state.playerStats['mi_bumrah'],
      'BOWL',
      'Jasprit Bumrah',
      true,
      false,
      state.playerStatuses['mi_bumrah'],
      rulesData
    );

    const econItem = bumrahScore.items.find((item) => item.label.includes('Economy'));
    if (econItem) {
      expect(econItem.isProvisional).toBe(true);
    }
  });

  // Invariant 4: Risk engine triggers risk flags on collapse scenario
  it('Invariant 4: Risk engine assesses active risks during late collapse', () => {
    let state = createInitialMatchState(collapseScript.matchInfo as MatchInfo, allPlayers);
    for (const ev of collapseScript.events as MatchEvent[]) {
      state = reduceMatchState(state, ev, collapseScript.matchInfo as MatchInfo);
    }

    const flags = evaluateRiskFlags(state, allPlayers, myTeamData as UserTeamConfig);
    expect(Array.isArray(flags)).toBe(true);
    expect(flags.length).toBeGreaterThan(0);
  });

  // Invariant 5: State reducer produces pure states without mutating previous references
  it('Invariant 5: State reducer produces immutable states without mutating prior history', () => {
    const s0 = createInitialMatchState(fullMatchScript.matchInfo as MatchInfo, allPlayers);
    const s1 = reduceMatchState(s0, fullMatchScript.events[0] as MatchEvent, fullMatchScript.matchInfo as MatchInfo);

    expect(s0.scoreboard.runs).toBe(0);
    expect(s0.scoreboard.wickets).toBe(0);
    expect(s0).not.toBe(s1);
  });
});
