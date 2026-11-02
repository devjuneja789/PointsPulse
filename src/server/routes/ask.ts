import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { liveLLMAdapter } from '../llm';
import {
  createInitialMatchState,
  reduceMatchState,
  calculatePlayerFantasyScore,
  evaluateRiskFlags,
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

const AskSchema = z.object({
  scriptId: z.string(),
  eventIndex: z.number().int().min(-1),
  lang: z.enum(['EN', 'HI']),
  question: z.string().min(1).max(200),
});

router.post('/ask', async (req: Request, res: Response) => {
  try {
    const parseResult = AskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid request body', details: parseResult.error.format() });
      return;
    }

    const { scriptId, eventIndex, lang, question } = parseResult.data;
    const script = scriptMap[scriptId] || scriptMap['full-match'];
    const events = script.events;

    // Replay on server to construct grounded snapshot
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

    for (let i = 0; i <= eventIndex && i < events.length; i++) {
      const ev = events[i];
      state = reduceMatchState(state, ev, script.matchInfo);

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
    }

    const userTeamTotal = userTeam.players.reduce(
      (sum, pId) => sum + (scores[pId] ? scores[pId].totalPoints : 0),
      0
    );

    const riskFlags = evaluateRiskFlags(state, allPlayers, userTeam);

    const snapshot = {
      scoreboard: {
        teamBatting: state.scoreboard.teamBatting,
        teamBowling: state.scoreboard.teamBowling,
        runs: state.scoreboard.runs,
        wickets: state.scoreboard.wickets,
        overs: state.scoreboard.overs,
        isRainInterrupted: state.scoreboard.isRainInterrupted,
      },
      userTeamTotal,
      userPlayers: userTeam.players.map((pId) => {
        const sc = scores[pId];
        return {
          name: sc?.playerName || pId,
          role: sc?.role || 'BAT',
          status: state.playerStatuses[pId] || 'FIELDING',
          totalPoints: sc?.totalPoints || 0,
          isCaptain: pId === userTeam.captain,
          isViceCaptain: pId === userTeam.viceCaptain,
        };
      }),
      riskFlags: riskFlags.map((rf) => ({
        playerName: rf.playerName,
        flagType: rf.flagType,
        message: lang === 'HI' ? rf.messageHi : rf.messageEn,
      })),
    };

    const result = await liveLLMAdapter.ask({
      scriptId,
      eventIndex,
      lang,
      question,
      snapshot,
    });

    res.json(result);
  } catch (err: unknown) {
    console.error('[Ask Route Error]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
