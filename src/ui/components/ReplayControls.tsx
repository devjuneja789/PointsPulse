import React from 'react';

interface ReplayControlsProps {
  scriptId: string;
  changeScript: (scriptId: string) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  nextBall: () => void;
  reset: () => void;
  speed: 1 | 5;
  setSpeed: (speed: 1 | 5) => void;
  eventIndex: number;
  totalEvents: number;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  scriptId,
  changeScript,
  isPlaying,
  togglePlay,
  nextBall,
  reset,
  speed,
  setSpeed,
  eventIndex,
  totalEvents,
}) => {
  return (
    <div
      data-testid="replay-controls"
      style={{
        backgroundColor: 'var(--bg-card)',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Top row: Scenario Selector & Ball Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <select
          data-testid="scenario-selector"
          value={scriptId}
          onChange={(e) => changeScript(e.target.value)}
          aria-label="Select match scenario"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 600,
            flex: 1,
            minHeight: '34px',
          }}
        >
          <option value="full-match">Full Match (14 Scenarios)</option>
          <option value="powerplay-blitz">Powerplay Blitz (VC Sixes & 50)</option>
          <option value="late-collapse">Late Collapse (Wickets & Duck)</option>
        </select>

        <span
          data-testid="ball-counter"
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          Ball {eventIndex + 1}/{totalEvents}
        </span>
      </div>

      {/* Bottom row: Playback Buttons */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {/* Play / Pause button */}
        <button
          data-testid="btn-play-pause"
          onClick={togglePlay}
          style={{
            flex: 1.2,
            backgroundColor: isPlaying ? '#eab308' : 'var(--brand-red)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        {/* Next Ball button */}
        <button
          data-testid="btn-next-ball"
          onClick={nextBall}
          disabled={isPlaying || eventIndex >= totalEvents - 1}
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 600,
            minHeight: '36px',
            opacity: isPlaying || eventIndex >= totalEvents - 1 ? 0.5 : 1,
          }}
        >
          Next ⏭
        </button>

        {/* Speed toggle 1x / 5x */}
        <button
          data-testid="btn-speed"
          onClick={() => setSpeed(speed === 1 ? 5 : 1)}
          style={{
            backgroundColor: speed === 5 ? 'var(--gold-bg)' : 'var(--bg-surface)',
            color: speed === 5 ? 'var(--gold)' : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            fontSize: '11px',
            fontWeight: 700,
            minHeight: '36px',
          }}
        >
          {speed}x
        </button>

        {/* Reset button */}
        <button
          data-testid="btn-reset"
          onClick={reset}
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            fontSize: '11px',
            fontWeight: 600,
            minHeight: '36px',
          }}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
};
