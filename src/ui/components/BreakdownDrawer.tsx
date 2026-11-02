import React from 'react';
import { PlayerFantasyScore } from '../../engine';

interface BreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  score: PlayerFantasyScore | null;
  lang: 'EN' | 'HI';
}

export const BreakdownDrawer: React.FC<BreakdownDrawerProps> = ({
  isOpen,
  onClose,
  score,
  lang,
}) => {
  if (!isOpen || !score) return null;

  return (
    <div
      data-testid="breakdown-drawer-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      <div
        data-testid="breakdown-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface)',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          padding: '20px 18px 28px 18px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Header: Player Name + Multiplier Tag + Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {score.playerName}
              </h3>
              {score.isCaptain && (
                <span
                  style={{
                    backgroundColor: 'var(--gold)',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  CAPTAIN (2x)
                </span>
              )}
              {score.isViceCaptain && (
                <span
                  style={{
                    backgroundColor: 'var(--gold)',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  VICE-CAPTAIN (1.5x)
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'EN' ? 'Itemised Dream11 Points Breakdown' : 'Itemised Points Calculation'}
            </div>
          </div>

          <button
            data-testid="btn-close-drawer"
            onClick={onClose}
            aria-label="Close breakdown drawer"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Itemised Calculation List */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          {score.items.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {lang === 'EN'
                ? 'Player is not in confirmed XI (0 points).'
                : 'Khiladi playing XI me nahi hain (0 points).'}
            </div>
          ) : (
            score.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom:
                    idx < score.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      color: item.category === 'multiplier' ? 'var(--gold)' : 'var(--text-main)',
                      fontWeight: item.category === 'multiplier' ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                  {item.isProvisional && (
                    <span
                      style={{
                        fontSize: '10px',
                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                        color: 'var(--gold)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontWeight: 600,
                      }}
                    >
                      {lang === 'EN' ? 'provisional' : 'sambhavit'}
                    </span>
                  )}
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: item.points >= 0 ? 'var(--text-main)' : 'var(--loss)',
                  }}
                >
                  {item.points >= 0 ? `+${item.points.toFixed(1)}` : item.points.toFixed(1)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Total Reconciled Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)' }}>
            {lang === 'EN' ? 'Total Player Points' : 'Total Points'}
          </span>
          <span
            data-testid="drawer-total-points"
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 900,
              fontSize: '18px',
              color: 'var(--gain)',
            }}
          >
            {score.totalPoints.toFixed(1)} pts
          </span>
        </div>
      </div>
    </div>
  );
};
