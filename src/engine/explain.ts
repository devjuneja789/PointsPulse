import { TeamDelta } from './types';
import fullMatchFallback from '../data/fallback-explanations/full-match.json';
import powerplayFallback from '../data/fallback-explanations/powerplay-blitz.json';
import collapseFallback from '../data/fallback-explanations/late-collapse.json';

const fallbackRegistry: Record<string, Record<string, { EN: string; HI: string }>> = {
  'full-match': fullMatchFallback.explanations,
  'powerplay-blitz': powerplayFallback.explanations,
  'late-collapse': collapseFallback.explanations,
};

const ALLOWED_STRUCTURAL_NUMBERS = new Set([0, 1, 2, 1.5, 11, 20]);
const BANNED_WORDS = ['bet', 'betting', 'win', 'guaranteed', 'gamble', 'profit', 'jackpot', 'crypto'];

export function generateTemplateExplanation(
  delta: TeamDelta,
  lang: 'EN' | 'HI' = 'EN'
): string {
  if (delta.noChange || delta.changedPlayers.length === 0) {
    return lang === 'EN'
      ? 'No change to your fantasy team points on this ball.'
      : 'Is ball par aapki fantasy team ke points me koi badlav nahi hua.';
  }

  const primary = delta.changedPlayers[0];
  const sign = primary.finalDelta >= 0 ? '+' : '';
  const multiplierTextEn = primary.isCaptain
    ? ' (applied 2x Captain multiplier)'
    : primary.isViceCaptain
    ? ' (applied 1.5x Vice-Captain multiplier)'
    : '';
  const multiplierTextHi = primary.isCaptain
    ? ' (Captain 2x multiplier ke sath)'
    : primary.isViceCaptain
    ? ' (Vice-Captain 1.5x multiplier ke sath)'
    : '';

  if (lang === 'HI') {
    return `${primary.playerName}: ${primary.cause} (${sign}${primary.finalDelta} pts${multiplierTextHi}). Ab total ${delta.myTotalAfter} pts hai.`;
  }

  return `${primary.playerName}: ${primary.cause} (${sign}${primary.finalDelta} pts${multiplierTextEn}). Your total is now ${delta.myTotalAfter} pts.`;
}

export function validateExplanationText(
  text: string,
  delta: TeamDelta,
  _lang: 'EN' | 'HI' = 'EN'
): { isValid: boolean; reason?: string; extractedNumbers: number[] } {
  // 1. Length check: max 35 words
  const words = text.trim().split(/\s+/);
  if (words.length > 35) {
    return {
      isValid: false,
      reason: `Text exceeds 35 words (count: ${words.length})`,
      extractedNumbers: [],
    };
  }

  // 2. Language check: Hinglish must use Latin characters (no Devanagari script)
  if (/[\u0900-\u097F]/.test(text)) {
    return {
      isValid: false,
      reason: 'Devanagari script detected; Hinglish must be Latin-script only.',
      extractedNumbers: [],
    };
  }

  // 3. Banned words check (predictions / betting)
  const lowerText = text.toLowerCase();
  for (const banned of BANNED_WORDS) {
    const regex = new RegExp(`\\b${banned}\\b`, 'i');
    if (regex.test(lowerText)) {
      return {
        isValid: false,
        reason: `Banned word detected: "${banned}"`,
        extractedNumbers: [],
      };
    }
  }

  // 4. Number validation: Collect all valid numbers from delta payload
  const validNumbers = new Set<number>();
  for (const num of ALLOWED_STRUCTURAL_NUMBERS) {
    validNumbers.add(num);
  }

  validNumbers.add(Math.abs(delta.totalDelta));
  validNumbers.add(delta.totalDelta);
  validNumbers.add(delta.myTotalBefore);
  validNumbers.add(delta.myTotalAfter);

  for (const player of delta.changedPlayers) {
    validNumbers.add(player.baseDelta);
    validNumbers.add(Math.abs(player.baseDelta));
    validNumbers.add(player.finalDelta);
    validNumbers.add(Math.abs(player.finalDelta));
    validNumbers.add(player.multiplier);
    for (const item of player.items) {
      validNumbers.add(item.points);
      validNumbers.add(Math.abs(item.points));
    }
  }

  // Extract all numbers from the generated text
  const numberMatches = text.match(/-?\d+(\.\d+)?/g) || [];
  const extractedNumbers: number[] = [];

  for (const match of numberMatches) {
    const num = parseFloat(match);
    if (!isNaN(num)) {
      extractedNumbers.push(num);
      const isAllowed = validNumbers.has(num) || validNumbers.has(Math.abs(num));
      if (!isAllowed) {
        return {
          isValid: false,
          reason: `Invented or unverified number detected in explanation: ${num}`,
          extractedNumbers,
        };
      }
    }
  }

  return {
    isValid: true,
    extractedNumbers,
  };
}

export function getExplanationForEvent(
  scriptId: string,
  eventId: string,
  delta: TeamDelta,
  lang: 'EN' | 'HI' = 'EN',
  candidateAiText?: string
): { text: string; source: 'live' | 'fallback' | 'template' } {
  // If candidate AI text is supplied, validate it first
  if (candidateAiText) {
    const validation = validateExplanationText(candidateAiText, delta, lang);
    if (validation.isValid) {
      return {
        text: candidateAiText,
        source: 'live',
      };
    }
  }

  // Next try pre-authored hand-written fallback
  const scriptFallbacks = fallbackRegistry[scriptId];
  if (scriptFallbacks && scriptFallbacks[eventId]) {
    const fallbackText = scriptFallbacks[eventId][lang];
    if (fallbackText) {
      return {
        text: fallbackText,
        source: 'fallback',
      };
    }
  }

  // Deterministic generated template
  return {
    text: generateTemplateExplanation(delta, lang),
    source: 'template',
  };
}
