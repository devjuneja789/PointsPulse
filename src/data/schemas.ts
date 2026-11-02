import { z } from 'zod';

export const RulesSchema = z.object({
  metadata: z.object({
    format: z.literal('T20'),
    rulesVersion: z.string(),
    source: z.string(),
    verifiedOn: z.string(),
    notes: z.string().optional(),
  }),
  startingXI: z.number().positive(),
  substitute: z.number().positive(),
  batting: z.object({
    run: z.number(),
    boundaryFourBonus: z.number(),
    sixBonus: z.number(),
    milestones: z.record(z.string(), z.number()),
    duck: z.number().negative(),
    duckAppliesTo: z.array(z.enum(['BAT', 'WK', 'AR', 'BOWL'])),
  }),
  bowling: z.object({
    wicket: z.number().positive(),
    bowledLbwBonus: z.number().positive(),
    wicketHauls: z.record(z.string(), z.number()),
    maidenOver: z.number().positive(),
    dotBall: z.number().nonnegative(),
  }),
  fielding: z.object({
    catch: z.number().positive(),
    threeCatchBonus: z.number().positive(),
    stumping: z.number().positive(),
    runOutDirect: z.number().positive(),
    runOutIndirect: z.number().positive(),
  }),
  economy: z.object({
    minOvers: z.number().positive(),
    bands: z.array(
      z.object({
        min: z.number().nonnegative(),
        max: z.number().positive(),
        points: z.number(),
      })
    ),
  }),
  strikeRate: z.object({
    minBalls: z.number().positive(),
    appliesToNonBowlersOnly: z.boolean(),
    bands: z.array(
      z.object({
        min: z.number().nonnegative(),
        max: z.number().positive(),
        points: z.number(),
      })
    ),
  }),
  multipliers: z.object({
    captain: z.number().positive(),
    viceCaptain: z.number().positive(),
  }),
});

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.enum(['MI', 'CSK']),
  role: z.enum(['BAT', 'BOWL', 'AR', 'WK']),
  battingOrder: z.number().int().positive(),
  bowlingQuota: z.number().int().nonnegative(),
  credits: z.number().positive(),
  isImpactSub: z.boolean().optional(),
  isBenched: z.boolean().optional(),
});

export const SquadSchema = z.object({
  teamId: z.enum(['MI', 'CSK']),
  teamName: z.string(),
  season: z.string(),
  source: z.string(),
  retrievedOn: z.string(),
  creditsDisclaimer: z.string(),
  players: z.array(PlayerSchema).min(11),
});

export const MyTeamSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  captain: z.string(),
  viceCaptain: z.string(),
  players: z.array(z.string()).length(11),
  composition: z.object({
    MI: z.number().min(1).max(7),
    CSK: z.number().min(1).max(7),
    roles: z.object({
      WK: z.number().min(1),
      BAT: z.number().min(3),
      AR: z.number().min(1),
      BOWL: z.number().min(3),
    }),
  }),
  metadata: z.object({
    captainRole: z.enum(['BAT', 'BOWL', 'AR', 'WK']),
    viceCaptainRole: z.enum(['BAT', 'BOWL', 'AR', 'WK']),
    benchedPlayer: z.string(),
    rulesVerification: z.string(),
  }),
});

export const MatchEventSchema = z.object({
  id: z.string(),
  innings: z.number().int().min(1).max(2),
  over: z.number().nonnegative(),
  ball: z.number().int().positive(),
  batter: z.string(),
  nonStriker: z.string().optional(),
  bowler: z.string(),
  runs: z.number().int().nonnegative(),
  extras: z.number().int().nonnegative(),
  wicket: z
    .object({
      type: z.string(),
      playerOut: z.string(),
      fielders: z.array(z.string()).optional(),
    })
    .nullable(),
  fielders: z.array(z.string()).optional(),
  scenario: z.string().optional(),
  note: z.string(),
});

export const MatchScriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  matchInfo: z.object({
    venue: z.string(),
    format: z.literal('T20'),
    battingFirst: z.enum(['MI', 'CSK']),
    bowlingFirst: z.enum(['MI', 'CSK']),
    playingXI: z.object({
      MI: z.array(z.string()).length(11),
      CSK: z.array(z.string()).length(11),
    }),
    benchedPlayers: z.array(z.string()),
    impactSubs: z
      .object({
        MI: z.object({ in: z.string(), out: z.string() }).optional(),
        CSK: z.object({ in: z.string(), out: z.string() }).optional(),
      })
      .optional(),
  }),
  events: z.array(MatchEventSchema).min(5),
});

export const FallbackSchema = z.object({
  scriptId: z.string(),
  explanations: z.record(
    z.string(),
    z.object({
      EN: z.string().min(5),
      HI: z.string().min(5),
    })
  ),
});

export const GoldenAnchorBreakdownSchema = z.object({
  item: z.string(),
  points: z.number(),
});

export const GoldenAnchorEntrySchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  role: z.enum(['BAT', 'BOWL', 'AR', 'WK']),
  isCaptain: z.boolean(),
  isViceCaptain: z.boolean(),
  multiplier: z.number().positive(),
  breakdown: z.array(GoldenAnchorBreakdownSchema),
  expectedBase: z.number(),
  expectedTotal: z.number(),
});

export const GoldenAnchorsSchema = z.object({
  metadata: z.object({
    source: z.string(),
    scriptId: z.string(),
    rulesVersion: z.string(),
    verifiedOn: z.string(),
  }),
  anchors: z.object({
    batter: GoldenAnchorEntrySchema,
    bowler: GoldenAnchorEntrySchema,
    fielder: GoldenAnchorEntrySchema,
    captain: GoldenAnchorEntrySchema,
    viceCaptain: GoldenAnchorEntrySchema,
  }),
});

export const CoverageMatrixSchema = z.object({
  scenarios: z.array(
    z.object({
      id: z.number().int().min(1).max(14),
      name: z.string(),
      script: z.string(),
      eventId: z.string(),
      description: z.string(),
      expectedDelta: z.number(),
    })
  ).length(14),
});
