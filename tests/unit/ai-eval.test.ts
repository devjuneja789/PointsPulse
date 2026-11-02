import { describe, it, expect, beforeEach } from 'vitest';
import { validateExplanationText } from '../../src/engine/explain';
import { LLMCacheManager } from '../../src/server/llm/cache';
import { LiveLLMAdapter } from '../../src/server/llm';
import { TeamDelta, MatchEvent } from '../../src/engine/types';

describe('Phase 4: 20-Case AI Safety, Grounding & Eval Suite', () => {
  const baseDelta: TeamDelta = {
    eventId: 'fm_20',
    myTotalBefore: 346.5,
    myTotalAfter: 412.5,
    totalDelta: 66,
    changedPlayers: [
      {
        playerId: 'mi_bumrah',
        playerName: 'Jasprit Bumrah',
        isCaptain: true,
        isViceCaptain: false,
        multiplier: 2,
        baseDelta: 33,
        finalDelta: 66,
        items: [
          { category: 'bowling', label: 'Wickets', points: 25 },
          { category: 'bowling', label: 'Bowled Bonus', points: 8 },
        ],
        cause: 'bowled Ruturaj Gaikwad',
      },
    ],
    provisionalChanges: [],
    noChange: false,
  };

  const dummyEvent: MatchEvent = {
    id: 'fm_20',
    innings: 2,
    over: 0.2,
    ball: 2,
    batter: 'csk_ruturaj',
    bowler: 'mi_bumrah',
    runs: 0,
    extras: 0,
    wicket: { type: 'bowled', playerOut: 'csk_ruturaj' },
    note: 'Bumrah bowls Ruturaj',
  };

  let testCache: LLMCacheManager;

  beforeEach(() => {
    testCache = new LLMCacheManager(5, 50); // limit 5, 50ms interval for tests
  });

  // 1. Number Grounding: Accept valid numbers from payload
  it('Case 1: accepts text with numbers strictly present in payload', () => {
    const text = 'Jasprit Bumrah took a wicket (+25) and bowled bonus (+8) for +66 total points with 2x multiplier.';
    const res = validateExplanationText(text, baseDelta, 'EN');
    expect(res.isValid).toBe(true);
  });

  // 2. Number Grounding: Reject invented points
  it('Case 2: rejects text containing invented numbers not in payload', () => {
    const text = 'Jasprit Bumrah earned 99 points for your fantasy team today.';
    const res = validateExplanationText(text, baseDelta, 'EN');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('Invented or unverified number');
  });

  // 3. Number Grounding: Reject fabricated total
  it('Case 3: rejects text containing fabricated new total score', () => {
    const text = 'Bumrah bowled the batter. Your score is now 850 points.';
    const res = validateExplanationText(text, baseDelta, 'EN');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('Invented or unverified number');
  });

  // 4. Number Grounding: Reject unauthorized multiplier numbers
  it('Case 4: rejects text containing unauthorized multipliers (e.g. 5x)', () => {
    const text = 'Jasprit Bumrah gave 5x points for your fantasy squad.';
    const res = validateExplanationText(text, baseDelta, 'EN');
    expect(res.isValid).toBe(false);
  });

  // 5. Number Grounding: Accepts allowed structural numbers (11, 2x, 1.5x, 0)
  it('Case 5: accepts allowed structural numbers like 11, 2, 1.5', () => {
    const text = 'Bumrah bowled the batter (+66 pts). He is 1 of 11 players in your team with 2x multiplier.';
    const res = validateExplanationText(text, baseDelta, 'EN');
    expect(res.isValid).toBe(true);
  });

  // 6. Length Safety: Reject > 35 words
  it('Case 6: rejects explanations exceeding 35 words', () => {
    const longText =
      'Jasprit Bumrah delivered a fantastic unplayable inswinging yorker that completely crashed into the off stump of Ruturaj Gaikwad resulting in an incredible haul of sixty-six fantasy points for your lucky squad tonight in Mumbai at the packed Wankhede stadium celebration.';
    const res = validateExplanationText(longText, baseDelta, 'EN');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('exceeds 35 words');
  });

  // 7. Length Safety: Accepts concise explanation ≤ 35 words
  it('Case 7: accepts concise explanation with exactly 15 words', () => {
    const text = 'Jasprit Bumrah bowled Ruturaj Gaikwad: +25 wicket, +8 bowled bonus. Captain multiplier gives +66 pts.';
    const res = validateExplanationText(text, baseDelta, 'EN');
    expect(res.isValid).toBe(true);
  });

  // 8. Hinglish Script: Rejects Devanagari Unicode
  it('Case 8: rejects Hinglish containing Devanagari script', () => {
    const devanagariText = 'Jasprit Bumrah ne विकेट liya aur bowled kiya (+66 pts).';
    const res = validateExplanationText(devanagariText, baseDelta, 'HI');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('Devanagari script detected');
  });

  // 9. Hinglish Script: Accepts valid Latin-script Hinglish
  it('Case 9: accepts clean Latin-script Hinglish', () => {
    const hinglishText = 'Jasprit Bumrah ne Ruturaj Gaikwad ko bowled out kiya (+25 wicket, +8 bowled). Captain 2x multiplier lagakar +66 pts jude.';
    const res = validateExplanationText(hinglishText, baseDelta, 'HI');
    expect(res.isValid).toBe(true);
  });

  // 10. Policy Safety: Rejects betting and gambling terms
  it('Case 10: rejects text containing betting or gambling terms', () => {
    const bettingText = 'Jasprit Bumrah got +66 pts. Place your bet now for guaranteed cash!';
    const res = validateExplanationText(bettingText, baseDelta, 'EN');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('Banned word detected');
  });

  // 11. Policy Safety: Rejects outcome predictions
  it('Case 11: rejects text with guaranteed win or jackpot claims', () => {
    const winText = 'Jasprit Bumrah earned +66 points. You will win the grand jackpot!';
    const res = validateExplanationText(winText, baseDelta, 'EN');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('Banned word detected');
  });

  // 12. Fallback Mechanics: Fallback copy triggered in OFF mode
  it('Case 12: returns pre-authored fallback copy in off mode', async () => {
    const adapter = new LiveLLMAdapter({ mode: 'off' });
    const res = await adapter.explain({
      scriptId: 'full-match',
      eventIndex: 19,
      lang: 'EN',
      delta: baseDelta,
      event: dummyEvent,
    });

    expect(res.source).toBe('fallback');
    expect(res.text).toContain('Jasprit Bumrah');
    expect(res.text).toContain('+66');
  });

  // 13. Fallback Mechanics: Deterministic mock mode returns verified text
  it('Case 13: returns deterministic mock copy in mock mode', async () => {
    const adapter = new LiveLLMAdapter({ mode: 'mock' });
    const res = await adapter.explain({
      scriptId: 'full-match',
      eventIndex: 19,
      lang: 'HI',
      delta: baseDelta,
      event: dummyEvent,
    });

    expect(res.source).toBe('mock');
    expect(res.text).toContain('Jasprit Bumrah');
    expect(res.text).toContain('+66');
  });

  // 14. Quota Enforcement: Exceeding daily quota switches to fallback
  it('Case 14: switches to fallback when daily quota is exhausted', () => {
    expect(testCache.hasQuota()).toBe(true);
    for (let i = 0; i < 5; i++) {
      testCache.recordLiveCall();
    }
    expect(testCache.hasQuota()).toBe(false);
    const stats = testCache.getStats();
    expect(stats.dailyQuotaUsed).toBe(5);
    expect(stats.dailyQuotaRemaining).toBe(0);
  });

  // 15. Quota Tracking: Accurately records usage
  it('Case 15: tracks quota usage and cache size', () => {
    testCache.set('key1', { text: 'val1', source: 'live', timestamp: Date.now() });
    testCache.recordLiveCall();
    const stats = testCache.getStats();
    expect(stats.cacheSize).toBe(1);
    expect(stats.dailyQuotaUsed).toBe(1);
    expect(stats.dailyQuotaRemaining).toBe(4);
  });

  // 16. Rate Limiter: Enforces minimum interval
  it('Case 16: enforces spacing interval between requests', async () => {
    const start = Date.now();
    testCache.recordLiveCall();
    await testCache.acquireRateLimitSlot();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  // 17. Deduplication: In-flight requests share the same Promise
  it('Case 17: deduplicates in-flight calls sharing the same key', () => {
    const key = 'test:key';
    const mockPromise = Promise.resolve({ text: 'deduped', source: 'live' as const });
    testCache.setInFlight(key, mockPromise);

    const retrieved = testCache.getInFlight(key);
    expect(retrieved).toBe(mockPromise);

    testCache.clearInFlight(key);
    expect(testCache.getInFlight(key)).toBeUndefined();
  });

  // 18. Ask Q&A: Grounded answer for captain question
  it('Case 18: answers grounded team captain inquiry', async () => {
    const adapter = new LiveLLMAdapter({ mode: 'mock' });
    const res = await adapter.ask({
      scriptId: 'full-match',
      eventIndex: 19,
      lang: 'EN',
      question: 'Who is my captain and what are his points?',
      snapshot: {
        scoreboard: { teamBatting: 'CHE', teamBowling: 'MUM', runs: 0, wickets: 1, overs: 0.2 },
        userTeamTotal: 412.5,
        userPlayers: [
          { name: 'Jasprit Bumrah', role: 'BOWL', status: 'BOWLING', totalPoints: 162.0, isCaptain: true },
        ],
        riskFlags: [],
      },
    });

    expect(res.source).toBe('mock');
    expect(res.answer).toContain('Jasprit Bumrah');
    expect(res.answer).toContain('162');
  });

  // 19. Ask Q&A: Grounded answer for risk flags
  it('Case 19: answers grounded risk flags inquiry accurately', async () => {
    const adapter = new LiveLLMAdapter({ mode: 'mock' });
    const res = await adapter.ask({
      scriptId: 'full-match',
      eventIndex: 7,
      lang: 'EN',
      question: 'Who is at risk in my team?',
      snapshot: {
        scoreboard: { teamBatting: 'MUM', teamBowling: 'CHE', runs: 8, wickets: 2, overs: 1.2 },
        userTeamTotal: 98.0,
        userPlayers: [],
        riskFlags: [
          { playerName: 'Ishan Kishan', flagType: 'DUCK_RISK', message: 'Ishan Kishan on 0 off 2 balls, duck risk (-2 pts).' },
        ],
      },
    });

    expect(res.source).toBe('mock');
    expect(res.answer).toContain('Ishan Kishan');
  });

  // 20. Ask Recap: Catch-up 2-line summary
  it('Case 20: returns 2-line catch-up summary on __RECAP__ trigger', async () => {
    const adapter = new LiveLLMAdapter({ mode: 'mock' });
    const res = await adapter.ask({
      scriptId: 'full-match',
      eventIndex: 20,
      lang: 'EN',
      question: '__RECAP__',
      snapshot: {
        scoreboard: { teamBatting: 'CHE', teamBowling: 'MUM', runs: 0, wickets: 1, overs: 0.2 },
        userTeamTotal: 412.5,
        userPlayers: [
          { name: 'Jasprit Bumrah', role: 'BOWL', status: 'BOWLING', totalPoints: 162.0, isCaptain: true },
        ],
        riskFlags: [],
      },
    });

    expect(res.source).toBe('mock');
    expect(res.answer).toContain('412.5');
    expect(res.answer).toContain('Bumrah');
  });
});
