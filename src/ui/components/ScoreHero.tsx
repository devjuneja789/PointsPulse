import React, { useEffect, useState, useRef } from 'react';
import { TeamDelta } from '../../engine';

interface ScoreHeroProps {
  totalPoints: number;
  delta: TeamDelta | null;
  explanation: { text: string; source: 'live' | 'fallback' | 'template' };
  openBreakdown: () => void;
  lang: 'EN' | 'HI';
}

export const ScoreHero: React.FC<ScoreHeroProps> = ({
  totalPoints,
  delta,
  explanation,
  openBreakdown,
  lang,
}) => {
  // Count-up display animation over ~600ms
  const [displayedTotal, setDisplayedTotal] = useState<number>(totalPoints);
  const prevTotalRef = useRef<number>(totalPoints);

  useEffect(() => {
    const start = prevTotalRef.current;
    const end = totalPoints;
    if (start === end) return;

    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentVal = start + (end - start) * progress;
      setDisplayedTotal(parseFloat(currentVal.toFixed(1)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTotalRef.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [totalPoints]);

  const deltaValue = delta ? delta.totalDelta : 0;
  const isGain = deltaValue > 0;
  const isLoss = deltaValue < 0;
  const isZero = deltaValue === 0;

  return (
    <section
      data-testid="score-hero"
      style={{
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Total Points & Delta Card */}
      <div
        data-testid="total-score-card"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            {lang === 'EN' ? 'My Fantasy Team' : 'Meri Fantasy Team'}
          </div>
          <div
            data-testid="displayed-total-points"
            style={{
              fontSize: '34px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-main)',
              lineHeight: 1.1,
              marginTop: '4px',
            }}
          >
            {displayedTotal.toFixed(1)}{' '}
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>pts</span>
          </div>
        </div>

        {/* Delta Chip */}
        <div
          data-testid="delta-badge"
          aria-live="polite"
          style={{
            backgroundColor: isGain ? 'var(--gain-bg)' : isLoss ? 'var(--loss-bg)' : 'var(--badge-bg)',
            color: isGain ? 'var(--gain)' : isLoss ? 'var(--loss)' : 'var(--text-muted)',
            border: `1px solid ${isGain ? 'var(--gain)' : isLoss ? 'var(--loss)' : 'var(--border-subtle)'}`,
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800,
            fontSize: '15px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isGain && '▲ +'}
          {isLoss && '▼ '}
          {isZero && '• '}
          {deltaValue.toFixed(1)}
        </div>
      </div>

      {/* Why It Changed Explanation Card */}
      <div
        data-testid="explanation-card"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.6px' }}>
              {lang === 'EN' ? 'WHY IT CHANGED' : 'KYUN BADHA / GHATA'}
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-subtle)',
                fontWeight: 600,
              }}
            >
              {explanation.source === 'live' ? '⚡ AI-phrased' : '✓ Verified'}
            </span>
          </div>

          <button
            data-testid="btn-see-breakdown"
            onClick={openBreakdown}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--border-active)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {lang === 'EN' ? 'See breakdown ▾' : 'Breakdown dekhein ▾'}
          </button>
        </div>

        <p
          data-testid="explanation-text"
          style={{
            fontSize: '13.5px',
            lineHeight: 1.45,
            color: 'var(--text-main)',
            fontWeight: 500,
          }}
        >
          {explanation.text}
        </p>
      </div>
    </section>
  );
};
