import { useCallback, useEffect, useMemo, useState } from 'react';
import { soundManager } from './audio/soundManager';
import { AppShell } from './components/AppShell';
import { ChallengesScreen } from './components/ChallengesScreen';
import { DifficultySelector } from './components/DifficultySelector';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileScreen } from './components/ProfileScreen';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { VictoryScreen } from './components/VictoryScreen';
import { applyThemeToDocument } from './data/themes';
import {
  calculateAccuracy,
  calculateGameScore,
  calculateXpEarned,
  computeStatistics,
  evaluateNewAchievements,
  getLevelFromXp,
  updateDailyMissionsOnWin,
} from './engine/progression';
import {
  exportPuzzleString,
  generateDailyPuzzle,
  generatePuzzle,
  getDailyDateString,
  parsePuzzleString,
  solveSudoku,
} from './engine/sudokuEngine';
import {
  appendGameRecord,
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  loadActiveGame,
  loadDailyCompletions,
  loadDailyMissions,
  loadGameRecords,
  loadLocalLeaderboard,
  loadPlayerProfile,
  loadUserSettings,
  recordLocalLeaderboardScore,
  saveActiveGame,
  saveDailyCompletion,
  saveDailyMissions,
  savePlayerProfile,
  saveUserSettings,
  updateStreakOnWin,
} from './storage/progressManager';
import type {
  AchievementDef,
  ActiveGameState,
  ChallengePayload,
  DailyCompletion,
  DailyMission,
  Difficulty,
  GameMode,
  GameRecord,
  LocalLeaderboardEntry,
  NavigationTab,
  PlayerProfile,
  ScreenView,
  UserSettings,
} from './types/sudoku';

function createEmptyNotes(): number[][] {
  return Array.from({ length: 81 }, () => []);
}

