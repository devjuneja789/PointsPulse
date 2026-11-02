import {
  MatchState,
  Player,
  RiskFlag,
  UserTeamConfig,
} from './types';
import rulesData from '../data/rules.json';

export function evaluateRiskFlags(
  state: MatchState,
  allPlayers: Player[],
  userTeam: UserTeamConfig
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const playerMap = new Map<string, Player>(allPlayers.map((p) => [p.id, p]));
  const userPlayerSet = new Set(userTeam.players);

  // 9. Rain Reduced Overs (Global / Match level)
  if (state.scoreboard.isRainInterrupted) {
    flags.push({
      playerId: 'MATCH',
      playerName: 'Match State',
      flagType: 'RAIN_REDUCED_OVERS',
      severity: 'medium',
      messageEn: `Match interrupted by rain. Overs reduced to ${state.scoreboard.maxOvers}.`,
      messageHi: `Baarish ke karan match ${state.scoreboard.maxOvers} overs ka kar diya gaya hai.`,
    });
  }

  const currentOverFloat = state.scoreboard.overs;
  const remainingOvers = Math.max(0, state.scoreboard.maxOvers - currentOverFloat);

  for (const playerId of userPlayerSet) {
    const player = playerMap.get(playerId);
    if (!player) continue;

    const stats = state.playerStats[playerId];
    const status = state.playerStatuses[playerId];
    if (!stats) continue;

    const isCaptain = userTeam.captain === playerId;
    const isViceCaptain = userTeam.viceCaptain === playerId;
    const multiplierWeight = isCaptain ? 'Captain' : isViceCaptain ? 'Vice-Captain' : '';

    // 1. Duck Risk: Batter on 0, balls faced >= 1, role eligible for duck penalty
    if (
      status === 'BATTING' &&
      stats.runs === 0 &&
      stats.ballsFaced >= 1 &&
      !stats.isOut &&
      rulesData.batting.duckAppliesTo.includes(player.role as 'BAT' | 'WK' | 'AR' | 'BOWL')
    ) {
      const severity = isCaptain ? 'high' : 'medium';
      flags.push({
        playerId,
        playerName: player.name,
        flagType: isCaptain ? 'CAPTAIN_AT_RISK' : 'DUCK_RISK',
        severity,
        messageEn: `${multiplierWeight ? `(${multiplierWeight}) ` : ''}${player.name} on 0 off ${stats.ballsFaced} balls, duck risk (-2 pts).`,
        messageHi: `${multiplierWeight ? `(${multiplierWeight}) ` : ''}${player.name} 0 par ${stats.ballsFaced} balls khel chuke hain, duck ka khatra (-2 pts).`,
      });
    }

    // 2. Strike-Rate Drag: 10+ balls, SR <= 70 for non-bowlers
    if (stats.ballsFaced >= 10 && player.role !== 'BOWL') {
      const sr = (stats.runs / stats.ballsFaced) * 100;
      if (sr <= 70) {
        flags.push({
          playerId,
          playerName: player.name,
          flagType: isCaptain ? 'CAPTAIN_AT_RISK' : 'STRIKE_RATE_DRAG',
          severity: isCaptain ? 'high' : 'low',
          messageEn: `${multiplierWeight ? `(${multiplierWeight}) ` : ''}${player.name} strike rate ${sr.toFixed(1)}, below the penalty line.`,
          messageHi: `${multiplierWeight ? `(${multiplierWeight}) ` : ''}${player.name} ka strike rate ${sr.toFixed(1)} penalty band me hai.`,
        });
      }
    }

    // 3. Expensive Bowler: Bowler with 2+ overs and economy >= 10.0 rpo
    if (stats.oversBowled >= 2) {
      const econ = stats.runsConceded / stats.oversBowled;
      if (econ >= 10.0) {
        flags.push({
          playerId,
          playerName: player.name,
          flagType: isCaptain ? 'CAPTAIN_AT_RISK' : 'EXPENSIVE_BOWLER',
          severity: isCaptain ? 'high' : 'medium',
          messageEn: `${multiplierWeight ? `(${multiplierWeight}) ` : ''}${player.name} economy ${econ.toFixed(1)} rpo, costing fantasy points.`,
          messageHi: `${multiplierWeight ? `(${multiplierWeight}) ` : ''}${player.name} ki economy ${econ.toFixed(1)} rpo points ka nuksan kara rahi hai.`,
        });
      }
    }

    // 4. May Not Bat: Batter in XI, yet to bat, few overs left or batting position >= 8 with few wickets fallen
    if (status === 'YET TO BAT') {
      const wicketsFallen = state.scoreboard.wickets;
      if ((player.battingOrder >= 8 && wicketsFallen <= 3) || remainingOvers <= 3) {
        flags.push({
          playerId,
          playerName: player.name,
          flagType: 'MAY_NOT_BAT',
          severity: 'low',
          messageEn: `${player.name} is yet to bat and may not get a chance to face a ball.`,
          messageHi: `${player.name} abhi tak batting par nahi aaye hain, shayad chance na mile.`,
        });
      }
    }

    // 5. May Not Bowl: Rain reduced overs cutting bowler quota
    if (state.scoreboard.isRainInterrupted && (player.role === 'BOWL' || player.role === 'AR')) {
      const maxAllowed = 3;
      if (stats.oversBowled < maxAllowed && remainingOvers < (maxAllowed - stats.oversBowled)) {
        flags.push({
          playerId,
          playerName: player.name,
          flagType: 'MAY_NOT_BOWL',
          severity: 'medium',
          messageEn: `${player.name}'s bowling quota may be capped due to reduced overs.`,
          messageHi: `${player.name} ke bache huye overs baarish ki vajah se cut ho sakte hain.`,
        });
      }
    }

    // 6. Milestone Close (Upside): Batter within 5 runs of 30, 50, or 100
    if (status === 'BATTING' && !stats.isOut) {
      if (stats.runs >= 25 && stats.runs < 30) {
        const diff = 30 - stats.runs;
        flags.push({
          playerId,
          playerName: player.name,
          flagType: 'MILESTONE_CLOSE',
          severity: 'low',
          messageEn: `${player.name} is ${diff} run${diff > 1 ? 's' : ''} away from a +4 milestone bonus.`,
          messageHi: `${player.name} 30 runs milestone bonus (+4) se sirf ${diff} run door hain.`,
        });
      } else if (stats.runs >= 45 && stats.runs < 50) {
        const diff = 50 - stats.runs;
        flags.push({
          playerId,
          playerName: player.name,
          flagType: 'MILESTONE_CLOSE',
          severity: 'low',
          messageEn: `${player.name} is ${diff} run${diff > 1 ? 's' : ''} away from a +8 half-century bonus.`,
          messageHi: `${player.name} half-century bonus (+8) se sirf ${diff} run door hain.`,
        });
      } else if (stats.runs >= 95 && stats.runs < 100) {
        const diff = 100 - stats.runs;
        flags.push({
          playerId,
          playerName: player.name,
          flagType: 'MILESTONE_CLOSE',
          severity: 'low',
          messageEn: `${player.name} is ${diff} run${diff > 1 ? 's' : ''} away from a +16 century bonus!`,
          messageHi: `${player.name} shandar century bonus (+16) se sirf ${diff} run door hain!`,
        });
      }
    }

    // 7. Haul Close (Upside): Bowler on 2 or 4 wickets with overs remaining
    if ((status === 'BOWLING' || status === 'FIELDING') && stats.oversBowled < state.scoreboard.maxOvers / 5) {
      if (stats.wickets === 2) {
        flags.push({
          playerId,
          playerName: player.name,
          flagType: 'HAUL_CLOSE',
          severity: 'low',
          messageEn: `${player.name} is 1 wicket away from a +4 3-wicket haul bonus.`,
          messageHi: `${player.name} 3-wicket haul bonus (+4) se sirf 1 wicket door hain.`,
        });
      } else if (stats.wickets === 4) {
        flags.push({
          playerId,
          playerName: player.name,
          flagType: 'HAUL_CLOSE',
          severity: 'low',
          messageEn: `${player.name} is 1 wicket away from a +16 5-wicket haul bonus!`,
          messageHi: `${player.name} 5-wicket haul bonus (+16) se sirf 1 wicket door hain!`,
        });
      }
    }
  }

  return flags;
}
