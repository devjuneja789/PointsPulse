import {
  PlayerFantasyScore,
  PlayerMatchStats,
  PlayerRole,
  PlayerStatus,
  ScoringLineItem,
} from './types';
import rulesData from '../data/rules.json';

export type ScoringRules = typeof rulesData;

export function calculatePlayerFantasyScore(
  stats: PlayerMatchStats,
  role: PlayerRole,
  playerName: string,
  isCaptain: boolean,
  isViceCaptain: boolean,
  playerStatus: PlayerStatus,
  rules: ScoringRules = rulesData
): PlayerFantasyScore {
  const items: ScoringLineItem[] = [];

  // Player not in XI scores 0
  if (!stats.isInMatchXI && !stats.isImpactSubIntroduced) {
    return {
      playerId: stats.playerId,
      playerName,
      role,
      isCaptain,
      isViceCaptain,
      multiplier: 1.0,
      basePoints: 0,
      totalPoints: 0,
      items: [],
    };
  }

  // 1. Participation Points
  items.push({
    category: 'participation',
    label: stats.isImpactSubIntroduced ? 'Impact Player Announced' : 'In Starting XI',
    points: stats.isImpactSubIntroduced ? rules.substitute : rules.startingXI,
  });

  // 2. Batting Points
  if (stats.runs > 0) {
    items.push({
      category: 'batting',
      label: `Runs (${stats.runs})`,
      points: stats.runs * rules.batting.run,
    });
  }

  if (stats.fours > 0) {
    items.push({
      category: 'batting',
      label: `Boundary Fours (${stats.fours})`,
      points: stats.fours * rules.batting.boundaryFourBonus,
    });
  }

  if (stats.sixes > 0) {
    items.push({
      category: 'batting',
      label: `Sixes (${stats.sixes})`,
      points: stats.sixes * rules.batting.sixBonus,
    });
  }

  // Milestones (Mutually exclusive: 100 > 50 > 30)
  if (stats.runs >= 100) {
    items.push({
      category: 'batting',
      label: 'Century Bonus (100 runs)',
      points: rules.batting.milestones['100'],
    });
  } else if (stats.runs >= 50) {
    items.push({
      category: 'batting',
      label: 'Half-Century Bonus (50 runs)',
      points: rules.batting.milestones['50'],
    });
  } else if (stats.runs >= 30) {
    items.push({
      category: 'batting',
      label: '30 Run Bonus',
      points: rules.batting.milestones['30'],
    });
  }

  // Duck Penalty
  if (
    stats.isOut &&
    stats.runs === 0 &&
    stats.ballsFaced >= 1 &&
    rules.batting.duckAppliesTo.includes(role as 'BAT' | 'WK' | 'AR' | 'BOWL')
  ) {
    items.push({
      category: 'batting',
      label: 'Dismissal for Duck',
      points: rules.batting.duck,
    });
  }

  // Strike Rate (Minimum 10 balls faced; applies to non-bowlers only)
  if (stats.ballsFaced >= rules.strikeRate.minBalls && role !== 'BOWL') {
    const sr = (stats.runs / stats.ballsFaced) * 100;
    const isProvisional = playerStatus === 'BATTING';

    for (const band of rules.strikeRate.bands) {
      if (sr >= band.min && sr <= band.max) {
        if (band.points !== 0) {
          items.push({
            category: 'batting',
            label: `Strike Rate (${sr.toFixed(1)} rpo)`,
            points: band.points,
            isProvisional,
          });
        }
        break;
      }
    }
  }

  // 3. Bowling Points
  if (stats.wickets > 0) {
    items.push({
      category: 'bowling',
      label: `Wickets (${stats.wickets})`,
      points: stats.wickets * rules.bowling.wicket,
    });
  }

  if (stats.bowledLbwCount > 0) {
    items.push({
      category: 'bowling',
      label: `Bowled/LBW Bonus (${stats.bowledLbwCount})`,
      points: stats.bowledLbwCount * rules.bowling.bowledLbwBonus,
    });
  }

  // Wicket Hauls (Mutually exclusive: 5 > 4 > 3)
  if (stats.wickets >= 5) {
    items.push({
      category: 'bowling',
      label: '5-Wicket Haul Bonus',
      points: rules.bowling.wicketHauls['5'],
    });
  } else if (stats.wickets === 4) {
    items.push({
      category: 'bowling',
      label: '4-Wicket Haul Bonus',
      points: rules.bowling.wicketHauls['4'],
    });
  } else if (stats.wickets === 3) {
    items.push({
      category: 'bowling',
      label: '3-Wicket Haul Bonus',
      points: rules.bowling.wicketHauls['3'],
    });
  }

  if (stats.maidens > 0) {
    items.push({
      category: 'bowling',
      label: `Maiden Overs (${stats.maidens})`,
      points: stats.maidens * rules.bowling.maidenOver,
    });
  }

  // Economy Rate (Minimum 2.0 overs bowled)
  if (stats.oversBowled >= rules.economy.minOvers) {
    const econ = stats.runsConceded / stats.oversBowled;
    const isProvisional = playerStatus === 'BOWLING';

    for (const band of rules.economy.bands) {
      if (econ >= band.min && econ <= band.max) {
        if (band.points !== 0) {
          items.push({
            category: 'bowling',
            label: `Economy Rate (${econ.toFixed(1)} rpo)`,
            points: band.points,
            isProvisional,
          });
        }
        break;
      }
    }
  }

  // 4. Fielding Points
  if (stats.catches > 0) {
    items.push({
      category: 'fielding',
      label: `Catches (${stats.catches})`,
      points: stats.catches * rules.fielding.catch,
    });
  }

  if (stats.catches >= 3) {
    items.push({
      category: 'fielding',
      label: '3-Catch Bonus',
      points: rules.fielding.threeCatchBonus,
    });
  }

  if (stats.stumpings > 0) {
    items.push({
      category: 'fielding',
      label: `Stumpings (${stats.stumpings})`,
      points: stats.stumpings * rules.fielding.stumping,
    });
  }

  if (stats.runOutsDirect > 0) {
    items.push({
      category: 'fielding',
      label: `Direct Run-Outs (${stats.runOutsDirect})`,
      points: stats.runOutsDirect * rules.fielding.runOutDirect,
    });
  }

  if (stats.runOutsIndirect > 0) {
    items.push({
      category: 'fielding',
      label: `Indirect Run-Outs (${stats.runOutsIndirect})`,
      points: stats.runOutsIndirect * rules.fielding.runOutIndirect,
    });
  }

  // 5. Multipliers
  const multiplier = isCaptain
    ? rules.multipliers.captain
    : isViceCaptain
    ? rules.multipliers.viceCaptain
    : 1.0;

  const basePoints = items.reduce((acc, curr) => acc + curr.points, 0);
  const totalPoints = basePoints * multiplier;

  if (multiplier > 1.0) {
    items.push({
      category: 'multiplier',
      label: isCaptain ? 'Captain Multiplier (2x)' : 'Vice-Captain Multiplier (1.5x)',
      points: totalPoints - basePoints,
    });
  }

  return {
    playerId: stats.playerId,
    playerName,
    role,
    isCaptain,
    isViceCaptain,
    multiplier,
    basePoints,
    totalPoints,
    items,
  };
}
