import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  Hammer,
  Play,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { SUDOKU_TECHNIQUES } from '../data/techniques';
import { formatDuration } from '../engine/progression';
import {
  countSolutions,
  DIFFICULTY_CONFIGS,
  exportPuzzleString,
  generatePuzzle,
  getDailyDateString,
  getDailyDifficultyForDate,
  parsePuzzleString,
  solveSudoku,
} from '../engine/sudokuEngine';
import type {
  ChallengePayload,
  DailyCompletion,
  Difficulty,
  LocalLeaderboardEntry,
  PlayerProfile,
} from '../types/sudoku';

interface ChallengesScreenProps {
  profile: PlayerProfile;
  dailyCompletions: DailyCompletion[];
  leaderboard: LocalLeaderboardEntry[];
  initialSubTab?: 'daily' | 'friends' | 'custom' | 'coach';
  onStartDaily: () => void;
  onStartCustomOrChallenge: (
    puzzle: number[],
    solution: number[],
    difficulty: Difficulty,
    title?: string,
    challengeId?: string
  ) => void;
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  profile,
  dailyCompletions,
  leaderboard,
  initialSubTab = 'daily',
  onStartDaily,
  onStartCustomOrChallenge,
}) => {
  const [subTab, setSubTab] = useState<'daily' | 'friends' | 'custom' | 'coach'>(initialSubTab);

  // Friends Challenge state
  const [challengeDiff, setChallengeDiff] = useState<Difficulty>('medium');
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'daily' | 'weekly'>('daily');

  // Custom Puzzle Creator state
  const [customGrid, setCustomGrid] = useState<number[]>(() => new Array(81).fill(0));
  const [selectedCustomIdx, setSelectedCustomIdx] = useState<number | null>(0);
  const [pasteInput, setPasteInput] = useState('');
  const [customStatus, setCustomStatus] = useState<{ type: 'ok' | 'err'; message: string } | null>(
    null
  );

  // Technique Coach state
  const [selectedTechId, setSelectedTechId] = useState(SUDOKU_TECHNIQUES[0].id);
  const [coachAnswer, setCoachAnswer] = useState<number | null>(null);

  const today = getDailyDateString();
  const todayDiff = getDailyDifficultyForDate(today);
  const completedDates = useMemo(
    () => new Set(dailyCompletions.map((d) => d.date)),
    [dailyCompletions]
  );

  // Build current month calendar days
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: '' });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(
        2,
        '0'
      )}`;
      cells.push({ day: d, dateStr });
    }
    return {
      monthLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      cells,
    };
  }, []);

  const handleGenerateChallengeLink = () => {
    const gen = generatePuzzle(challengeDiff);
    const payload: ChallengePayload = {
      id: `ch_${Date.now()}`,
      title: `${profile.username}'s ${DIFFICULTY_CONFIGS[challengeDiff].label} Challenge`,
      creator: profile.username,
      difficulty: challengeDiff,
      puzzleString: exportPuzzleString(gen.puzzle),
    };
    const encoded = btoa(JSON.stringify(payload));
    const url = `${window.location.origin}/?challenge=${encodeURIComponent(encoded)}`;
    setGeneratedLink(url);
    setCopiedLink(false);
  };

  const handleCopyChallenge = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleStartAsyncBattleNow = () => {
    const gen = generatePuzzle(challengeDiff);
    onStartCustomOrChallenge(
      gen.puzzle,
      gen.solution,
      challengeDiff,
      `Async Battle · ${DIFFICULTY_CONFIGS[challengeDiff].label}`,
      `battle_${Date.now()}`
    );
  };

  const handlePasteCustomPuzzle = () => {
    const parsed = parsePuzzleString(pasteInput);
    if (!parsed) {
      setCustomStatus({
        type: 'err',
        message: 'Enter exactly 81 digits (use 0 or . for empty cells).',
      });
      return;
    }
    setCustomGrid(parsed);
    setCustomStatus({ type: 'ok', message: 'Puzzle string loaded into the grid.' });
  };

  const handleValidateCustom = () => {
    const solCount = countSolutions(customGrid, 2);
    if (solCount === 0) {
      setCustomStatus({
        type: 'err',
        message: 'This puzzle has no valid solution. Check for conflicting numbers.',
      });
    } else if (solCount > 1) {
      setCustomStatus({
        type: 'err',
        message: 'Multiple solutions detected. Add more clues until the solution is unique.',
      });
    } else {
      setCustomStatus({
        type: 'ok',
        message: 'Valid puzzle with a single unique solution!',
      });
    }
  };

  const handleSolveCustom = () => {
    const solCount = countSolutions(customGrid, 2);
    if (solCount === 0) {
      setCustomStatus({ type: 'err', message: 'Cannot solve: invalid or conflicting clues.' });
      return;
    }
    const solved = solveSudoku(customGrid);
    if (solved) {
      setCustomGrid(solved);
      setCustomStatus({
        type: 'ok',
        message:
          solCount === 1
            ? 'Solved unique puzzle!'
            : 'Solved (note: puzzle had multiple valid solutions).',
      });
    }
  };

  const handlePlayCustom = () => {
    const solCount = countSolutions(customGrid, 2);
    if (solCount !== 1) {
      setCustomStatus({
        type: 'err',
        message: 'Puzzle must have exactly 1 unique solution before playing.',
      });
      return;
    }
    const solved = solveSudoku(customGrid);
    if (!solved) return;
    onStartCustomOrChallenge(customGrid, solved, 'hard', 'Custom Puzzle');
  };

  const activeTech = SUDOKU_TECHNIQUES.find((t) => t.id === selectedTechId) ?? SUDOKU_TECHNIQUES[0];

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => b.score - a.score);
  }, [leaderboard]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18233D] dark:text-white">
            Challenges, Coach & Creator
          </h1>
          <p className="mt-1 text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
            Daily puzzles, async friend challenges, custom grids, and interactive solving mastery.
          </p>
        </div>

        {/* Sub-tab segmented switcher */}
        <div
          role="tablist"
          aria-label="Challenges sections"
          className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-[#EDF3FF] dark:bg-[#17264A]"
        >
          {[
            { id: 'daily', label: 'Daily Puzzle', icon: Calendar },
            { id: 'friends', label: 'Social & Ranks', icon: Users },
            { id: 'custom', label: 'Custom Creator', icon: Hammer },
            { id: 'coach', label: 'Technique Coach', icon: BookOpen },
          ].map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSubTab(t.id as typeof subTab)}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#087BFF] text-white shadow-xs'
                    : 'text-[#5C6C8F] dark:text-[#93A7CE] hover:text-[#18233D] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: DAILY PUZZLE & CALENDAR */}
      {subTab === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#087BFF] dark:text-[#00C8FF]">
                <span>Today · {today}</span>
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Flame className="w-4 h-4" />
                  {profile.currentStreak} Day Streak
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-extrabold text-[#18233D] dark:text-white">
                {DIFFICULTY_CONFIGS[todayDiff].label} Daily Challenge
              </h2>
              <p className="mt-2 text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
                {completedDates.has(today)
                  ? 'You conquered today’s puzzle! Replay anytime or track your monthly consistency.'
                  : 'Complete today’s deterministic board to earn +110 bonus XP and lock in your daily streak.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onStartDaily}
              className="mt-6 min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#087BFF] px-5 py-3 text-sm font-bold text-white hover:bg-[#066AE0] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{completedDates.has(today) ? 'Replay Daily Puzzle' : 'Start Daily Puzzle'}</span>
            </button>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#18233D] dark:text-white">
                {calendarDays.monthLabel}
              </h3>
              <span className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] tabular-nums">
                {dailyCompletions.length} Daily Wins Total
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-[#5C6C8F] dark:text-[#93A7CE] mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.cells.map((cell, idx) => {
                if (!cell.day) return <div key={idx} />;
                const isDone = completedDates.has(cell.dateStr);
                const isToday = cell.dateStr === today;
                return (
                  <div
                    key={cell.dateStr}
                    className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums border ${
                      isDone
                        ? 'bg-[#16C784] text-white border-[#16C784]'
                        : isToday
                          ? 'border-[#087BFF] text-[#087BFF] dark:text-[#00C8FF] bg-[#DCEEFF]/40 dark:bg-[#19315E]/40'
                          : 'border-[#D9E4F7]/60 dark:border-[#233761]/60 text-[#18233D] dark:text-[#D9E4F7]'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : cell.day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FRIENDS CHALLENGE & LOCAL DEMO LEADERBOARD */}
      {subTab === 'friends' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 space-y-5 shadow-sm">
            <div>
              <h2 className="text-lg font-extrabold text-[#18233D] dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#087BFF]" />
                <span>Friends Challenge & Async Battle</span>
              </h2>
              <p className="mt-1 text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
                Generate a shareable challenge URL with the exact same puzzle seed so friends can race your time and accuracy.
              </p>
            </div>

            <div>
              <label
                htmlFor="challenge-diff-select"
                className="block text-xs font-semibold text-[#5C6C8F] dark:text-[#93A7CE] mb-1.5"
              >
                Challenge Difficulty
              </label>
              <select
                id="challenge-diff-select"
                value={challengeDiff}
                onChange={(e) => setChallengeDiff(e.target.value as Difficulty)}
                className="w-full min-h-[44px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] bg-[#F5F8FF] dark:bg-[#17264A] px-3 text-sm font-semibold text-[#18233D] dark:text-white"
              >
                {(['easy', 'medium', 'hard', 'expert', 'master', 'extreme'] as Difficulty[]).map(
                  (d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_CONFIGS[d].label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleGenerateChallengeLink}
                className="flex-1 min-h-[44px] rounded-xl bg-[#087BFF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#066AE0] cursor-pointer"
              >
                Generate Challenge Link
              </button>
              <button
                type="button"
                onClick={handleStartAsyncBattleNow}
                className="min-h-[44px] rounded-xl bg-[#17264A] dark:bg-[#19315E] px-4 py-2.5 text-sm font-semibold text-white cursor-pointer"
              >
                Play Async Battle
              </button>
            </div>

            {generatedLink && (
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A]/60 border border-[#D9E4F7] dark:border-[#233761] p-3 space-y-2">
                <div className="text-xs font-mono-tabular break-all text-[#18233D] dark:text-[#D9E4F7]">
                  {generatedLink}
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyChallenge()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087BFF] dark:text-[#00C8FF] cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Challenge URL'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#18233D] dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#087BFF]" />
                  <span>Leaderboard</span>
                </h3>
                <p className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                  Local Demo Mode · Saved on this device (connect a backend API for global multi-device sync).
                </p>
              </div>

              <div className="inline-flex p-1 rounded-lg bg-[#EDF3FF] dark:bg-[#17264A] self-start">
                {(['daily', 'weekly'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLeaderboardPeriod(p)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                      leaderboardPeriod === p
                        ? 'bg-[var(--nx-surface)] text-[#087BFF]'
                        : 'text-[#5C6C8F] dark:text-[#93A7CE]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#D9E4F7] dark:border-[#233761] text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Player</th>
                    <th className="py-2 pr-3">Tier</th>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E4F7]/60 dark:divide-[#233761]/60">
                  {sortedLeaderboard.slice(0, 8).map((row, idx) => (
                    <tr
                      key={row.id}
                      className={row.isCurrentUser ? 'bg-[#DCEEFF]/50 dark:bg-[#19315E]/40 font-semibold' : ''}
                    >
                      <td className="py-2.5 pr-3 font-mono-tabular">{idx + 1}</td>
                      <td className="py-2.5 pr-3">
                        {row.name}
                        {row.isCurrentUser ? ' (You)' : ''}
                      </td>
                      <td className="py-2.5 pr-3 capitalize text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                        {row.difficulty}
                      </td>
                      <td className="py-2.5 pr-3 font-mono-tabular">
                        {formatDuration(row.timeSeconds)}
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular font-bold text-[#087BFF] dark:text-[#00C8FF]">
                        {row.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM PUZZLE CREATOR & SOLVER */}
      {subTab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-5 shadow-sm">
            <div className="w-full max-w-[396px] mx-auto aspect-square grid grid-cols-9 border-2 border-[#17264A] dark:border-[#4B74C8] rounded-xl overflow-hidden">
              {customGrid.map((val, idx) => {
                const r = Math.floor(idx / 9);
                const c = idx % 9;
                const selected = selectedCustomIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCustomIdx(idx)}
                    aria-label={`Custom cell R${r + 1}C${c + 1}, ${val || 'empty'}`}
                    className={`aspect-square flex items-center justify-center text-base font-bold tabular-nums cursor-pointer ${
                      (c + 1) % 3 === 0 && c < 8
                        ? 'border-r-2 border-r-[#17264A] dark:border-r-[#4B74C8]'
                        : 'border-r border-r-[#D9E4F7] dark:border-r-[#233761]'
                    } ${
                      (r + 1) % 3 === 0 && r < 8
                        ? 'border-b-2 border-b-[#17264A] dark:border-b-[#4B74C8]'
                        : 'border-b border-b-[#D9E4F7] dark:border-b-[#233761]'
                    } ${
                      selected
                        ? 'bg-[#087BFF]/20 ring-2 ring-inset ring-[#087BFF]'
                        : 'bg-[var(--nx-surface)]'
                    }`}
                  >
                    {val !== 0 ? val : ''}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-10 gap-1.5 max-w-[396px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    if (selectedCustomIdx === null) return;
                    const next = [...customGrid];
                    next[selectedCustomIdx] = d;
                    setCustomGrid(next);
                  }}
                  className="min-h-[40px] rounded-lg border border-[#D9E4F7] dark:border-[#233761] bg-[#F5F8FF] dark:bg-[#17264A] text-sm font-bold hover:border-[#087BFF] cursor-pointer"
                >
                  {d === 0 ? '×' : d}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 space-y-5 shadow-sm">
            <div>
              <h2 className="text-lg font-extrabold text-[#18233D] dark:text-white">
                Custom Puzzle Creator & Solver
              </h2>
              <p className="mt-1 text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
                Enter numbers manually on the left, or paste an 81-character puzzle string below.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="paste-puzzle-input"
                className="block text-xs font-semibold text-[#5C6C8F] dark:text-[#93A7CE]"
              >
                Paste 81-char Puzzle String (0 or . for blanks)
              </label>
              <div className="flex gap-2">
                <input
                  id="paste-puzzle-input"
                  type="text"
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder="530070000600195000098000060..."
                  className="flex-1 min-h-[44px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] bg-[#F5F8FF] dark:bg-[#17264A] px-3 text-xs font-mono-tabular"
                />
                <button
                  type="button"
                  onClick={handlePasteCustomPuzzle}
                  className="min-h-[44px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-4 text-xs font-bold hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
                >
                  Load
                </button>
              </div>
            </div>

            {customStatus && (
              <div
                role="status"
                className={`rounded-xl p-3 text-xs font-semibold ${
                  customStatus.type === 'ok'
                    ? 'bg-[#16C784]/15 text-[#119E68] dark:text-[#16C784]'
                    : 'bg-[#FF5263]/15 text-[#FF5263]'
                }`}
              >
                {customStatus.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleValidateCustom}
                className="min-h-[44px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] text-sm font-semibold hover:border-[#087BFF] cursor-pointer"
              >
                Validate Puzzle
              </button>
              <button
                type="button"
                onClick={handleSolveCustom}
                className="min-h-[44px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] text-sm font-semibold hover:border-[#087BFF] cursor-pointer"
              >
                Solve Puzzle
              </button>
              <button
                type="button"
                onClick={handlePlayCustom}
                className="min-h-[44px] rounded-xl bg-[#087BFF] text-white text-sm font-bold hover:bg-[#066AE0] cursor-pointer"
              >
                Play This Board
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomGrid(new Array(81).fill(0));
                  setCustomStatus(null);
                }}
                className="min-h-[44px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] text-sm font-semibold text-[#FF5263] hover:bg-[#FF5263]/10 cursor-pointer"
              >
                Reset Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUDOKU TECHNIQUE COACH */}
      {subTab === 'coach' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2">
            {SUDOKU_TECHNIQUES.map((tech) => {
              const active = tech.id === selectedTechId;
              return (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => {
                    setSelectedTechId(tech.id);
                    setCoachAnswer(null);
                  }}
                  className={`w-full text-left rounded-xl p-3.5 border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#087BFF] text-white border-[#087BFF]'
                      : 'bg-[var(--nx-surface)] border-[#D9E4F7] dark:border-[#233761] hover:border-[#087BFF]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs opacity-80">
                    <span>{tech.level}</span>
                  </div>
                  <div className="font-bold text-sm mt-0.5">{tech.name}</div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 space-y-6 shadow-sm">
            <div>
              <div className="text-xs font-semibold text-[#087BFF] dark:text-[#00C8FF]">
                {activeTech.level} Technique
              </div>
              <h2 className="mt-1 text-2xl font-extrabold text-[#18233D] dark:text-white">
                {activeTech.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C6C8F] dark:text-[#93A7CE]">
                {activeTech.summary}
              </p>
            </div>

            {/* Interactive 9-cell unit demonstration */}
            <div className="rounded-2xl bg-[#F5F8FF] dark:bg-[#17264A]/60 border border-[#D9E4F7] dark:border-[#233761] p-4">
              <div className="text-xs font-semibold text-[#5C6C8F] dark:text-[#93A7CE] mb-3">
                Unit Pattern Breakdown
              </div>
              <div className="grid grid-cols-9 gap-1.5">
                {activeTech.demoGrid.map((cell, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg border flex items-center justify-center text-xs font-bold tabular-nums text-center p-1 ${
                      cell.highlight === 'target'
                        ? 'bg-[#087BFF] text-white border-[#087BFF]'
                        : cell.highlight === 'eliminator'
                          ? 'bg-[#DCEEFF] dark:bg-[#19315E] text-[#087BFF] dark:text-[#00C8FF] border-[#087BFF]/40'
                          : cell.highlight === 'muted'
                            ? 'bg-transparent border-dashed border-[#D9E4F7] dark:border-[#233761] text-[#5C6C8F]'
                            : 'bg-[var(--nx-surface)] border-[#D9E4F7] dark:border-[#233761] text-[#18233D] dark:text-white'
                    }`}
                  >
                    {cell.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#18233D] dark:text-white">
                How to Spot It
              </h3>
              <ol className="space-y-1.5 text-sm text-[#5C6C8F] dark:text-[#93A7CE] list-decimal list-inside">
                {activeTech.steps.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ol>
            </div>

            {/* Interactive Check */}
            <div className="rounded-2xl border border-[#D9E4F7] dark:border-[#233761] p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#18233D] dark:text-white">
                <Sparkles className="w-4 h-4 text-[#087BFF]" />
                <span>Quick Practice Check</span>
              </div>
              <p className="text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
                {activeTech.interactivePrompt}
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCoachAnswer(n)}
                    className={`min-h-[40px] min-w-[40px] rounded-xl border text-sm font-bold cursor-pointer ${
                      coachAnswer === n
                        ? n === activeTech.answerDigit
                          ? 'bg-[#16C784] text-white border-[#16C784]'
                          : 'bg-[#FF5263] text-white border-[#FF5263]'
                        : 'bg-[var(--nx-surface)] border-[#D9E4F7] dark:border-[#233761] hover:border-[#087BFF]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {coachAnswer !== null && (
                <p
                  className={`text-xs font-semibold ${
                    coachAnswer === activeTech.answerDigit
                      ? 'text-[#16C784]'
                      : 'text-[#FF5263]'
                  }`}
                >
                  {coachAnswer === activeTech.answerDigit
                    ? `Correct! ${activeTech.answerDigit} is the forced value using ${activeTech.name}.`
                    : `Not quite — recheck the highlighted candidates and try another digit.`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
