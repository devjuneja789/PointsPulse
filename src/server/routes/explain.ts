import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { liveLLMAdapter } from '../llm';
import {
  createInitialMatchState,
  reduceMatchState,
  calculatePlayerFantasyScore,
  calculateTeamDelta,
  MatchEvent,
  MatchInfo,
  Player,
  UserTeamConfig,
  PlayerFantasyScore,
} from '../../engine';

import fullMatchJson from '../../data/scripts/full-match.json';
import powerplayJson from '../../data/scripts/powerplay-blitz.json';
import collapseJson from '../../data/scripts/late-collapse.json';
import miSquadJson from '../../data/squads/mi.json';
import cskSquadJson from '../../data/squads/csk.json';
import myTeamJson from '../../data/myTeam.json';
import rulesJson from '../../data/rules.json';

const router = Router();

const allPlayers: Player[] = [
  ...(miSquadJson.players as Player[]),
  ...(cskSquadJson.players as Player[]),
];

const scriptMap: Record<string, { matchInfo: MatchInfo; events: MatchEvent[] }> = {
  'full-match': fullMatchJson as unknown as { matchInfo: MatchInfo; events: MatchEvent[] },
  'powerplay-blitz': powerplayJson as unknown as { matchInfo: MatchInfo; events: MatchEvent[] },
  'late-collapse': collapseJson as unknown as { matchInfo: MatchInfo; events: MatchEvent[] },
};

const userTeam: UserTeamConfig = myTeamJson as UserTeamConfig;

const ExplainSchema = z.object({
  scriptId: z.string(),
  eventIndex: z.number().int().min(0),
  lang: z.enum(['EN', 'HI']),
});

router.post('/explain', async (req: Request, res: Response) => {
  try {
    const parseResult = ExplainSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid request body', details: parseResult.error.format() });
      return;
    }

    const { scriptId, eventIndex, lang } = parseResult.data;
    const script = scriptMap[scriptId] || scriptMap['full-match'];
    const events = script.events;

    if (eventIndex >= events.length) {
      res.status(400).json({ error: 'eventIndex out of range' });
      return;
    }

    // Re-derive ground truth state and delta on server
    let state = createInitialMatchState(script.matchInfo, allPlayers);
    const scores: Record<string, PlayerFantasyScore> = {};

    for (const p of allPlayers) {
      scores[p.id] = calculatePlayerFantasyScore(
        state.playerStats[p.id],
        p.role,
        p.name,
        p.id === userTeam.captain,
        p.id === userTeam.viceCaptain,
        state.playerStatuses[p.id],
        rulesJson
      );
    }

    let targetDelta = null;
    const targetEvent = events[eventIndex];

    for (let i = 0; i <= eventIndex; i++) {
      const ev = events[i];
      state = reduceMatchState(state, ev, script.matchInfo);

      const prevScores = { ...scores };
      for (const p of allPlayers) {
        scores[p.id] = calculatePlayerFantasyScore(
          state.playerStats[p.id],
          p.role,
          p.name,
          p.id === userTeam.captain,
          p.id === userTeam.viceCaptain,
          state.playerStatuses[p.id],
          rulesJson
        );
      }

      if (i === eventIndex) {
        targetDelta = calculateTeamDelta(prevScores, scores, userTeam.players, ev);
      }
    }

    if (!targetDelta) {
      res.status(500).json({ error: 'Failed to derive delta' });
      return;
    }

    const result = await liveLLMAdapter.explain({
      scriptId,
      eventIndex,
      lang,
      delta: targetDelta,
      event: targetEvent,
    });

    res.json(result);
  } catch (err: unknown) {
    console.error('[Explain Route Error]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
