import {
  MatchEvent,
  MatchInfo,
  MatchScoreboard,
  MatchState,
  PlayerMatchStats,
  PlayerStatus,
  Player,
} from './types';

export function createInitialMatchStats(playerId: string, isInMatchXI: boolean): PlayerMatchStats {
  return {
    playerId,
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    ballsBowled: 0,
    oversBowled: 0,
    currentOverRuns: 0,
    currentOverLegalBalls: 0,
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
    bowledLbwCount: 0,
    dots: 0,
    catches: 0,
    stumpings: 0,
    runOutsDirect: 0,
    runOutsIndirect: 0,
    hasBatted: false,
    hasBowled: false,
    isInMatchXI,
    isImpactSubIntroduced: false,
  };
}

export function createInitialMatchState(
  matchInfo: MatchInfo,
  allPlayers: Player[]
): MatchState {
  const scoreboard: MatchScoreboard = {
    innings: 1,
    teamBatting: matchInfo.battingFirst,
    teamBowling: matchInfo.bowlingFirst,
    runs: 0,
    wickets: 0,
    overs: 0,
    legalBallsInOver: 0,
    isRainInterrupted: false,
    maxOvers: 20,
  };

  const playerStats: Record<string, PlayerMatchStats> = {};
  const playerStatuses: Record<string, PlayerStatus> = {};

  const matchXI = new Set([
    ...matchInfo.playingXI.MI,
    ...matchInfo.playingXI.CSK,
  ]);

  for (const player of allPlayers) {
    const inXI = matchXI.has(player.id);
    playerStats[player.id] = createInitialMatchStats(player.id, inXI);

    if (!inXI) {
      playerStatuses[player.id] = 'NOT PLAYING';
    } else if (player.team === matchInfo.battingFirst) {
      playerStatuses[player.id] = 'YET TO BAT';
    } else {
      playerStatuses[player.id] = 'FIELDING';
    }
  }

  return {
    scoreboard,
    playerStats,
    playerStatuses,
    isInningsBreak: false,
    isMatchComplete: false,
  };
}

