import { describe, it, expect } from 'vitest';
import { LLMAdapter } from '../../src/server/llm';
import { getMockExplanation } from '../../src/server/llm/mock';

describe('LLM Adapter (Phase 0)', () => {
  it('initializes with default mock mode', () => {
    const adapter = new LLMAdapter({ mode: 'mock' });
    expect(adapter.getMode()).toBe('mock');
  });

  it('generates deterministic English mock explanation', async () => {
    const adapter = new LLMAdapter({ mode: 'mock' });
    const result = await adapter.explain({
      scriptId: 'match-1',
      eventIndex: 12,
      lang: 'EN',
      playerName: 'Jasprit Bumrah',
      eventName: 'wicket',
      deltaPoints: 66,
      multiplier: 2,
    });

    expect(result.source).toBe('mock');
    expect(result.text).toContain('Jasprit Bumrah');
    expect(result.text).toContain('+66 pts');
    expect(result.text).toContain('2x Captain');
  });

  it('generates deterministic Hinglish mock explanation', async () => {
    const adapter = new LLMAdapter({ mode: 'mock' });
    const result = await adapter.explain({
      scriptId: 'match-1',
      eventIndex: 12,
      lang: 'HI',
      playerName: 'Jasprit Bumrah',
      eventName: 'bowled',
      deltaPoints: 66,
      multiplier: 2,
    });

    expect(result.source).toBe('mock');
    expect(result.text).toContain('Jasprit Bumrah');
    expect(result.text).toContain('+66 pts');
    expect(result.text).toContain('Captain 2x');
  });

  it('handles fallback copy in off mode', async () => {
    const adapter = new LLMAdapter({ mode: 'off' });
    const result = await adapter.explain({
      scriptId: 'match-1',
      eventIndex: 12,
      lang: 'EN',
    });

    expect(result.source).toBe('fallback');
    expect(result.text).toBeTruthy();
  });
});

describe('Mock Generator direct functions', () => {
  it('correctly handles multiplier > 1', () => {
    const exp = getMockExplanation({
      scriptId: 'test',
      eventIndex: 1,
      lang: 'EN',
      multiplier: 2,
    });
    expect(exp.text).toContain('Captain');
  });

  it('correctly handles multiplier 1', () => {
    const exp = getMockExplanation({
      scriptId: 'test',
      eventIndex: 1,
      lang: 'EN',
      multiplier: 1,
    });
    expect(exp.text).not.toContain('Captain');
  });
});
