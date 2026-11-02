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
  team: 'MI' | 'CSK';
  role: PlayerRole;
  battingOrder: number;
  bowlingQuota: number;
  credits: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isBenched?: boolean;
  isImpactSub?: boolean;
}

export interface MatchScoreboard {
  innings: number;
  teamBatting: string;
  teamBowling: string;
  runs: number;
  wickets: number;
  overs: number;
  legalBallsInOver: number;
  target?: number;
  isRainInterrupted?: boolean;
  maxOvers: number;
}

export interface PlayerMatchStats {
  playerId: string;
  // Batting
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: string;
  dismissalNote?: string;
  // Bowling
  ballsBowled: number;
  oversBowled: number;
  currentOverRuns: number;
  currentOverLegalBalls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  bowledLbwCount: number;
  dots: number;
  // Fielding
  catches: number;
  stumpings: number;
  runOutsDirect: number;
  runOutsIndirect: number;
  // Status flags
  hasBatted: boolean;
  hasBowled: boolean;
  isInMatchXI: boolean;
  isImpactSubIntroduced?: boolean;
}

export interface ScoringLineItem {
  category: 'participation' | 'batting' | 'bowling' | 'fielding' | 'multiplier';
  label: string;
  points: number;
  isProvisional?: boolean;
}

export interface PlayerFantasyScore {
  playerId: string;
  playerName: string;
  role: PlayerRole;
  isCaptain: boolean;
  isViceCaptain: boolean;
  multiplier: number;
  basePoints: number;
  totalPoints: number;
  items: ScoringLineItem[];
}

export interface MatchState {
  scoreboard: MatchScoreboard;
  playerStats: Record<string, PlayerMatchStats>;
  playerStatuses: Record<string, PlayerStatus>;
  strikerId?: string;
  nonStrikerId?: string;
  currentBowlerId?: string;
  lastEventId?: string;
  isInningsBreak?: boolean;
  isMatchComplete?: boolean;
}

export interface PointDelta {
  playerId: string;
  playerName: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  multiplier: number;
  baseDelta: number;
  finalDelta: number;
  items: ScoringLineItem[];
  cause: string;
  isProvisional?: boolean;
}

export interface TeamDelta {
  eventId: string;
  myTotalBefore: number;
  myTotalAfter: number;
  totalDelta: number;
  changedPlayers: PointDelta[];
  provisionalChanges: PointDelta[];
  noChange: boolean;
}

export interface RiskFlag {
  playerId: string;
  playerName: string;
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

export interface MatchEvent {
  id: string;
  innings: number;
  over: number;
  ball: number;
  batter: string;
  nonStriker?: string;
  bowler: string;
  runs: number;
  extras: number;
  isSuperOver?: boolean;
  wicket?: {
    type: string;
    playerOut: string;
    fielders?: string[];
  } | null;
  fielders?: string[];
  scenario?: string;
  note: string;
}

export interface MatchInfo {
  venue: string;
  format: 'T20';
  battingFirst: string;
  bowlingFirst: string;
  playingXI: {
    MI: string[];
    CSK: string[];
  };
  benchedPlayers: string[];
  impactSubs?: {
    MI?: { in: string; out: string };
    CSK?: { in: string; out: string };
  };
}

export interface UserTeamConfig {
  teamId: string;
  teamName: string;
  captain: string;
  viceCaptain: string;
  players: string[];
  composition?: {
    MI: number;
    CSK: number;
    roles: Record<string, number>;
  };
  metadata?: {
    benchedPlayer?: string;
    captainRole?: string;
    viceCaptainRole?: string;
  };
}
