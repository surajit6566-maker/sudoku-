import React, { useState } from 'react';
import { Clock, Eye, Flame, Play, Shuffle, ShieldCheck, Sparkles, Wind, Zap } from 'lucide-react';
import { formatDuration } from '../engine/progression';
import { DIFFICULTY_CONFIGS } from '../engine/sudokuEngine';
import type { Difficulty, GameMode, StatisticsSummary } from '../types/sudoku';

interface DifficultySelectorProps {
  stats: StatisticsSummary;
  onSelectDifficulty: (difficulty: Difficulty, mode: GameMode, remix?: boolean) => void;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master', 'extreme'];

const GAME_MODES: Array<{
  id: GameMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Standard 3-mistake limit with score & progression.',
    icon: Sparkles,
  },
  {
    id: 'speed-run',
    label: 'Speed Run',
    description: 'Race the clock for personal time records & bonus XP.',
    icon: Zap,
  },
  {
    id: 'mistake-free',
    label: 'Mistake-Free',
    description: 'Zero tolerance: 1 wrong entry ends the run. Bonus XP.',
    icon: ShieldCheck,
  },
  {
    id: 'zen',
    label: 'Zen Mode',
    description: 'No mistake limits, no pressure, pure calm focus.',
    icon: Wind,
  },
  {
    id: 'focus',
    label: 'Smart Focus',
    description: 'Minimal distraction-free layout centered on the board.',
    icon: Eye,
  },
];

// Deterministic miniature 9x9 visual clue masks for each difficulty tier
function buildMiniPattern(clueCount: number, seedOffset: number): boolean[] {
  const cells = new Array<boolean>(81).fill(false);
  let placed = 0;
  let i = seedOffset;
  while (placed < clueCount) {
    const idx = (i * 17 + seedOffset * 7) % 81;
    if (!cells[idx]) {
      cells[idx] = true;
      placed++;
    }
    i++;
  }
  return cells;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  stats,
  onSelectDifficulty,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [animatingCard, setAnimatingCard] = useState<Difficulty | null>(null);

  const handleLaunch = (diff: Difficulty, remix = false) => {
    setAnimatingCard(diff);
    window.setTimeout(() => {
      onSelectDifficulty(diff, selectedMode, remix);
      setAnimatingCard(null);
    }, 140);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18233D] dark:text-white">
            Select Difficulty & Mode
          </h1>
          <p className="mt-1.5 text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
            Every puzzle is generated fresh and verified for a single unique solution. All six tiers are open to play.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleLaunch('medium', true)}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#17264A] dark:bg-[#087BFF] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Shuffle className="w-4 h-4 text-[#00C8FF] dark:text-white" />
          <span>Puzzle Remix</span>
        </button>
      </div>

      {/* Mode Selector Bar */}
      <section aria-label="Gameplay mode selector">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {GAME_MODES.map((m) => {
            const Icon = m.icon;
            const active = selectedMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMode(m.id)}
                aria-pressed={active}
                className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer ${
                  active
                    ? 'bg-[#087BFF] text-white border-[#087BFF] shadow-md shadow-[#087BFF]/20'
                    : 'bg-[var(--nx-surface)] text-[#18233D] dark:text-white border-[#D9E4F7] dark:border-[#233761] hover:border-[#087BFF]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#087BFF]'}`} />
                  <span className="truncate">{m.label}</span>
                </div>
                <p
                  className={`mt-1 text-xs leading-snug ${
                    active ? 'text-white/90' : 'text-[#5C6C8F] dark:text-[#93A7CE]'
                  }`}
                >
                  {m.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6 Difficulty Cards */}
      <section aria-label="Difficulty levels" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DIFFICULTY_ORDER.map((diffId, idx) => {
          const cfg = DIFFICULTY_CONFIGS[diffId];
          const diffStats = stats.difficultyBreakdown[diffId];
          const miniCells = buildMiniPattern(cfg.targetClues[0], idx + 3);
          const isLaunching = animatingCard === diffId;

          return (
            <div
              key={diffId}
              className={`rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-5 flex flex-col justify-between shadow-sm transition-transform duration-150 ${
                isLaunching ? 'scale-[0.98] ring-2 ring-[#087BFF]' : 'hover:border-[#087BFF]/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#087BFF] dark:text-[#00C8FF]">
                      <span>Tier {cfg.challengeLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{cfg.estimatedMinutes}</span>
                    </div>
                    <h2 className="mt-1 text-xl font-extrabold text-[#18233D] dark:text-white">
                      {cfg.label}
                    </h2>
                    <p className="text-sm font-medium text-[#18233D]/80 dark:text-[#D9E4F7]">
                      {cfg.tagline}
                    </p>
                  </div>

                  {/* Miniature Sudoku 9x9 Preview */}
                  <div
                    aria-hidden="true"
                    className="w-16 h-16 shrink-0 grid grid-cols-9 border border-[#17264A]/40 dark:border-[#3A5A9C] rounded-md overflow-hidden bg-[#F5F8FF] dark:bg-[#0D1730]"
                  >
                    {miniCells.map((hasClue, cIdx) => (
                      <div
                        key={cIdx}
                        className={`${
                          hasClue
                            ? 'bg-[#087BFF]/75 dark:bg-[#00C8FF]/70'
                            : 'bg-transparent'
                        } border-[0.5px] border-[#D9E4F7]/50 dark:border-[#233761]/40`}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#5C6C8F] dark:text-[#93A7CE]">
                  {cfg.description}
                </p>

                {/* Challenge Level Bars */}
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-[#5C6C8F] dark:text-[#93A7CE] font-medium">
                    Challenge Level
                  </span>
                  <div className="flex items-center gap-1" aria-label={`Difficulty ${cfg.challengeLevel} of 6`}>
                    {Array.from({ length: 6 }).map((_, barIdx) => (
                      <span
                        key={barIdx}
                        className={`h-2 w-4 rounded-sm ${
                          barIdx < cfg.challengeLevel
                            ? cfg.challengeLevel >= 5
                              ? 'bg-[#FF5263]'
                              : cfg.challengeLevel >= 3
                                ? 'bg-[#087BFF]'
                                : 'bg-[#16C784]'
                            : 'bg-[#EDF3FF] dark:bg-[#17264A]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#D9E4F7] dark:border-[#233761] flex items-center justify-between text-xs text-[#5C6C8F] dark:text-[#93A7CE] tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Best:{' '}
                    <strong className="text-[#18233D] dark:text-white">
                      {diffStats.bestTime !== null ? formatDuration(diffStats.bestTime) : '—'}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#087BFF]" />
                    {cfg.xpMultiplier}× XP · {diffStats.won} won
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLaunch(diffId, false)}
                className="mt-4 min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#087BFF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#066AE0] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play {cfg.label}</span>
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
};
