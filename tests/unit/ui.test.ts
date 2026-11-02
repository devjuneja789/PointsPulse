import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MatchHeader } from '../../src/ui/components/MatchHeader';
import { ReplayControls } from '../../src/ui/components/ReplayControls';
import { ScoreHero } from '../../src/ui/components/ScoreHero';
import { RainBanner } from '../../src/ui/components/RainBanner';
import { MyTeamList } from '../../src/ui/components/MyTeamList';
import { BreakdownDrawer } from '../../src/ui/components/BreakdownDrawer';
import { Timeline } from '../../src/ui/components/Timeline';
import { BottomNav } from '../../src/ui/components/BottomNav';

import miSquadJson from '../../src/data/squads/mi.json';
import cskSquadJson from '../../src/data/squads/csk.json';
import myTeamJson from '../../src/data/myTeam.json';
import {
  createInitialMatchState,
  calculatePlayerFantasyScore,
  Player,
  UserTeamConfig,
  MatchInfo,
  PlayerFantasyScore,
} from '../../src/engine';
import fullMatchJson from '../../src/data/scripts/full-match.json';
import rulesJson from '../../src/data/rules.json';

const allPlayers: Player[] = [
  ...(miSquadJson.players as Player[]),
  ...(cskSquadJson.players as Player[]),
];
const userTeam: UserTeamConfig = myTeamJson as UserTeamConfig;
const matchInfo: MatchInfo = fullMatchJson.matchInfo as MatchInfo;