function getMaxMistakesForMode(mode: GameMode): number | null {
  if (mode === 'zen') return null;
  if (mode === 'mistake-free') return 1;
  return 3;
}

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => loadUserSettings());
  const [profile, setProfile] = useState<PlayerProfile>(() => loadPlayerProfile());
  const [records, setRecords] = useState<GameRecord[]>(() => loadGameRecords());
  const [dailyCompletions, setDailyCompletions] = useState<DailyCompletion[]>(() =>
    loadDailyCompletions()
  );
  const [missionsState, setMissionsState] = useState<{ date: string; missions: DailyMission[] }>(
    () => loadDailyMissions()
  );
  const [leaderboard, setLeaderboard] = useState<LocalLeaderboardEntry[]>(() =>
    loadLocalLeaderboard()
  );

  const [activeGame, setActiveGame] = useState<ActiveGameState | null>(() => loadActiveGame());
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [currentView, setCurrentView] = useState<ScreenView>('home');
  const [challengesSubTab, setChallengesSubTab] = useState<'daily' | 'friends' | 'custom' | 'coach'>(
    'daily'
  );
  const [victoryContext, setVictoryContext] = useState<{
    record: GameRecord;
    newlyUnlocked: AchievementDef[];
  } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Sync theme & audio settings to DOM and SoundManager
  useEffect(() => {
    applyThemeToDocument(settings.theme, settings.highContrast, settings.reducedMotion);
    soundManager.applySettings(settings);
    saveUserSettings(settings);
  }, [settings]);

  // Unlock Web Audio on first user interaction
  useEffect(() => {
    const unlock = () => {
      soundManager.unlockFromGesture();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const startPuzzleGame = useCallback(
    (
      puzzle: number[],
      solution: number[],
      difficulty: Difficulty,
      mode: GameMode,
      opts?: {
        isDaily?: boolean;
        dailyDate?: string;
        challengeId?: string;
        challengeTitle?: string;
      }
    ) => {
      const nextGame: ActiveGameState = {
        id: `game_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        difficulty,
        mode,
        puzzle: [...puzzle],
        solution: [...solution],
        grid: [...puzzle],
        notes: createEmptyNotes(),
        elapsedSeconds: 0,
        score: 0,
        mistakes: 0,
        maxMistakes: getMaxMistakesForMode(mode),
        hintsUsed: 0,
        hintedCells: [],
        undoStack: [],
        redoStack: [],
        isDaily: opts?.isDaily,
        dailyDate: opts?.dailyDate,
        challengeId: opts?.challengeId,
        challengeTitle: opts?.challengeTitle,
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      setActiveGame(nextGame);
      saveActiveGame(nextGame);
      setVictoryContext(null);
      setCurrentView('game');
      soundManager.play('newGame');
    },
    []
  );

  // Handle ?autostart=1 and ?challenge=<encoded> query parameters on boot
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challengeParam = params.get('challenge');
    if (challengeParam) {
      try {
        const decoded = JSON.parse(atob(challengeParam)) as ChallengePayload;
        const parsed = parsePuzzleString(decoded.puzzleString);
        if (parsed) {
          const solved = solveSudoku(parsed);
          if (solved) {
            startPuzzleGame(parsed, solved, decoded.difficulty || 'medium', 'classic', {
              challengeId: decoded.id,
              challengeTitle: decoded.title,
            });
            return;
          }
        }
      } catch {
        // Ignore invalid challenge params
      }
    }

    if (params.get('autostart') === '1') {
      const gen = generatePuzzle('medium');
      startPuzzleGame(gen.puzzle, gen.solution, 'medium', 'classic');
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartNewGame = useCallback(
    (difficulty: Difficulty, mode: GameMode = 'classic', remix = false) => {
      const seed = remix ? `REMIX_${profile.xp}_${Date.now()}` : undefined;
      const gen = generatePuzzle(difficulty, seed);
      startPuzzleGame(gen.puzzle, gen.solution, difficulty, mode, {
        challengeTitle: remix ? `Remix · ${difficulty.toUpperCase()}` : undefined,
      });
    },
    [profile.xp, startPuzzleGame]
  );

  const handleStartDaily = useCallback(() => {
    const today = getDailyDateString();
    const gen = generateDailyPuzzle(today);
    startPuzzleGame(gen.puzzle, gen.solution, gen.difficulty, 'classic', {
      isDaily: true,
      dailyDate: today,
    });
  }, [startPuzzleGame]);

  const handleContinueGame = useCallback(() => {
    if (!activeGame) return;
    setCurrentView('game');
    soundManager.play('buttonClick');
  }, [activeGame]);

  const handleUpdateGame = useCallback((next: ActiveGameState) => {
    setActiveGame(next);
    saveActiveGame(next);
  }, []);

  const handleRestartPuzzle = useCallback(() => {
    if (!activeGame) return;
    startPuzzleGame(activeGame.puzzle, activeGame.solution, activeGame.difficulty, activeGame.mode, {
      isDaily: activeGame.isDaily,
      dailyDate: activeGame.dailyDate,
      challengeId: activeGame.challengeId,
      challengeTitle: activeGame.challengeTitle,
    });
  }, [activeGame, startPuzzleGame]);

  const handleCompleteGame = useCallback(
    (finalGame: ActiveGameState, won: boolean) => {
      const score = calculateGameScore({
        difficulty: finalGame.difficulty,
        mode: finalGame.mode,
        elapsedSeconds: finalGame.elapsedSeconds,
        mistakes: finalGame.mistakes,
        hintsUsed: finalGame.hintsUsed,
        won,
      });

      const accuracy = calculateAccuracy(
        finalGame.puzzle,
        finalGame.mistakes,
        finalGame.hintsUsed
      );

      let nextProfile = won ? updateStreakOnWin(profile) : { ...profile };
      const xpFromGame = calculateXpEarned({
        difficulty: finalGame.difficulty,
        mode: finalGame.mode,
        mistakes: finalGame.mistakes,
        hintsUsed: finalGame.hintsUsed,
        isDaily: finalGame.isDaily,
        won,
        currentStreak: nextProfile.currentStreak,
      });

      const record: GameRecord = {
        id: finalGame.id,
        difficulty: finalGame.difficulty,
        mode: finalGame.mode,
        won,
        elapsedSeconds: finalGame.elapsedSeconds,
        score,
        mistakes: finalGame.mistakes,
        hintsUsed: finalGame.hintsUsed,
        accuracy,
        xpEarned: xpFromGame,
        completedAt: Date.now(),
        isDaily: finalGame.isDaily,
        dailyDate: finalGame.dailyDate,
        puzzleString: exportPuzzleString(finalGame.puzzle),
        solutionString: exportPuzzleString(finalGame.solution),
        finalGridString: exportPuzzleString(finalGame.grid),
      };

      const nextRecords = appendGameRecord(record);
      setRecords(nextRecords);

      let missionBonusXp = 0;
      if (won) {
        const missionUpdate = updateDailyMissionsOnWin(missionsState.missions, record);
        missionBonusXp = missionUpdate.bonusXp;
        setMissionsState({ date: missionsState.date, missions: missionUpdate.nextMissions });
        saveDailyMissions(missionsState.date, missionUpdate.nextMissions);

        if (finalGame.isDaily && finalGame.dailyDate) {
          const nextDaily = saveDailyCompletion({
            date: finalGame.dailyDate,
            completedAt: Date.now(),
            elapsedSeconds: finalGame.elapsedSeconds,
            score,
            mistakes: finalGame.mistakes,
            hintsUsed: finalGame.hintsUsed,
            difficulty: finalGame.difficulty,
          });
          setDailyCompletions(nextDaily);
        }

        const nextLeaderboard = recordLocalLeaderboardScore({
          id: record.id,
          name: nextProfile.username,
          avatarId: nextProfile.avatarId,
          score,
          timeSeconds: finalGame.elapsedSeconds,
          difficulty: finalGame.difficulty,
          accuracy,
          date: getDailyDateString(),
          isCurrentUser: true,
        });
        setLeaderboard(nextLeaderboard);
      }

      const newlyUnlocked = won ? evaluateNewAchievements(nextProfile, nextRecords, record) : [];
      const achBonusXp = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);
      const prevLevel = getLevelFromXp(profile.xp).level;
      const totalAddedXp = xpFromGame + missionBonusXp + achBonusXp;

      nextProfile = savePlayerProfile({
        ...nextProfile,
        xp: nextProfile.xp + totalAddedXp,
        unlockedAchievements: [
          ...nextProfile.unlockedAchievements,
          ...newlyUnlocked.map((a) => a.id),
        ],
      });
      setProfile(nextProfile);

      // Clear active saved game once finished
      setActiveGame(null);
      saveActiveGame(null);

      if (won) {
        soundManager.play('puzzleCompleted');
        if (newlyUnlocked.length > 0) {
          window.setTimeout(() => soundManager.play('achievementUnlocked'), 450);
        }
        if (nextProfile.level > prevLevel) {
          window.setTimeout(() => soundManager.play('levelUp'), 800);
        }
        if (finalGame.isDaily) {
          window.setTimeout(() => soundManager.play('dailyStreak'), 1100);
        }
        setVictoryContext({
          record: { ...record, xpEarned: totalAddedXp },
          newlyUnlocked,
        });
        setCurrentView('victory');
      } else {
        setCurrentView('home');
        setActiveTab('home');
      }
    },
    [missionsState, profile]
  );

  const handleNavigate = useCallback((tab: NavigationTab) => {
    soundManager.play('buttonClick');
    setActiveTab(tab);
    setCurrentView(tab === 'play' ? 'play' : tab);
  }, []);

  const handleUpdateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleUpdateProfile = useCallback((partial: Partial<PlayerProfile>) => {
    setProfile((prev) => savePlayerProfile({ ...prev, ...partial }));
  }, []);

  const handleReplayPuzzle = useCallback(
    (rec: GameRecord) => {
      const puz = parsePuzzleString(rec.puzzleString);
      const sol = parsePuzzleString(rec.solutionString);
      if (!puz || !sol) return;
      startPuzzleGame(puz, sol, rec.difficulty, rec.mode);
    },
    [startPuzzleGame]
  );

  const handleResetAllData = useCallback(() => {
    localStorage.clear();
    setProfile(DEFAULT_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    setRecords([]);
    setDailyCompletions([]);
    setActiveGame(null);
    setMissionsState(loadDailyMissions());
    setLeaderboard(loadLocalLeaderboard());
    setCurrentView('home');
    setActiveTab('home');
  }, []);

  const stats = useMemo(
    () => computeStatistics(records, profile, 'all'),
    [records, profile]
  );

  return (
    <AppShell
      activeTab={activeTab}
      currentView={currentView}
      onNavigate={handleNavigate}
      onQuickStart={() => handleStartNewGame(activeGame?.difficulty ?? 'medium', 'classic')}
    >
      {currentView === 'home' && (
        <HomeScreen
          profile={profile}
          activeGame={activeGame}
          dailyCompletions={dailyCompletions}
          missions={missionsState.missions}
          stats={stats}
          onStartQuickGame={(diff, mode) => handleStartNewGame(diff, mode ?? 'classic')}
          onContinueGame={handleContinueGame}
          onStartDaily={handleStartDaily}
          onNavigate={handleNavigate}
          onOpenFriendsChallenge={() => {
            setChallengesSubTab('friends');
            setActiveTab('challenges');
            setCurrentView('challenges');
          }}
          onOpenOnboarding={() => setShowOnboarding(true)}
        />
      )}

      {currentView === 'play' && (
        <DifficultySelector
          stats={stats}
          onSelectDifficulty={(diff, mode, remix) => handleStartNewGame(diff, mode, remix)}
        />
      )}

      {currentView === 'game' && activeGame && (
        <GameScreen
          game={activeGame}
          settings={settings}
          profile={profile}
          onUpdateGame={handleUpdateGame}
          onUpdateSettings={handleUpdateSettings}
          onCompleteGame={handleCompleteGame}
          onRestartPuzzle={handleRestartPuzzle}
          onExitGame={() => {
            setCurrentView('home');
            setActiveTab('home');
          }}
        />
      )}

      {currentView === 'victory' && victoryContext && (
        <VictoryScreen
          record={victoryContext.record}
          profile={profile}
          newlyUnlocked={victoryContext.newlyUnlocked}
          reducedMotion={settings.reducedMotion}
          onNextPuzzle={() =>
            handleStartNewGame(victoryContext.record.difficulty, victoryContext.record.mode)
          }
          onPlayAgain={() => handleReplayPuzzle(victoryContext.record)}
          onViewStats={() => {
            setActiveTab('stats');
            setCurrentView('stats');
          }}
          onHome={() => {
            setActiveTab('home');
            setCurrentView('home');
          }}
        />
      )}

      {currentView === 'challenges' && (
        <ChallengesScreen
          key={challengesSubTab}
          profile={profile}
          dailyCompletions={dailyCompletions}
          leaderboard={leaderboard}
          initialSubTab={challengesSubTab}
          onStartDaily={handleStartDaily}
          onStartCustomOrChallenge={(puzzle, solution, difficulty, title, challengeId) =>
            startPuzzleGame(puzzle, solution, difficulty, 'classic', {
              challengeTitle: title,
              challengeId,
            })
          }
        />
      )}

      {currentView === 'stats' && (
        <StatisticsDashboard
          records={records}
          profile={profile}
          onStartQuickGame={() => handleStartNewGame('easy', 'classic')}
          onReplayPuzzle={handleReplayPuzzle}
        />
      )}

      {currentView === 'profile' && (
        <ProfileScreen
          profile={profile}
          settings={settings}
          onUpdateProfile={handleUpdateProfile}
          onUpdateSettings={handleUpdateSettings}
          onReplayOnboarding={() => setShowOnboarding(true)}
          onResetAllData={handleResetAllData}
        />
      )}

      <OnboardingModal
        open={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          if (!settings.hasCompletedOnboarding) {
            handleUpdateSettings({ hasCompletedOnboarding: true });
          }
        }}
      />
    </AppShell>
  );
}
