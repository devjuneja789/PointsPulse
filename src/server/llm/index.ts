import { LLMConfig, LLMMode, ExplainParams, ExplainResponse } from './types';
import { getMockExplanation } from './mock';

export class LLMAdapter {
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    const mode = (process.env.LLM_MODE as LLMMode) || 'mock';
    this.config = {
      mode,
      baseUrl: process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL || 'cohere/north-mini-code:free',
      dailyLimit: parseInt(process.env.LLM_DAILY_LIMIT || '40', 10),
      minIntervalMs: parseInt(process.env.LLM_MIN_INTERVAL_MS || '4000', 10),
      appUrl: process.env.APP_URL || 'http://localhost:5173',
      ...config,
    };
  }

  public getMode(): LLMMode {
    return this.config.mode;
  }

  public async explain(params: ExplainParams): Promise<ExplainResponse> {
    if (this.config.mode === 'off') {
      return {
        text: getMockExplanation(params).text,
        source: 'fallback',
      };
    }

    if (this.config.mode === 'mock' || !this.config.apiKey) {
      return getMockExplanation(params);
    }

    // Live mode (implemented in Phase 4)
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
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
            {
              role: 'system',
              content:
                'You are PointsPulse, explaining cricket fantasy points concisely (under 35 words). Use only numbers in the prompt.',
            },
            {
              role: 'user',
              content: `Player: ${params.playerName}, Event: ${params.eventName}, Delta: ${params.deltaPoints}, Multiplier: ${params.multiplier}x, Lang: ${params.lang}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 120,
        }),
      });

      if (!response.ok) {
        return getMockExplanation(params);
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        return getMockExplanation(params);
      }

      return {
        text,
        source: 'live',
        modelUsed: this.config.model,
      };
    } catch {
      return getMockExplanation(params);
    }
  }
}

export const defaultLLMAdapter = new LLMAdapter();
