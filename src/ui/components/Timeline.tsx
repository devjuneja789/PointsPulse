import React, { useState } from 'react';
import { HistoryItem } from '../hooks/useMatchSimulation';

interface TimelineProps {
  history: HistoryItem[];
  lang: 'EN' | 'HI';
  openDrawer: (playerId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ history, lang, openDrawer }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (history.length === 0) return null;

  return (
    <section
      data-testid="timeline-section"
      style={{
        padding: '0 16px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
            {lang === 'EN' ? 'Match Timeline' : 'Match Timeline'}
          </h2>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: 'var(--badge-bg)',
              color: 'var(--text-muted)',
              borderRadius: '10px',
              padding: '1px 6px',
              fontWeight: 700,
            }}
          >
            {history.length}
          </span>
        </div>

        <button
          data-testid="btn-toggle-timeline"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '11px',
            color: 'var(--text-subtle)',
            fontWeight: 600,
          }}
        >
          {isExpanded ? (lang === 'EN' ? 'Collapse ▴' : 'Chhupayein ▴') : (lang === 'EN' ? 'Expand ▾' : 'Dekhein ▾')}
        </button>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.map((item, idx) => {
            const primaryPlayer = item.delta.changedPlayers[0];
            const deltaVal = item.delta.totalDelta;
            const isGain = deltaVal > 0;
            const isLoss = deltaVal < 0;

            return (
              <div
                key={`${item.event.id}-${idx}`}
                data-testid={`timeline-item-${item.event.id}`}
                onClick={() => primaryPlayer && openDrawer(primaryPlayer.playerId)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: primaryPlayer ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                      }}
                    >
                      Over {item.event.over}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>•</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {primaryPlayer ? primaryPlayer.playerName : item.event.note}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                    {item.explanation}
                  </p>
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: '13px',
                    color: isGain ? 'var(--gain)' : isLoss ? 'var(--loss)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                  }}
                >
                  {isGain && '▲ +'}
                  {isLoss && '▼ '}
                  {deltaVal.toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
