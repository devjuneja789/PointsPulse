import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  createInitialMatchState,
  reduceMatchState,
  calculatePlayerFantasyScore,
  calculateTeamDelta,
  evaluateRiskFlags,
  getExplanationForEvent,
  MatchEvent,
  MatchInfo,
  Player,
  PlayerFantasyScore,
  TeamDelta,
  UserTeamConfig,
} from '../../engine';

import fullMatchJson from '../../data/scripts/full-match.json';
import powerplayJson from '../../data/scripts/powerplay-blitz.json';
import collapseJson from '../../data/scripts/late-collapse.json';
import miSquadJson from '../../data/squads/mi.json';
import cskSquadJson from '../../data/squads/csk.json';
import myTeamJson from '../../data/myTeam.json';
import rulesJson from '../../data/rules.json';

const allPlayers: Player[] = [
  ...(miSquadJson.players as Player[]),
  ...(cskSquadJson.players as Player[]),
];

interface ScriptData {
  id: string;
  title: string;
  description: string;
  matchInfo: MatchInfo;
  events: MatchEvent[];
}

const scriptMap: Record<string, ScriptData> = {
  'full-match': fullMatchJson as unknown as ScriptData,
  'powerplay-blitz': powerplayJson as unknown as ScriptData,
  'late-collapse': collapseJson as unknown as ScriptData,
};

const userTeam: UserTeamConfig = myTeamJson as UserTeamConfig;

export interface HistoryItem {
  event: MatchEvent;
  delta: TeamDelta;
  explanation: string;
}

export function useMatchSimulation() {
  const [scriptId, setScriptId] = useState<string>('full-match');
  const [eventIndex, setEventIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<1 | 5>(1);

  // Language state with safe localStorage persistence
  const [lang, setLangState] = useState<'EN' | 'HI'>(() => {
    try {
      const saved = localStorage.getItem('pointspulse_lang');
      return saved === 'HI' ? 'HI' : 'EN';
    } catch {
      return 'EN';
    }
  });

  const setLang = useCallback((newLang: 'EN' | 'HI') => {
    setLangState(newLang);
    try {
      localStorage.setItem('pointspulse_lang', newLang);
    } catch {
      // Ignored for restricted storage
    }
  }, []);

  // Theme state with safe localStorage persistence
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('pointspulse_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('pointspulse_theme', next);
      } catch {
        // Ignored
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Drawer inspection state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const script = useMemo(() => scriptMap[scriptId] || fullMatchJson, [scriptId]);
  const matchInfo = useMemo(() => script.matchInfo as MatchInfo, [script]);
  const events = useMemo(() => script.events as MatchEvent[], [script]);

  // Replay calculation from start up to current eventIndex
  const { matchState, playerScores, currentDelta, history, riskFlags } = useMemo(() => {
    let state = createInitialMatchState(matchInfo, allPlayers);
    const scores: Record<string, PlayerFantasyScore> = {};

    // Initial baseline scores (Starting XI participation)
    for (const p of allPlayers) {
      const isC = userTeam.captain === p.id;
      const isVC = userTeam.viceCaptain === p.id;
      scores[p.id] = calculatePlayerFantasyScore(
        state.playerStats[p.id],
        p.role,
        p.name,
        isC,
        isVC,
        state.playerStatuses[p.id],
        rulesJson
      );
    }

    if (eventIndex === -1) {
      const flags = evaluateRiskFlags(state, allPlayers, userTeam);
      return {
        matchState: state,
        playerScores: scores,
        currentDelta: null,
        history: [] as HistoryItem[],
        riskFlags: flags,
      };
    }

    let lastDelta: TeamDelta | null = null;
    const historyList: HistoryItem[] = [];

    for (let i = 0; i <= eventIndex && i < events.length; i++) {
      const ev = events[i];
      state = reduceMatchState(state, ev, matchInfo);

      const prevScores = { ...scores };
      for (const p of allPlayers) {
        const isC = userTeam.captain === p.id;
        const isVC = userTeam.viceCaptain === p.id;
        scores[p.id] = calculatePlayerFantasyScore(
          state.playerStats[p.id],
          p.role,
          p.name,
          isC,
          isVC,
          state.playerStatuses[p.id],
          rulesJson
        );
      }

      const delta = calculateTeamDelta(prevScores, scores, userTeam.players, ev);
      lastDelta = delta;

      if (!delta.noChange) {
        const expl = getExplanationForEvent(script.id, ev.id, delta, lang);
        historyList.unshift({
          event: ev,
          delta,
          explanation: expl.text,
        });
      }
    }

    const flags = evaluateRiskFlags(state, allPlayers, userTeam);

    return {
      matchState: state,
      playerScores: scores,
      currentDelta: lastDelta,
      history: historyList,
      riskFlags: flags,
    };
  }, [script, matchInfo, events, eventIndex, lang]);

  // Total points for user's 11
  const userTeamTotal = useMemo(() => {
    return userTeam.players.reduce((sum, pId) => {
      const score = playerScores[pId];
      return sum + (score ? score.totalPoints : 0);
    }, 0);
  }, [playerScores]);

  // Current explanation for the active ball
  const explanation = useMemo(() => {
    if (!currentDelta || eventIndex === -1) {
      return {
        text:
          lang === 'EN'
            ? 'Match is ready to start. All players received +4 starting XI points.'
            : 'Match shuru hone ke liye taiyar hai. Sabhi players ko +4 starting XI points mile hain.',
        source: 'template' as const,
      };
    }
    const currentEv = events[eventIndex];
    return getExplanationForEvent(script.id, currentEv.id, currentDelta, lang);
  }, [currentDelta, eventIndex, events, script.id, lang]);

  // Playback timer loop
  const timerRef = useRef<number | null>(null);

  const nextBall = useCallback(() => {
    setEventIndex((prev) => {
      if (prev < events.length - 1) {
        return prev + 1;
      }
      setIsPlaying(false);
      return prev;
    });
  }, [events.length]);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = speed === 5 ? 400 : 2000;
      timerRef.current = window.setInterval(() => {
        setEventIndex((prev) => {
          if (prev < events.length - 1) {
            return prev + 1;
          }
          setIsPlaying(false);
          return prev;
        });
      }, intervalMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, events.length]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setEventIndex(-1);
    setSelectedPlayerId(null);
    setIsDrawerOpen(false);
  }, []);

  const changeScript = useCallback((newScriptId: string) => {
    setIsPlaying(false);
    setScriptId(newScriptId);
    setEventIndex(-1);
    setSelectedPlayerId(null);
    setIsDrawerOpen(false);
  }, []);

  const openDrawer = useCallback((pId?: string) => {
    setSelectedPlayerId(pId || userTeam.captain);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return {
    scriptId,
    changeScript,
    eventIndex,
    totalEvents: events.length,
    isPlaying,
    togglePlay: () => setIsPlaying((p) => !p),
    nextBall,
    reset,
    speed,
    setSpeed,
    lang,
    setLang,
    theme,
    toggleTheme,
    matchState,
    playerScores,
    userTeamTotal,
    currentDelta,
    explanation,
    history,
    riskFlags,
    selectedPlayerId,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    userTeam,
    allPlayers,
  };
}
