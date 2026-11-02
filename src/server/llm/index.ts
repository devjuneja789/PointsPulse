import { MatchEvent, TeamDelta } from '../../engine/types';
import { getExplanationForEvent, validateExplanationText } from '../../engine/explain';
import { globalCacheManager } from './cache';
import { getMockExplanation } from './mock';
import {
  EXPLAIN_SYSTEM_PROMPT_EN,
  EXPLAIN_SYSTEM_PROMPT_HI,
  EXPLAIN_FEW_SHOTS_EN,
  EXPLAIN_FEW_SHOTS_HI,
  ASK_SYSTEM_PROMPT,
  RECAP_SYSTEM_PROMPT,
} from './prompts';
import { LLMConfig, LLMMode, ExplainParams } from './types';

export interface ExplainRequestParams {
  scriptId: string;
  eventIndex: number;
  lang: 'EN' | 'HI';
  delta?: TeamDelta;
  event?: MatchEvent;
  playerName?: string;
  eventName?: string;
  deltaPoints?: number;
  multiplier?: number;
  totalPoints?: number;
}

export interface ExplainResult {
  text: string;
  source: 'live' | 'mock' | 'fallback' | 'template';
  modelUsed?: string;
}

export interface AskRequestParams {
  scriptId: string;
  eventIndex: number;
  lang: 'EN' | 'HI';
  question: string;
  snapshot: {
    scoreboard: {
      teamBatting: string;
      teamBowling: string;
      runs: number;
      wickets: number;
      overs: number;
      isRainInterrupted?: boolean;
    };
    userTeamTotal: number;
    userPlayers: Array<{
      name: string;
      role: string;
      status: string;
      totalPoints: number;
      isCaptain?: boolean;
      isViceCaptain?: boolean;
    }>;
    riskFlags: Array<{
      playerName: string;
      flagType: string;
      message: string;
    }>;
  };
}

export interface AskResult {
  answer: string;
  source: 'live' | 'mock' | 'fallback';
  modelUsed?: string;
}