export function reduceMatchState(
  prevState: MatchState,
  event: MatchEvent,
  matchInfo: MatchInfo
): MatchState {
  if (event.isSuperOver) {
    return prevState; // Super overs are not scored in standard Dream11 fantasy rules
  }

  // Deep clone previous state objects to ensure pure immutability
  const scoreboard: MatchScoreboard = { ...prevState.scoreboard };
  const playerStats: Record<string, PlayerMatchStats> = {};
  for (const [id, stats] of Object.entries(prevState.playerStats)) {
    playerStats[id] = { ...stats };
  }
  const playerStatuses: Record<string, PlayerStatus> = { ...prevState.playerStatuses };

  // Innings transition check
  if (event.innings !== scoreboard.innings) {
    scoreboard.innings = event.innings;
    const prevBatting = scoreboard.teamBatting;
    scoreboard.teamBatting = scoreboard.teamBowling;
    scoreboard.teamBowling = prevBatting;
    scoreboard.legalBallsInOver = 0;

    // Reset fielding/batting statuses for new innings
    for (const [id, stats] of Object.entries(playerStats)) {
      if (!stats.isInMatchXI) {
        playerStatuses[id] = 'NOT PLAYING';
      } else {
        // Find player's team by prefix or match info
        const isNowBattingTeam = matchInfo.playingXI[scoreboard.teamBatting as 'MI' | 'CSK']?.includes(id);
        if (isNowBattingTeam) {
          if (!stats.hasBatted) {
            playerStatuses[id] = 'YET TO BAT';
          }
        } else {
          playerStatuses[id] = 'FIELDING';
        }
      }
    }
  }

  // Scenario 11: Rain Interruption
  if (event.scenario === 'SCENARIO_11_RAIN_INTERRUPT') {
    scoreboard.isRainInterrupted = true;
    scoreboard.maxOvers = 16;
  }

  // Scenario 13 / Impact Sub check
  if (event.scenario === 'SCENARIO_IMPACT_SUB' && event.batter) {
    if (playerStats[event.batter]) {
      playerStats[event.batter].isImpactSubIntroduced = true;
      playerStats[event.batter].isInMatchXI = true;
    }
  }

  const batter = playerStats[event.batter];
  const bowler = playerStats[event.bowler];

  // Update Batter Stats
  if (batter) {
    batter.hasBatted = true;
    batter.ballsFaced += 1;
    batter.runs += event.runs;
    if (event.runs === 4) batter.fours += 1;
    if (event.runs === 6) batter.sixes += 1;
    playerStatuses[event.batter] = 'BATTING';
  }

  if (event.nonStriker && playerStats[event.nonStriker]) {
    const nonStriker = playerStats[event.nonStriker];
    nonStriker.hasBatted = true;
    if (!nonStriker.isOut) {
      playerStatuses[event.nonStriker] = 'BATTING';
    }
  }

  // Update Bowler Stats
  if (bowler) {
    bowler.hasBowled = true;
    bowler.ballsBowled += 1;
    const runsConcededOnBall = event.runs + event.extras;
    bowler.runsConceded += runsConcededOnBall;
    bowler.currentOverRuns += runsConcededOnBall;
    bowler.currentOverLegalBalls += 1;

    if (runsConcededOnBall === 0) {
      bowler.dots += 1;
    }

    if (bowler.currentOverLegalBalls === 6) {
      bowler.oversBowled += 1;
      if (bowler.currentOverRuns === 0) {
        bowler.maidens += 1;
      }
      bowler.currentOverRuns = 0;
      bowler.currentOverLegalBalls = 0;
    }

    // Set bowler status
    const maxQuota = scoreboard.isRainInterrupted ? 3 : 4;
    if (bowler.oversBowled >= maxQuota) {
      playerStatuses[event.bowler] = 'BOWLED OUT';
    } else {
      playerStatuses[event.bowler] = 'BOWLING';
    }
  }

  // Update Scoreboard runs & balls
  scoreboard.runs += (event.runs + event.extras);
  scoreboard.legalBallsInOver = (event.ball % 6 === 0) ? 6 : (event.ball % 6);
  scoreboard.overs = event.over;

  // Handle Dismissal / Wicket
  if (event.wicket) {
    scoreboard.wickets += 1;
    const dismissedPlayer = playerStats[event.wicket.playerOut];
    if (dismissedPlayer) {
      dismissedPlayer.isOut = true;
      dismissedPlayer.dismissalType = event.wicket.type;
      playerStatuses[event.wicket.playerOut] = 'OUT';
    }

    // Bowler wicket credits (run-out does not credit bowler)
    const isRunOut = event.wicket.type.includes('run_out');
    if (bowler && !isRunOut) {
      bowler.wickets += 1;
      const wType = event.wicket.type.toLowerCase();
      if (wType.includes('bowled') || wType.includes('lbw')) {
        bowler.bowledLbwCount += 1;
      }
    }

    // Fielding credits
    const wType = event.wicket.type.toLowerCase();
    const fielders = event.fielders || event.wicket.fielders || [];

    if (wType.includes('caught')) {
      for (const fId of fielders) {
        if (playerStats[fId]) {
          playerStats[fId].catches += 1;
        }
      }
    } else if (wType.includes('stumping')) {
      for (const fId of fielders) {
        if (playerStats[fId]) {
          playerStats[fId].stumpings += 1;
        }
      }
    } else if (isRunOut) {
      if (fielders.length === 1) {
        // Direct hit run out
        if (playerStats[fielders[0]]) {
          playerStats[fielders[0]].runOutsDirect += 1;
        }
      } else {
        // Indirect run out (thrower & catcher)
        for (const fId of fielders) {
          if (playerStats[fId]) {
            playerStats[fId].runOutsIndirect += 1;
          }
        }
      }
    }
  }

  // Scenario 18 / Innings break check
  let isInningsBreak = false;
  if (event.scenario === 'SCENARIO_INNINGS_BREAK') {
    isInningsBreak = true;
  }

  return {
    scoreboard,
    playerStats,
    playerStatuses,
    strikerId: event.batter,
    nonStrikerId: event.nonStriker,
    currentBowlerId: event.bowler,
    lastEventId: event.id,
    isInningsBreak,
    isMatchComplete: false,
  };
}
