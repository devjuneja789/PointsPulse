import { PROMPT_VERSION } from './prompts';
import rulesData from '../../data/rules.json';

const RULES_VERSION = rulesData.metadata.rulesVersion;

interface CacheEntry {
  text: string;
  source: 'live' | 'mock' | 'fallback' | 'template';
  modelUsed?: string;
  timestamp: number;
}

export class LLMCacheManager {
  private cache = new Map<string, CacheEntry>();
  private inFlight = new Map<string, Promise<{ text: string; source: 'live' | 'mock' | 'fallback' | 'template'; modelUsed?: string }>>();

  private dailyLimit: number;
  private minIntervalMs: number;
  private callsToday: number = 0;
  private currentUtcDate: string;
  private lastCallTimestamp: number = 0;

  constructor(dailyLimit = 40, minIntervalMs = 4000) {
    this.dailyLimit = dailyLimit;
    this.minIntervalMs = minIntervalMs;
    this.currentUtcDate = new Date().toISOString().slice(0, 10);
  }

  private checkAndResetDailyQuota(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.currentUtcDate) {
      this.currentUtcDate = today;
      this.callsToday = 0;
    }
  }

  public getCacheKey(scriptId: string, eventIndex: number, lang: string, type = 'explain'): string {
    return `${type}:${scriptId}:${eventIndex}:${lang}:${PROMPT_VERSION}:${RULES_VERSION}`;
  }

  public get(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  public set(key: string, value: CacheEntry): void {
    this.cache.set(key, value);
  }

  public hasQuota(): boolean {
    this.checkAndResetDailyQuota();
    return this.callsToday < this.dailyLimit;
  }

  public recordLiveCall(): void {
    this.checkAndResetDailyQuota();
    this.callsToday += 1;
    this.lastCallTimestamp = Date.now();
  }

  public async acquireRateLimitSlot(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallTimestamp;
    if (elapsed < this.minIntervalMs) {
      const waitTime = this.minIntervalMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  public getInFlight(key: string): Promise<{ text: string; source: 'live' | 'mock' | 'fallback' | 'template'; modelUsed?: string }> | undefined {
    return this.inFlight.get(key);
  }

  public setInFlight(
    key: string,
    promise: Promise<{ text: string; source: 'live' | 'mock' | 'fallback' | 'template'; modelUsed?: string }>
  ): void {
    this.inFlight.set(key, promise);
  }

  public clearInFlight(key: string): void {
    this.inFlight.delete(key);
  }

  public getStats() {
    this.checkAndResetDailyQuota();
    return {
      cacheSize: this.cache.size,
      dailyQuotaLimit: this.dailyLimit,
      dailyQuotaUsed: this.callsToday,
      dailyQuotaRemaining: Math.max(0, this.dailyLimit - this.callsToday),
      minIntervalMs: this.minIntervalMs,
    };
  }

  public clear(): void {
    this.cache.clear();
    this.inFlight.clear();
    this.callsToday = 0;
  }
}

export const globalCacheManager = new LLMCacheManager(
  parseInt(process.env.LLM_DAILY_LIMIT || '40', 10),
  parseInt(process.env.LLM_MIN_INTERVAL_MS || '4000', 10)
);