export class LiveLLMAdapter {
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      mode: (process.env.LLM_MODE as LLMMode) || 'mock',
      baseUrl: process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL || 'cohere/north-mini-code:free',
      dailyLimit: parseInt(process.env.LLM_DAILY_LIMIT || '40', 10),
      minIntervalMs: parseInt(process.env.LLM_MIN_INTERVAL_MS || '4000', 10),
      appUrl: process.env.APP_URL || 'https://pointspulse.onrender.com',
      ...config,
    };
  }

  public getMode(): LLMMode {
    return this.config.mode;
  }

  public async explain(params: ExplainRequestParams): Promise<ExplainResult> {
    const { scriptId, eventIndex, lang, delta, event } = params;

    // Backward compatibility for Phase 0 tests without delta/event
    if (!delta || !event) {
      if (this.config.mode === 'off') {
        const mockRes = getMockExplanation(params as unknown as ExplainParams);
        return {
          text: mockRes.text,
          source: 'fallback',
        };
      }
      const mockRes = getMockExplanation(params as unknown as ExplainParams);
      return {
        text: mockRes.text,
        source: 'mock',
        modelUsed: 'mock-engine',
      };
    }

    // Fast path: if no change to team, return immediate template
    if (delta.noChange || delta.changedPlayers.length === 0) {
      return {
        text:
          lang === 'EN'
            ? 'No change to your fantasy team points on this ball.'
            : 'Is ball par aapki fantasy team ke points me koi badlav nahi hua.',
        source: 'template',
      };
    }

    // 1. Check in-memory cache
    const cacheKey = globalCacheManager.getCacheKey(scriptId, eventIndex, lang, 'explain');
    const cached = globalCacheManager.get(cacheKey);
    if (cached) {
      return {
        text: cached.text,
        source: cached.source,
        modelUsed: cached.modelUsed,
      };
    }

    // 2. Check for deduplication of in-flight requests
    const inFlight = globalCacheManager.getInFlight(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    // 3. Fallback resolution helper
    const getFallback = (): ExplainResult => {
      const fb = getExplanationForEvent(scriptId, event.id, delta, lang);
      return {
        text: fb.text,
        source: 'fallback',
      };
    };

    // 4. Handle OFF or MOCK modes
    if (this.config.mode === 'off') {
      return getFallback();
    }

    if (this.config.mode === 'mock' || !this.config.apiKey) {
      // Return pre-authored hand-written copy as deterministic mock
      const fb = getExplanationForEvent(scriptId, event.id, delta, lang);
      const res: ExplainResult = {
        text: fb.text,
        source: 'mock',
        modelUsed: 'mock-engine',
      };
      globalCacheManager.set(cacheKey, { ...res, timestamp: Date.now() });
      return res;
    }

    // 5. Check daily quota limit
    if (!globalCacheManager.hasQuota()) {
      console.warn('[LLM] Daily quota limit reached, returning fallback copy.');
      return getFallback();
    }

    // 6. Execute live call with deduplication and retry once on validation failure
    const executeCall = async (): Promise<ExplainResult> => {
      try {
        await globalCacheManager.acquireRateLimitSlot();

        const systemPrompt = lang === 'HI' ? EXPLAIN_SYSTEM_PROMPT_HI : EXPLAIN_SYSTEM_PROMPT_EN;
        const fewShots = lang === 'HI' ? EXPLAIN_FEW_SHOTS_HI : EXPLAIN_FEW_SHOTS_EN;

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemPrompt },
        ];

        for (const shot of fewShots) {
          messages.push({ role: 'user', content: JSON.stringify(shot.input) });
          messages.push({ role: 'assistant', content: shot.output });
        }

        const primary = delta.changedPlayers[0];
        const userPayload = {
          player: primary.playerName,
          isCaptain: primary.isCaptain,
          isViceCaptain: primary.isViceCaptain,
          multiplier: primary.multiplier,
          event: primary.cause,
          items: primary.items.map((i) => `${i.points >= 0 ? '+' : ''}${i.points} ${i.label}`).join(', '),
          finalDelta: delta.totalDelta,
          myTotalAfter: delta.myTotalAfter,
        };

        messages.push({ role: 'user', content: JSON.stringify(userPayload) });

        let rawOutput: string | null = null;
        let attempts = 0;

        while (attempts < 2 && !rawOutput) {
          attempts++;
          globalCacheManager.recordLiveCall();

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          try {
            const resp = await fetch(`${this.config.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.apiKey}`,
                'HTTP-Referer': this.config.appUrl || 'https://pointspulse.onrender.com',
                'X-Title': 'PointsPulse',
              },
              body: JSON.stringify({
                model: this.config.model,
                messages,
                temperature: 0.3,
                max_tokens: 120,
              }),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (resp.ok) {
              const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
              const candidate = data.choices?.[0]?.message?.content?.trim();
              if (candidate) {
                const validation = validateExplanationText(candidate, delta, lang);
                if (validation.isValid) {
                  rawOutput = candidate;
                } else {
                  console.warn(`[LLM] Validation failed (attempt ${attempts}): ${validation.reason}`);
                }
              }
            } else {
              console.warn(`[LLM] OpenRouter responded with status: ${resp.status}`);
            }
          } catch (err: unknown) {
            clearTimeout(timeoutId);
            console.warn(`[LLM] Call error (attempt ${attempts}):`, err instanceof Error ? err.message : String(err));
          }
        }

        if (rawOutput) {
          const successResult: ExplainResult = {
            text: rawOutput,
            source: 'live',
            modelUsed: this.config.model,
          };
          globalCacheManager.set(cacheKey, { ...successResult, timestamp: Date.now() });
          return successResult;
        }

        // Both attempts failed or invalid -> fallback
        return getFallback();
      } finally {
        globalCacheManager.clearInFlight(cacheKey);
      }
    };

    const callPromise = executeCall();
    globalCacheManager.setInFlight(cacheKey, callPromise);
    return callPromise;
  }

  public async ask(params: AskRequestParams): Promise<AskResult> {
    const { lang, question, snapshot } = params;

    const isRecap = question === '__RECAP__' || question.toLowerCase().includes('catch me up');

    // 1. Offline / Mock resolution
    if (this.config.mode === 'off' || this.config.mode === 'mock' || !this.config.apiKey) {
      if (isRecap) {
        return {
          answer:
            lang === 'EN'
              ? `Scoreboard stands at ${snapshot.scoreboard.teamBatting} ${snapshot.scoreboard.runs}/${snapshot.scoreboard.wickets} (${snapshot.scoreboard.overs} ov). Your team has ${snapshot.userTeamTotal} points with Captain Jasprit Bumrah leading scoring.`
              : `Scoreboard par ${snapshot.scoreboard.teamBatting} ${snapshot.scoreboard.runs}/${snapshot.scoreboard.wickets} (${snapshot.scoreboard.overs} ov) hai. Aapki team ke total ${snapshot.userTeamTotal} points hain aur Captain Bumrah top par hain.`,
          source: 'mock',
          modelUsed: 'mock-engine',
        };
      }

      // Contextual answers for common questions
      const qLower = question.toLowerCase();
      if (qLower.includes('risk')) {
        const riskNames = snapshot.riskFlags.map((rf) => rf.playerName).join(', ');
        return {
          answer:
            lang === 'EN'
              ? snapshot.riskFlags.length > 0
                ? `Currently ${snapshot.riskFlags.length} risk alert(s): ${snapshot.riskFlags.map((r) => r.message).join(' ')}`
                : 'No players are currently at critical risk in your 11.'
              : snapshot.riskFlags.length > 0
              ? `Abhi ${snapshot.riskFlags.length} risk alert(s) hain: ${riskNames} par dhyan dein.`
              : 'Filhal aapki team ka koi khiladi bade risk par nahi hai.',
          source: 'mock',
          modelUsed: 'mock-engine',
        };
      }

      if (qLower.includes('captain') || qLower.includes('bumrah')) {
        const capt = snapshot.userPlayers.find((p) => p.isCaptain);
        return {
          answer:
            lang === 'EN'
              ? `Your Captain is ${capt?.name || 'Jasprit Bumrah'} with ${capt?.totalPoints || 0} pts (2x multiplier active). Status: ${capt?.status}.`
              : `Aapke Captain ${capt?.name || 'Jasprit Bumrah'} hain jinke ${capt?.totalPoints || 0} points hain (2x multiplier). Status: ${capt?.status}.`,
          source: 'mock',
          modelUsed: 'mock-engine',
        };
      }

      return {
        answer:
          lang === 'EN'
            ? `Your team has ${snapshot.userTeamTotal} points. ${snapshot.userPlayers.filter((p) => p.status === 'BATTING').length} player(s) batting, ${snapshot.userPlayers.filter((p) => p.status === 'BOWLING').length} bowling.`
            : `Aapki team ke ${snapshot.userTeamTotal} points hain. ${snapshot.userPlayers.filter((p) => p.status === 'BATTING').length} batting kar rahe hain aur ${snapshot.userPlayers.filter((p) => p.status === 'BOWLING').length} bowling par hain.`,
        source: 'mock',
        modelUsed: 'mock-engine',
      };
    }

    // 2. Check quota
    if (!globalCacheManager.hasQuota()) {
      return {
        answer:
          lang === 'EN'
            ? `Your team has ${snapshot.userTeamTotal} points across ${snapshot.userPlayers.length} players.`
            : `Aapki team ke kul ${snapshot.userTeamTotal} points hain.`,
        source: 'fallback',
      };
    }

    // 3. Live call
    try {
      await globalCacheManager.acquireRateLimitSlot();
      globalCacheManager.recordLiveCall();

      const systemPrompt = isRecap ? RECAP_SYSTEM_PROMPT : ASK_SYSTEM_PROMPT;
      const contextPrompt = `Context Snapshot:
Scoreboard: ${snapshot.scoreboard.teamBatting} ${snapshot.scoreboard.runs}/${snapshot.scoreboard.wickets} in ${snapshot.scoreboard.overs} ov (Rain: ${snapshot.scoreboard.isRainInterrupted ? 'Yes' : 'No'})
User Team Total: ${snapshot.userTeamTotal}
Players in User Team:
${snapshot.userPlayers.map((p) => `- ${p.name} (${p.role}${p.isCaptain ? ', C 2x' : ''}${p.isViceCaptain ? ', VC 1.5x' : ''}): ${p.status}, ${p.totalPoints} pts`).join('\n')}
Active Risk Flags:
${snapshot.riskFlags.map((r) => `- ${r.playerName}: ${r.message}`).join('\n') || 'None'}

User Question: ${isRecap ? 'Catch me up on the match in 2 sentences.' : question}
Language: ${lang === 'HI' ? 'Hinglish (Latin script only)' : 'English'}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': this.config.appUrl || 'https://pointspulse.onrender.com',
          'X-Title': 'PointsPulse',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextPrompt },
          ],
          temperature: 0.3,
          max_tokens: 120,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const answer = data.choices?.[0]?.message?.content?.trim();
        if (answer) {
          return {
            answer,
            source: 'live',
            modelUsed: this.config.model,
          };
        }
      }
    } catch (err: unknown) {
      console.warn('[LLM Ask] Live call error:', err instanceof Error ? err.message : String(err));
    }

    return {
      answer:
        lang === 'EN'
          ? `Your fantasy team currently has ${snapshot.userTeamTotal} points. Captain Jasprit Bumrah leads your squad.`
          : `Aapki team ke abhi ${snapshot.userTeamTotal} points hain. Captain Jasprit Bumrah lead kar rahe hain.`,
      source: 'fallback',
    };
  }
}

export const liveLLMAdapter = new LiveLLMAdapter();
// Re-export for compatibility with earlier imports
export { liveLLMAdapter as defaultLLMAdapter };
export { LiveLLMAdapter as LLMAdapter };
