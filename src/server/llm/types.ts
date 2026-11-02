export type LLMMode = 'live' | 'mock' | 'off';

export interface LLMConfig {
  mode: LLMMode;
  baseUrl: string;
  apiKey?: string;
  model: string;
  dailyLimit: number;
  minIntervalMs: number;
  appUrl?: string;
}

export interface ExplainParams {
  scriptId: string;
  eventIndex: number;
  lang: 'EN' | 'HI';
  playerName?: string;
  eventName?: string;
  deltaPoints?: number;
  multiplier?: number;
  totalPoints?: number;
}

export interface ExplainResponse {
  text: string;
  source: 'live' | 'mock' | 'fallback';
  modelUsed?: string;
}
