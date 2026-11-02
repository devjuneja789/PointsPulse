import React from 'react';
import { MatchScoreboard } from '../../engine';

interface RainBannerProps {
  scoreboard: MatchScoreboard;
  lang: 'EN' | 'HI';
}

export const RainBanner: React.FC<RainBannerProps> = ({ scoreboard, lang }) => {
  if (!scoreboard.isRainInterrupted) return null;

  return (
    <div
      data-testid="rain-banner"
      style={{
        margin: '0 16px 10px 16px',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <span style={{ fontSize: '18px' }}>🌧️</span>
      <p style={{ fontSize: '12px', lineHeight: 1.4, color: '#38bdf8', fontWeight: 600 }}>
        {lang === 'EN'
          ? `Match interrupted by rain. Overs reduced to ${scoreboard.maxOvers}. Scoring rules remain unchanged for DLS; bowler quotas and batting opportunities are adjusted.`
          : `Baarish ke karan match ${scoreboard.maxOvers} overs ka kar diya gaya hai. DLS rules ke anusaar scoring rules same rahenge; overs aur batting chances adjust honge.`}
      </p>
    </div>
  );
};
