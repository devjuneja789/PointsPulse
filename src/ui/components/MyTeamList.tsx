import React from 'react';
import {
  MatchState,
  Player,
  PlayerFantasyScore,
  PointDelta,
  RiskFlag,
  UserTeamConfig,
} from '../../engine';

interface MyTeamListProps {
  userTeam: UserTeamConfig;
  allPlayers: Player[];
  playerScores: Record<string, PlayerFantasyScore>;
  matchState: MatchState;
  riskFlags: RiskFlag[];
  changedPlayers: PointDelta[];
  openDrawer: (playerId: string) => void;
  lang: 'EN' | 'HI';
}

export const MyTeamList: React.FC<MyTeamListProps> = ({
  userTeam,
  allPlayers,
  playerScores,
  matchState,
  riskFlags,
  changedPlayers,
  openDrawer,
  lang,
}) => {
  const playerMap = new Map<string, Player>(allPlayers.map((p) => [p.id, p]));
  const changedMap = new Map<string, PointDelta>(changedPlayers.map((cp) => [cp.playerId, cp]));
  const riskMap = new Map<string, RiskFlag>(riskFlags.map((rf) => [rf.playerId, rf]));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BATTING':
        return { bg: 'rgba(30, 158, 74, 0.2)', text: 'var(--gain)', border: 'var(--gain)' };
      case 'BOWLING':
        return { bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', border: '#38bdf8' };
      case 'OUT':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' };
      case 'NOT PLAYING':
        return { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8', border: '#64748b' };
      case 'IMPACT SUB':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: '#a855f7' };
      default:
        return { bg: 'var(--bg-surface)', text: 'var(--text-muted)', border: 'var(--border-subtle)' };
    }
  };

  return (
    <section
      data-testid="my-team-section"
      style={{
        padding: '0 16px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
          {lang === 'EN' ? 'My 11 Players' : 'Mere 11 Khiladi'}
        </h2>
        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
          {lang === 'EN' ? 'Tap player for breakdown' : 'Breakdown ke liye tap karein'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {userTeam.players.map((playerId) => {
          const player = playerMap.get(playerId);
          const score = playerScores[playerId];
          const status = matchState.playerStatuses[playerId] || 'FIELDING';
          const isStriker = matchState.strikerId === playerId;
          const isCaptain = userTeam.captain === playerId;
          const isViceCaptain = userTeam.viceCaptain === playerId;
          const changed = changedMap.get(playerId);
          const risk = riskMap.get(playerId);

          const statusColors = getStatusColor(status);
          const flashClass = changed
            ? changed.finalDelta > 0
              ? 'flash-gain'
              : changed.finalDelta < 0
              ? 'flash-loss'
              : ''
            : '';

          return (
            <div
              key={playerId}
              data-testid={`player-row-${playerId}`}
              onClick={() => openDrawer(playerId)}
              className={flashClass}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openDrawer(playerId);
                }
              }}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {/* Row Top: Player Info & Points */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left: C/VC badge + Name + Team & Role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isCaptain && (
                    <span
                      data-testid={`badge-c-${playerId}`}
                      style={{
                        backgroundColor: 'var(--gold)',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '10px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                      title="Captain (2x Points)"
                    >
                      C
                    </span>
                  )}

                  {isViceCaptain && (
                    <span
                      data-testid={`badge-vc-${playerId}`}
                      style={{
                        backgroundColor: 'var(--gold)',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '9px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                      title="Vice-Captain (1.5x Points)"
                    >
                      VC
                    </span>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>
                        {player?.name || playerId}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                      {player?.team} • {player?.role}
                    </div>
                  </div>
                </div>

                {/* Right: Status chip & Points */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Status chip */}
                  <span
                    data-testid={`status-${playerId}`}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: statusColors.bg,
                      color: statusColors.text,
                      border: `1px solid ${statusColors.border}`,
                      borderRadius: '4px',
                      padding: '2px 6px',
                      letterSpacing: '0.4px',
                    }}
                  >
                    {status}
                    {status === 'BATTING' && isStriker ? '*' : ''}
                  </span>

                  {/* Points with delta indication */}
                  <div style={{ textAlign: 'right', minWidth: '55px' }}>
                    <div
                      data-testid={`pts-${playerId}`}
                      style={{
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '15px',
                        color: 'var(--text-main)',
                      }}
                    >
                      {score ? score.totalPoints.toFixed(1) : '0.0'}
                    </div>

                    {changed && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: changed.finalDelta > 0 ? 'var(--gain)' : 'var(--loss)',
                        }}
                      >
                        {changed.finalDelta > 0 ? '▲ +' : '▼ '}
                        {changed.finalDelta.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row Bottom: Risk / Upside Tag if present */}
              {risk && (
                <div
                  data-testid={`risk-tag-${playerId}`}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor:
                      risk.flagType === 'MILESTONE_CLOSE' || risk.flagType === 'HAUL_CLOSE'
                        ? 'var(--gain-bg)'
                        : risk.severity === 'high'
                        ? 'var(--loss-bg)'
                        : 'rgba(234, 179, 8, 0.15)',
                    color:
                      risk.flagType === 'MILESTONE_CLOSE' || risk.flagType === 'HAUL_CLOSE'
                        ? 'var(--gain)'
                        : risk.severity === 'high'
                        ? 'var(--loss)'
                        : 'var(--gold)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>
                    {risk.flagType === 'MILESTONE_CLOSE' || risk.flagType === 'HAUL_CLOSE' ? '⚡' : '⚠'}
                  </span>
                  <span>{lang === 'EN' ? risk.messageEn : risk.messageHi}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
