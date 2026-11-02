import { useMatchSimulation } from './hooks/useMatchSimulation';
import { MatchHeader } from './components/MatchHeader';
import { ReplayControls } from './components/ReplayControls';
import { ScoreHero } from './components/ScoreHero';
import { RainBanner } from './components/RainBanner';
import { MyTeamList } from './components/MyTeamList';
import { Timeline } from './components/Timeline';
import { AskTeamBox } from './components/AskTeamBox';
import { BreakdownDrawer } from './components/BreakdownDrawer';
import { BottomNav } from './components/BottomNav';

export default function App() {
  const {
    scriptId,
    changeScript,
    eventIndex,
    totalEvents,
    isPlaying,
    togglePlay,
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
  } = useMatchSimulation();

  const selectedScore = selectedPlayerId ? playerScores[selectedPlayerId] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. Sticky Match Header with SIMULATED + LIVE Badges, Score Strip, Theme & Lang toggles */}
      <MatchHeader
        scoreboard={matchState.scoreboard}
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* 2. Interactive Replay Controls (Scenario selector, Play/Pause, Next Ball, Speed, Reset) */}
      <ReplayControls
        scriptId={scriptId}
        changeScript={changeScript}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        nextBall={nextBall}
        reset={reset}
        speed={speed}
        setSpeed={setSpeed}
        eventIndex={eventIndex}
        totalEvents={totalEvents}
      />

      {/* 3. Score Hero: Glanceable Total + Animated Delta + Why It Changed Card (Above the Fold) */}
      <ScoreHero
        totalPoints={userTeamTotal}
        delta={currentDelta}
        explanation={explanation}
        openBreakdown={() => openDrawer()}
        lang={lang}
      />

      {/* 4. Rain Reduced Overs Banner (Triggered during DLS / rain events) */}
      <RainBanner scoreboard={matchState.scoreboard} lang={lang} />

      {/* 5. 11 Player Rows with Status Chips, C/VC Badges, Risk Flags & Row Flashes */}
      <MyTeamList
        userTeam={userTeam}
        allPlayers={allPlayers}
        playerScores={playerScores}
        matchState={matchState}
        riskFlags={riskFlags}
        changedPlayers={currentDelta ? currentDelta.changedPlayers : []}
        openDrawer={openDrawer}
        lang={lang}
      />

      {/* 6. Ask About My Team Interactive Q&A */}
      <AskTeamBox
        scriptId={scriptId}
        eventIndex={eventIndex}
        lang={lang}
      />

      {/* 7. Reverse Chronological Match Timeline (With "Catch Me Up" button) */}
      <Timeline
        history={history}
        lang={lang}
        openDrawer={openDrawer}
        scriptId={scriptId}
        eventIndex={eventIndex}
      />

      {/* 8. Itemised Calculation Breakdown Drawer */}
      <BreakdownDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        score={selectedScore}
        lang={lang}
      />

      {/* 9. Bottom Nav & Prototype Disclaimer */}
      <BottomNav lang={lang} />
    </div>
  );
}
