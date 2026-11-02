import React from 'react';
import { MatchScoreboard } from '../../engine';

interface MatchHeaderProps {
  scoreboard: MatchScoreboard;
  lang: 'EN' | 'HI';
  setLang: (lang: 'EN' | 'HI') => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  scoreboard,
  lang,
  setLang,
  theme,
  toggleTheme,
}) => {
  return (
    <header
      data-testid="match-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Left: Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            data-testid="badge-simulated"
            style={{
              backgroundColor: 'var(--brand-red)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
            }}
          >
            SIMULATED
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                animation: 'pulseLive 1.8s infinite',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gain)', letterSpacing: '0.4px' }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Right: Actions (Theme & Language) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Theme toggle */}
          <button
            data-testid="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontSize: '12px',
              minHeight: '28px',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Language toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            <button
              data-testid="lang-en"
              onClick={() => setLang('EN')}
              style={{
                background: lang === 'EN' ? 'var(--brand-red)' : 'transparent',
                color: lang === 'EN' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                minHeight: '28px',
              }}
            >
              EN
            </button>
            <button
              data-testid="lang-hi"
              onClick={() => setLang('HI')}
              style={{
                background: lang === 'HI' ? 'var(--brand-red)' : 'transparent',
                color: lang === 'HI' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                minHeight: '28px',
              }}
            >
              Hinglish
            </button>
          </div>
        </div>
      </div>

      {/* Match Score Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: '12px',
          color: 'var(--text-muted)',
          paddingTop: '2px',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
          {scoreboard.teamBatting} vs {scoreboard.teamBowling}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
          {scoreboard.teamBatting} {scoreboard.runs}/{scoreboard.wickets} ({scoreboard.overs} ov)
        </span>
      </div>
    </header>
  );
};
