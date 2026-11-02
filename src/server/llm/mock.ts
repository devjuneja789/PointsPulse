import { ExplainParams, ExplainResponse } from './types';

export function getMockExplanation(params: ExplainParams): ExplainResponse {
  const { lang, playerName = 'Jasprit Bumrah', eventName = 'wicket', deltaPoints = 66, multiplier = 2 } = params;

  if (lang === 'HI') {
    const multText = multiplier > 1 ? ` (Captain ${multiplier}x multiplier)` : '';
    return {
      text: `${playerName} ne ${eventName} hasil kiya (+${deltaPoints} pts${multText}).`,
      source: 'mock',
      modelUsed: 'mock-engine',
    };
  }

  const multText = multiplier > 1 ? ` (${multiplier}x Captain applied)` : '';
  return {
    text: `${playerName} earned +${deltaPoints} pts from ${eventName}${multText}.`,
    source: 'mock',
    modelUsed: 'mock-engine',
  };
}
