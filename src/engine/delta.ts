import {
  MatchEvent,
  PlayerFantasyScore,
  PointDelta,
  ScoringLineItem,
  TeamDelta,
} from './types';

export function calculateTeamDelta(
  oldScores: Record<string, PlayerFantasyScore>,
  newScores: Record<string, PlayerFantasyScore>,
  userPlayerIds: string[],
  event: MatchEvent
): TeamDelta {
  let myTotalBefore = 0;
  let myTotalAfter = 0;
  const changedPlayers: PointDelta[] = [];
  const provisionalChanges: PointDelta[] = [];

  for (const playerId of userPlayerIds) {
    const oldScore = oldScores[playerId];
    const newScore = newScores[playerId];

    const prevTotal = oldScore ? oldScore.totalPoints : 0;
    const nextTotal = newScore ? newScore.totalPoints : 0;

    myTotalBefore += prevTotal;
    myTotalAfter += nextTotal;

    const finalDelta = nextTotal - prevTotal;

    if (Math.abs(finalDelta) > 0.001) {
      const prevBase = oldScore ? oldScore.basePoints : 0;
      const nextBase = newScore ? newScore.basePoints : 0;
      const baseDelta = nextBase - prevBase;
      const multiplier = newScore ? newScore.multiplier : 1.0;

      // Identify changed items
      const newItems = newScore ? newScore.items : [];
      const oldItems = oldScore ? oldScore.items : [];

      // Find items in new that were not in old or have different values
      const deltaItems: ScoringLineItem[] = [];
      let isProvisional = false;

      for (const item of newItems) {
        if (item.category === 'multiplier') continue;
        const matchingOld = oldItems.find((oi) => oi.label === item.label);
        if (!matchingOld) {
          deltaItems.push(item);
          if (item.isProvisional) isProvisional = true;
        } else if (matchingOld.points !== item.points) {
          deltaItems.push({
            ...item,
            points: item.points - matchingOld.points,
          });
          if (item.isProvisional) isProvisional = true;
        }
      }

      // Synthesize descriptive cause
      let cause = event.note || 'Points updated';
      if (event.wicket && event.wicket.playerOut === playerId) {
        cause = `Dismissed (${event.wicket.type})`;
      } else if (event.wicket && event.bowler === playerId) {
        cause = `Took a wicket (${event.wicket.type})`;
      } else if (event.runs === 6 && event.batter === playerId) {
        cause = 'Hit a SIX';
      } else if (event.runs === 4 && event.batter === playerId) {
        cause = 'Hit a boundary FOUR';
      } else if (event.fielders?.includes(playerId) && event.wicket) {
        cause = event.wicket.type.includes('caught') ? 'Took a catch' : 'Fielding dismissal';
      }

      const pointDelta: PointDelta = {
        playerId,
        playerName: newScore ? newScore.playerName : playerId,
        isCaptain: newScore ? newScore.isCaptain : false,
        isViceCaptain: newScore ? newScore.isViceCaptain : false,
        multiplier,
        baseDelta,
        finalDelta,
        items: deltaItems,
        cause,
        isProvisional,
      };

      changedPlayers.push(pointDelta);
      if (isProvisional) {
        provisionalChanges.push(pointDelta);
      }
    }
  }

  // Sort by highest absolute impact first
  changedPlayers.sort((a, b) => Math.abs(b.finalDelta) - Math.abs(a.finalDelta));

  const totalDelta = myTotalAfter - myTotalBefore;
  const noChange = changedPlayers.length === 0;

  return {
    eventId: event.id,
    myTotalBefore,
    myTotalAfter,
    totalDelta,
    changedPlayers,
    provisionalChanges,
    noChange,
  };
}
