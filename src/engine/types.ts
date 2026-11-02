export type PlayerRole = 'BAT' | 'BOWL' | 'AR' | 'WK';

export type PlayerStatus =
  | 'BATTING'
  | 'BOWLING'
  | 'BOWLED OUT'
  | 'YET TO BAT'
  | 'OUT'
  | 'FIELDING'
  | 'NOT PLAYING'
  | 'IMPACT SUB';

export interface Player {
  id: string;
  name: string;
  team: string;
  role: PlayerRole;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isBenched?: boolean;
}

export interface MatchScoreboard {
  teamBatting: string;
  teamBowling: string;
  runs: number;
  wickets: number;
  overs: number;
  currentOverBalls: number;
  target?: number;
}

export interface PlayerMatchStats {
  playerId: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissal?: string;
  oversBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  catches: number;
  stumpings: number;
  runOutsDirect: number;
  runOutsIndirect: number;
  fantasyPoints: number;
}

export interface MatchState {
  scoreboard: MatchScoreboard;
  playerStats: Record<string, PlayerMatchStats>;
  playerStatuses: Record<string, PlayerStatus>;
  strikerId?: string;
  nonStrikerId?: string;
  bowlerId?: string;
  isInningsBreak?: boolean;
  isMatchComplete?: boolean;
}

export interface PointDelta {
  playerId: string;
  playerName: string;
  baseDelta: number;
  multiplier: number;
  finalDelta: number;
  breakdown: Array<{
    reason: string;
    points: number;
  }>;
  isProvisional?: boolean;
}

export interface RiskFlag {
  playerId: string;
  flagType:
    | 'DUCK_RISK'
    | 'STRIKE_RATE_DRAG'
    | 'EXPENSIVE_BOWLER'
    | 'MAY_NOT_BAT'
    | 'MAY_NOT_BOWL'
    | 'MILESTONE_CLOSE'
    | 'HAUL_CLOSE'
    | 'CAPTAIN_AT_RISK'
    | 'RAIN_REDUCED_OVERS';
  severity: 'low' | 'medium' | 'high';
  messageEn: string;
  messageHi: string;
}