describe('Phase 3: Product UI Component Tests', () => {
  it('renders MatchHeader with SIMULATED and LIVE badges, theme and lang controls', () => {
    const html = renderToStaticMarkup(
      React.createElement(MatchHeader, {
        scoreboard: {
          innings: 1,
          teamBatting: 'MUM',
          teamBowling: 'CHE',
          runs: 142,
          wickets: 4,
          overs: 16.2,
          legalBallsInOver: 2,
          maxOvers: 20,
        },
        lang: 'EN',
        setLang: () => {},
        theme: 'dark',
        toggleTheme: () => {},
      })
    );

    expect(html).toContain('SIMULATED');
    expect(html).toContain('LIVE');
    expect(html).toContain('MUM 142/4 (16.2 ov)');
    expect(html).toContain('data-testid="badge-simulated"');
    expect(html).toContain('data-testid="lang-en"');
    expect(html).toContain('data-testid="lang-hi"');
  });

  it('renders ReplayControls with all 3 scenarios, playback buttons, and speed toggle', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReplayControls, {
        scriptId: 'full-match',
        changeScript: () => {},
        isPlaying: false,
        togglePlay: () => {},
        nextBall: () => {},
        reset: () => {},
        speed: 1,
        setSpeed: () => {},
        eventIndex: 4,
        totalEvents: 28,
      })
    );

    expect(html).toContain('Full Match (14 Scenarios)');
    expect(html).toContain('Powerplay Blitz (VC Sixes &amp; 50)');
    expect(html).toContain('Late Collapse (Wickets &amp; Duck)');
    expect(html).toContain('Ball 5/28');
    expect(html).toContain('Play');
    expect(html).toContain('Next');
    expect(html).toContain('Reset');
  });

  it('renders ScoreHero with glanceable total points, delta badge, and explanation', () => {
    const html = renderToStaticMarkup(
      React.createElement(ScoreHero, {
        totalPoints: 412.5,
        delta: {
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
              items: [],
              cause: 'Bowled a batter',
            },
          ],
          provisionalChanges: [],
          noChange: false,
        },
        explanation: {
          text: 'Jasprit Bumrah bowled Ruturaj Gaikwad (+25 wicket, +8 bowled bonus = 33 base x 2 Captain = +66 pts).',
          source: 'live',
        },
        openBreakdown: () => {},
        lang: 'EN',
      })
    );

    expect(html).toContain('412.5');
    expect(html).toContain('▲ +66.0');
    expect(html).toContain('WHY IT CHANGED');
    expect(html).toContain('Jasprit Bumrah bowled Ruturaj Gaikwad');
    expect(html).toContain('data-testid="btn-see-breakdown"');
  });

  it('renders MyTeamList with all 11 players, C/VC badges, and live status chips', () => {
    const state = createInitialMatchState(matchInfo, allPlayers);
    const scores: Record<string, PlayerFantasyScore> = {};
    for (const p of allPlayers) {
      scores[p.id] = calculatePlayerFantasyScore(
        state.playerStats[p.id],
        p.role,
        p.name,
        p.id === userTeam.captain,
        p.id === userTeam.viceCaptain,
        state.playerStatuses[p.id],
        rulesJson
      );
    }

    const html = renderToStaticMarkup(
      React.createElement(MyTeamList, {
        userTeam,
        allPlayers,
        playerScores: scores,
        matchState: state,
        riskFlags: [
          {
            playerId: 'mi_rohit',
            playerName: 'Rohit Sharma',
            flagType: 'DUCK_RISK',
            severity: 'medium',
            messageEn: 'Rohit Sharma on 0 off 1 balls, duck risk (-2 pts).',
            messageHi: 'Rohit Sharma 0 par 1 balls khele hain, duck ka khatra.',
          },
        ],
        changedPlayers: [],
        openDrawer: () => {},
        lang: 'EN',
      })
    );

    // Verify all 11 players are rendered
    for (const pId of userTeam.players) {
      expect(html).toContain(`data-testid="player-row-${pId}"`);
    }

    // Verify Captain and Vice-Captain badges
    expect(html).toContain(`data-testid="badge-c-${userTeam.captain}"`);
    expect(html).toContain(`data-testid="badge-vc-${userTeam.viceCaptain}"`);

    // Verify benched player NOT PLAYING status
    expect(html).toContain('NOT PLAYING');

    // Verify risk tag
    expect(html).toContain('duck risk (-2 pts)');
  });

  it('renders BreakdownDrawer with itemised line items, category points, and multiplier math', () => {
    const sampleScore = {
      playerId: 'mi_bumrah',
      playerName: 'Jasprit Bumrah',
      role: 'BOWL' as const,
      isCaptain: true,
      isViceCaptain: false,
      multiplier: 2.0,
      basePoints: 81.0,
      totalPoints: 162.0,
      items: [
        { category: 'participation' as const, label: 'In Starting XI', points: 4 },
        { category: 'bowling' as const, label: 'Wickets (2)', points: 50 },
        { category: 'bowling' as const, label: 'Bowled/LBW Bonus (1)', points: 8 },
        { category: 'bowling' as const, label: 'Maiden Overs (1)', points: 12 },
        { category: 'bowling' as const, label: 'Economy Rate (2.0 rpo)', points: 6 },
        { category: 'batting' as const, label: 'Runs (1)', points: 1 },
        { category: 'multiplier' as const, label: 'Captain Multiplier (2x)', points: 81 },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(BreakdownDrawer, {
        isOpen: true,
        onClose: () => {},
        score: sampleScore,
        lang: 'EN',
      })
    );

    expect(html).toContain('Jasprit Bumrah');
    expect(html).toContain('CAPTAIN (2x)');
    expect(html).toContain('In Starting XI');
    expect(html).toContain('+50.0');
    expect(html).toContain('Captain Multiplier (2x)');
    expect(html).toContain('162.0 pts');
  });

  it('renders Timeline with history items and RainBanner when rain occurs', () => {
    const timelineHtml = renderToStaticMarkup(
      React.createElement(Timeline, {
        history: [
          {
            event: {
              id: 'fm_05',
              innings: 1,
              over: 0.5,
              ball: 5,
              batter: 'mi_sky',
              bowler: 'csk_tushar',
              runs: 6,
              extras: 0,
              wicket: null,
              note: 'SKY Six',
            },
            delta: {
              eventId: 'fm_05',
              myTotalBefore: 44,
              myTotalAfter: 56,
              totalDelta: 12,
              changedPlayers: [
                {
                  playerId: 'mi_sky',
                  playerName: 'Suryakumar Yadav',
                  isCaptain: false,
                  isViceCaptain: true,
                  multiplier: 1.5,
                  baseDelta: 8,
                  finalDelta: 12,
                  items: [],
                  cause: 'Hit a SIX',
                },
              ],
              provisionalChanges: [],
              noChange: false,
            },
            explanation: 'Suryakumar Yadav hit a SIX! (+12 pts).',
          },
        ],
        lang: 'EN',
        openDrawer: () => {},
      })
    );

    expect(timelineHtml).toContain('Over 0.5');
    expect(timelineHtml).toContain('Suryakumar Yadav');
    expect(timelineHtml).toContain('▲ +12.0');

    // Test Rain Banner
    const rainHtml = renderToStaticMarkup(
      React.createElement(RainBanner, {
        scoreboard: {
          innings: 1,
          teamBatting: 'MUM',
          teamBowling: 'CHE',
          runs: 90,
          wickets: 3,
          overs: 10.0,
          legalBallsInOver: 0,
          isRainInterrupted: true,
          maxOvers: 16,
        },
        lang: 'EN',
      })
    );

    expect(rainHtml).toContain('Match interrupted by rain');
    expect(rainHtml).toContain('reduced to 16');
  });

  it('renders BottomNav with disclaimer and navigation items', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNav, { lang: 'EN' })
    );

    expect(html).toContain('Unofficial prototype');
    expect(html).toContain('Not affiliated with Dream11, BCCI, IPL');
    expect(html).toContain('My Match');
  });
});
