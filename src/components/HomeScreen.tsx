import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  Calendar,
  Flame,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { AVATARS, FRAMES } from '../data/themes';
import { ACHIEVEMENTS, formatDuration, getLevelFromXp } from '../engine/progression';
import { DIFFICULTY_CONFIGS, getDailyDateString, getDailyDifficultyForDate } from '../engine/sudokuEngine';
import type {
  ActiveGameState,
  DailyCompletion,
  DailyMission,
  Difficulty,
  GameMode,
  NavigationTab,
  PlayerProfile,
  StatisticsSummary,
} from '../types/sudoku';

interface HomeScreenProps {
  profile: PlayerProfile;
  activeGame: ActiveGameState | null;
  dailyCompletions: DailyCompletion[];
  missions: DailyMission[];
  stats: StatisticsSummary;
  onStartQuickGame: (difficulty: Difficulty, mode?: GameMode) => void;
  onContinueGame: () => void;
  onStartDaily: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onOpenFriendsChallenge: () => void;
  onOpenOnboarding: () => void;
}

const HERO_PREVIEW_CELLS = [
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9,
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  activeGame,
  dailyCompletions,
  missions,
  stats,
  onStartQuickGame,
  onContinueGame,
  onStartDaily,
  onNavigate,
  onOpenFriendsChallenge,
  onOpenOnboarding,
}) => {
  const [pulseIndex, setPulseIndex] = useState(40);
  const levelInfo = getLevelFromXp(profile.xp);
  const today = getDailyDateString();
  const todayDiff = getDailyDifficultyForDate(today);
  const todayDone = dailyCompletions.some((d) => d.date === today);

  const avatar = AVATARS.find((a) => a.id === profile.avatarId) ?? AVATARS[0];
  const frame = FRAMES.find((f) => f.id === profile.frameId) ?? FRAMES[0];

  const activeProgressPct = activeGame
    ? Math.round((activeGame.grid.filter((v) => v !== 0).length / 81) * 100)
    : 0;

  // Subtle ambient animation on the hero Sudoku showcase
  useEffect(() => {
    const spots = [2, 11, 20, 31, 40, 49, 60, 69, 75];
    let step = 0;
    const id = window.setInterval(() => {
      step = (step + 1) % spots.length;
      setPulseIndex(spots[step]);
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  const recentUnlocked = ACHIEVEMENTS.filter((a) =>
    profile.unlockedAchievements.includes(a.id)
  ).slice(0, 3);

  const maxWeeklyPlayed = Math.max(1, ...stats.last7Days.map((d) => d.played));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Player Identity & XP Strip */}
      <section
        aria-label="Player progression overview"
        className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            aria-label={`Open profile for ${profile.username}`}
            className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${avatar.bg} ${frame.ringClass} flex items-center justify-center text-white font-extrabold text-base shrink-0 cursor-pointer hover:scale-[1.03] transition-transform`}
          >
            {avatar.glyph}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
              <span className="font-semibold text-[#18233D] dark:text-white truncate">
                {profile.username}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums font-semibold text-[#087BFF] dark:text-[#00C8FF]">
                Level {levelInfo.level}
              </span>
              <span aria-hidden="true">·</span>
              <span>Think Different. Play Smarter.</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-44 sm:w-64 h-2 rounded-full bg-[#EDF3FF] dark:bg-[#17264A] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#087BFF] to-[#00C8FF] transition-all duration-300"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <span className="text-xs font-mono-tabular text-[#5C6C8F] dark:text-[#93A7CE] whitespace-nowrap">
                {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="font-bold tabular-nums text-[#18233D] dark:text-white leading-none">
                {profile.currentStreak} {profile.currentStreak === 1 ? 'Day' : 'Days'}
              </div>
              <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] mt-0.5">
                Daily Streak
              </div>
            </div>
          </div>
          <div className="h-8 w-px bg-[#D9E4F7] dark:bg-[#233761]" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#087BFF] shrink-0" />
            <div>
              <div className="font-bold tabular-nums text-[#18233D] dark:text-white leading-none">
                {stats.gamesWon}
              </div>
              <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] mt-0.5">
                Puzzles Won
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="hidden sm:inline-flex min-h-[40px] items-center rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-3.5 py-1.5 text-xs font-semibold text-[#5C6C8F] dark:text-[#93A7CE] hover:text-[#18233D] dark:hover:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] transition-colors whitespace-nowrap cursor-pointer"
          >
            How to Play
          </button>
        </div>
      </section>

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 rounded-3xl bg-[#17264A] text-white p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#087BFF]/25 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -left-20 -bottom-24 h-64 w-64 rounded-full bg-[#00C8FF]/15 blur-3xl pointer-events-none"
          />

          <div className="relative z-10 max-w-xl">
            <p className="text-xs font-semibold tracking-wider text-[#00C8FF]">
              SUDOKU NEXUS · NEXT-GENERATION LOGIC ARENA
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-balance">
              Your Mind. Your Rules.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#C7D6F5] max-w-lg leading-relaxed">
              One puzzle a day keeps your mind in play.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              data-start="true"
              onClick={() => onStartQuickGame('medium', 'classic')}
              className="min-h-[48px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#087BFF] px-6 py-3 text-sm font-bold text-white hover:bg-[#0094FF] active:scale-[0.98] transition-all shadow-md shadow-[#087BFF]/30 whitespace-nowrap cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START PLAYING</span>
            </button>

            {activeGame && (
              <button
                type="button"
                onClick={onContinueGame}
                className="min-h-[48px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-white/10 hover:bg-white/18 border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#00C8FF]" />
                <span>
                  Continue {DIFFICULTY_CONFIGS[activeGame.difficulty].label} ({activeProgressPct}% ·{' '}
                  {formatDuration(activeGame.elapsedSeconds)})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('play')}
              className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-[#C7D6F5] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>All 6 Difficulties</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Animated Interactive Sudoku Showcase */}
        <div className="lg:col-span-5 rounded-3xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#18233D] dark:text-white">
                Precision 9×9 Matrix
              </h2>
              <p className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                Unique-solution puzzles · Smart Hint Coach
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStartQuickGame('easy', 'classic')}
              className="text-xs font-semibold text-[#087BFF] dark:text-[#00C8FF] hover:underline whitespace-nowrap cursor-pointer"
            >
              Quick Easy
            </button>
          </div>

          <div
            aria-hidden="true"
            className="mx-auto w-full max-w-[270px] aspect-square grid grid-cols-9 border-2 border-[#17264A] dark:border-[#3A5A9C] rounded-xl overflow-hidden bg-[#F5F8FF] dark:bg-[#0D1730]"
          >
            {HERO_PREVIEW_CELLS.map((val, idx) => {
              const r = Math.floor(idx / 9);
              const c = idx % 9;
              const isFocus = idx === pulseIndex;
              const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-[#17264A]/45 dark:border-r-[#3A5A9C]' : 'border-r border-r-[#D9E4F7] dark:border-r-[#1E325C]';
              const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-[#17264A]/45 dark:border-b-[#3A5A9C]' : 'border-b border-b-[#D9E4F7] dark:border-b-[#1E325C]';
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-center text-[11px] font-bold tabular-nums transition-colors duration-300 ${borderR} ${borderB} ${
                    isFocus
                      ? 'bg-[#087BFF] text-white scale-105'
                      : val !== 0
                        ? 'text-[#18233D] dark:text-[#E2ECFF]'
                        : 'text-[#00C8FF]'
                  }`}
                >
                  {isFocus ? 5 : val !== 0 ? val : ''}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#D9E4F7] dark:border-[#233761] flex items-center justify-between text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
            <span>Easy → Extreme</span>
            <span>Speed Run · Zen · Mistake-Free</span>
          </div>
        </div>
      </section>

      {/* Primary Action Bento Row: Daily Challenge + Quick Play + Friends Challenge */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Challenge */}
        <div className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#087BFF] dark:text-[#00C8FF]">
                Daily Challenge · {today}
              </span>
              <Calendar className="w-5 h-5 text-[#087BFF]" />
            </div>
            <h3 className="mt-2 text-lg font-bold text-[#18233D] dark:text-white">
              {DIFFICULTY_CONFIGS[todayDiff].label} Daily Grid
            </h3>
            <p className="mt-1 text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
              {todayDone
                ? 'Completed today! Replay or check your calendar history.'
                : 'One curated puzzle for everyone today. Earn +110 bonus XP and extend your streak.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onStartDaily}
            className={`mt-5 min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              todayDone
                ? 'bg-[#16C784]/15 text-[#119E68] dark:text-[#16C784] hover:bg-[#16C784]/25'
                : 'bg-[#087BFF] text-white hover:bg-[#066AE0]'
            }`}
          >
            {todayDone ? 'Play Daily Again' : 'Play Daily Challenge'}
          </button>
        </div>

        {/* Quick Difficulty Picker */}
        <div className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5C6C8F] dark:text-[#93A7CE]">
                Quick Play
              </span>
              <Sparkles className="w-5 h-5 text-[#00C8FF]" />
            </div>
            <h3 className="mt-2 text-lg font-bold text-[#18233D] dark:text-white">
              Jump Into Any Tier
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard', 'expert', 'master', 'extreme'] as Difficulty[]).map(
                (diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => onStartQuickGame(diff, 'classic')}
                    className="min-h-[40px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] bg-[#F5F8FF] dark:bg-[#17264A]/60 hover:border-[#087BFF] hover:text-[#087BFF] dark:hover:text-[#00C8FF] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {DIFFICULTY_CONFIGS[diff].label}
                  </button>
                )
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('play')}
            className="mt-4 min-h-[44px] w-full rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-4 py-2 text-sm font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] transition-colors cursor-pointer"
          >
            Explore Game Modes
          </button>
        </div>

        {/* Friends Challenge & Technique Coach */}
        <div className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5C6C8F] dark:text-[#93A7CE]">
                Social & Mastery
              </span>
              <Share2 className="w-5 h-5 text-[#087BFF]" />
            </div>
            <h3 className="mt-2 text-lg font-bold text-[#18233D] dark:text-white">
              Friends Challenge
            </h3>
            <p className="mt-1 text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
              Generate a shareable puzzle link to race friends on the exact same board, or train with the Technique Coach.
            </p>
          </div>
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={onOpenFriendsChallenge}
              className="flex-1 min-h-[44px] rounded-xl bg-[#17264A] dark:bg-[#087BFF] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition-opacity cursor-pointer"
            >
              Challenge Link
            </button>
            <button
              type="button"
              onClick={() => onNavigate('challenges')}
              className="min-h-[44px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-4 py-2.5 text-sm font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] transition-colors cursor-pointer"
            >
              Coach
            </button>
          </div>
        </div>
      </section>

      {/* Daily Missions, Weekly Progress & Achievements */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Missions */}
        <div className="lg:col-span-5 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#18233D] dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-[#087BFF]" />
              <span>Daily Missions</span>
            </h3>
            <span className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] tabular-nums">
              {missions.filter((m) => m.completed).length}/{missions.length} Complete
            </span>
          </div>
          <div className="mt-4 space-y-3.5">
            {missions.map((m) => {
              const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
              return (
                <div key={m.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`font-semibold ${
                        m.completed
                          ? 'text-[#16C784]'
                          : 'text-[#18233D] dark:text-[#F1F5FF]'
                      }`}
                    >
                      {m.description}
                    </span>
                    <span className="text-xs font-mono-tabular text-[#5C6C8F] dark:text-[#93A7CE]">
                      {m.progress}/{m.target} · +{m.xpReward} XP
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#EDF3FF] dark:bg-[#17264A] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.completed ? 'bg-[#16C784]' : 'bg-[#087BFF]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="lg:col-span-4 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#18233D] dark:text-white">
              Weekly Progress
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('stats')}
              className="text-xs font-semibold text-[#087BFF] dark:text-[#00C8FF] hover:underline cursor-pointer"
            >
              Full Stats
            </button>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2 items-end h-32">
            {stats.last7Days.map((day) => {
              const barPct = day.played > 0 ? Math.max(18, Math.round((day.played / maxWeeklyPlayed) * 100)) : 8;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] font-mono-tabular text-[#5C6C8F] dark:text-[#93A7CE]">
                    {day.won > 0 ? day.won : ''}
                  </span>
                  <div
                    className={`w-full max-w-[26px] rounded-t-lg transition-all duration-300 ${
                      day.won > 0
                        ? 'bg-[#087BFF]'
                        : 'bg-[#EDF3FF] dark:bg-[#17264A]'
                    }`}
                    style={{ height: `${barPct}%` }}
                    title={`${day.label}: ${day.won} won / ${day.played} played`}
                  />
                  <span className="text-[11px] font-medium text-[#5C6C8F] dark:text-[#93A7CE]">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
            {stats.totalGames === 0
              ? 'Complete your first puzzle to start tracking your 7-day curve.'
              : `Win rate: ${stats.winRate}% · Best score: ${stats.bestScore.toLocaleString()}`}
          </p>
        </div>

        {/* Recent Achievements */}
        <div className="lg:col-span-3 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#18233D] dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#087BFF]" />
                <span>Achievements</span>
              </h3>
              <span className="text-xs font-mono-tabular text-[#5C6C8F] dark:text-[#93A7CE]">
                {profile.unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </span>
            </div>

            {recentUnlocked.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {recentUnlocked.map((ach) => (
                  <li key={ach.id} className="text-sm">
                    <div className="font-semibold text-[#18233D] dark:text-white">
                      {ach.title}
                    </div>
                    <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                      {ach.rewardLabel}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 space-y-2.5">
                <p className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                  Next milestone to unlock:
                </p>
                <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A]/60 border border-[#D9E4F7] dark:border-[#233761] p-3">
                  <div className="text-sm font-bold text-[#18233D] dark:text-white">
                    {ACHIEVEMENTS[0].title}
                  </div>
                  <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] mt-0.5">
                    {ACHIEVEMENTS[0].description}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="mt-4 min-h-[40px] w-full rounded-xl border border-[#D9E4F7] dark:border-[#233761] text-xs font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] transition-colors cursor-pointer"
          >
            View All Badges & Rewards
          </button>
        </div>
      </section>
    </div>
  );
};
