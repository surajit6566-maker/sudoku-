import React, { useMemo, useState } from 'react';
import { BarChart3, Clock, Eye, Flame, Play, Sparkles, TrendingUp, Trophy, X } from 'lucide-react';
import { computeStatistics, formatDuration } from '../engine/progression';
import { DIFFICULTY_CONFIGS } from '../engine/sudokuEngine';
import type { Difficulty, GameRecord, PlayerProfile } from '../types/sudoku';

interface StatisticsDashboardProps {
  records: GameRecord[];
  profile: PlayerProfile;
  onStartQuickGame: () => void;
  onReplayPuzzle: (record: GameRecord) => void;
}

const TIME_FILTERS: Array<{ id: 'today' | '7d' | '30d' | 'all'; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
];

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  records,
  profile,
  onStartQuickGame,
  onReplayPuzzle,
}) => {
  const [filter, setFilter] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [inspectRecord, setInspectRecord] = useState<GameRecord | null>(null);

  const stats = useMemo(
    () => computeStatistics(records, profile, filter),
    [records, profile, filter]
  );

  const maxDayPlayed = Math.max(1, ...stats.last7Days.map((d) => d.played));
  const maxDayTime = Math.max(1, ...stats.last7Days.map((d) => d.avgTime));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18233D] dark:text-white">
            Performance & Statistics
          </h1>
          <p className="mt-1 text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
            Calculated live from your real completed puzzles and solving telemetry.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div
          role="group"
          aria-label="Statistics timeframe filter"
          className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-[#EDF3FF] dark:bg-[#17264A] self-start"
        >
          {TIME_FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[var(--nx-surface)] text-[#087BFF] dark:text-[#00C8FF] shadow-xs'
                    : 'text-[#5C6C8F] dark:text-[#93A7CE] hover:text-[#18233D] dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal Improvement Insight */}
      <section className="rounded-2xl bg-[#17264A] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-[#087BFF] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#00C8FF]">Personal Insight</div>
            <p className="text-sm sm:text-base font-bold mt-0.5">
              {stats.speedImprovementPct !== null
                ? stats.speedImprovementPct >= 0
                  ? `Your solving speed improved by ${stats.speedImprovementPct}% compared to earlier sessions.`
                  : `Your average solve time shifted by ${Math.abs(
                      stats.speedImprovementPct
                    )}% as you tackled tougher grids.`
                : stats.gamesWon > 0
                  ? `You have won ${stats.gamesWon} puzzle${
                      stats.gamesWon > 1 ? 's' : ''
                    } with ${stats.winRate}% win accuracy. Complete 4+ games to unlock speed trend comparisons.`
                  : 'Complete your first puzzle to start generating personal speed and accuracy insights.'}
            </p>
          </div>
        </div>
        {stats.totalGames === 0 && (
          <button
            type="button"
            onClick={onStartQuickGame}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#087BFF] px-4 py-2 text-xs font-bold text-white hover:bg-[#066AE0] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play First Puzzle</span>
          </button>
        )}
      </section>

      {/* Primary KPI Grid */}
      <section aria-label="Core performance metrics" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Games Played', value: String(stats.totalGames), icon: BarChart3 },
          { label: 'Games Won', value: String(stats.gamesWon), icon: Trophy },
          { label: 'Win Rate', value: `${stats.winRate}%`, icon: Sparkles },
          {
            label: 'Best Time',
            value: stats.bestTimeSeconds !== null ? formatDuration(stats.bestTimeSeconds) : '—',
            icon: Clock,
          },
          { label: 'Best Score', value: stats.bestScore.toLocaleString(), icon: TrendingUp },
          { label: 'Current Streak', value: `${stats.currentStreak}d`, icon: Flame },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                <span>{kpi.label}</span>
                <Icon className="w-4 h-4 text-[#087BFF]" />
              </div>
              <div className="mt-2 text-2xl font-extrabold font-mono-tabular text-[#18233D] dark:text-white">
                {kpi.value}
              </div>
            </div>
          );
        })}
      </section>

      {/* Secondary Metrics Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Longest Streak', val: `${stats.longestStreak} days` },
          { label: 'Average Score', val: stats.averageScore.toLocaleString() },
          { label: 'Perfect Games', val: String(stats.perfectGames) },
          { label: 'Mistakes Made', val: String(stats.totalMistakes) },
          { label: 'Hints Used', val: String(stats.totalHintsUsed) },
          {
            label: 'Average Time',
            val: stats.averageTimeSeconds !== null ? formatDuration(stats.averageTimeSeconds) : '—',
          },
          { label: 'Total Time', val: formatDuration(stats.totalSolvingSeconds) },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-3.5"
          >
            <div className="text-[11px] font-medium text-[#5C6C8F] dark:text-[#93A7CE]">
              {m.label}
            </div>
            <div className="mt-1 text-base font-bold font-mono-tabular text-[#18233D] dark:text-white">
              {m.val}
            </div>
          </div>
        ))}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Activity & Solving Time */}
        <div className="lg:col-span-6 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#18233D] dark:text-white">
            7-Day Activity & Average Solve Time
          </h2>
          <p className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] mt-0.5">
            Games played vs. won each day over the past week
          </p>

          <div className="mt-6 grid grid-cols-7 gap-3 items-end h-40">
            {stats.last7Days.map((day) => {
              const playedH =
                day.played > 0 ? Math.max(16, Math.round((day.played / maxDayPlayed) * 100)) : 6;
              const timeH =
                day.avgTime > 0 ? Math.max(14, Math.round((day.avgTime / maxDayTime) * 100)) : 0;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-28">
                    <div
                      className={`w-3.5 rounded-t-md ${
                        day.played > 0 ? 'bg-[#087BFF]' : 'bg-[#EDF3FF] dark:bg-[#17264A]'
                      }`}
                      style={{ height: `${playedH}%` }}
                      title={`${day.label}: ${day.played} played, ${day.won} won`}
                    />
                    {timeH > 0 && (
                      <div
                        className="w-2.5 rounded-t-md bg-[#00C8FF]"
                        style={{ height: `${timeH}%` }}
                        title={`Avg time: ${formatDuration(day.avgTime)}`}
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-[#5C6C8F] dark:text-[#93A7CE]">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-5 text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#087BFF]" />
              Games Played
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#00C8FF]" />
              Avg Solve Time
            </span>
          </div>
        </div>

        {/* Accuracy Trend SVG Chart */}
        <div className="lg:col-span-6 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#18233D] dark:text-white">
              Accuracy Trend
            </h2>
            <p className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] mt-0.5">
              Recent completed puzzle precision (0–100%)
            </p>
          </div>

          {stats.accuracyTrend.length > 0 ? (
            <div className="mt-4">
              <svg viewBox="0 0 360 130" className="w-full h-36 overflow-visible">
                <line x1="0" y1="20" x2="360" y2="20" stroke="currentColor" className="text-[#D9E4F7] dark:text-[#233761]" strokeDasharray="4 4" />
                <line x1="0" y1="65" x2="360" y2="65" stroke="currentColor" className="text-[#D9E4F7] dark:text-[#233761]" strokeDasharray="4 4" />
                <line x1="0" y1="110" x2="360" y2="110" stroke="currentColor" className="text-[#D9E4F7] dark:text-[#233761]" />
                {stats.accuracyTrend.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#087BFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={stats.accuracyTrend
                      .map((pt, idx) => {
                        const x =
                          (idx / Math.max(1, stats.accuracyTrend.length - 1)) * 320 + 20;
                        const y = 110 - (pt.accuracy / 100) * 90;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                )}
                {stats.accuracyTrend.map((pt, idx) => {
                  const x =
                    stats.accuracyTrend.length === 1
                      ? 180
                      : (idx / (stats.accuracyTrend.length - 1)) * 320 + 20;
                  const y = 110 - (pt.accuracy / 100) * 90;
                  return (
                    <g key={pt.label}>
                      <circle cx={x} cy={y} r="5" fill="#00C8FF" stroke="#087BFF" strokeWidth="2" />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        className="fill-[#18233D] dark:fill-white text-[10px] font-bold"
                      >
                        {pt.accuracy}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
              No completed puzzles in this timeframe yet.
            </div>
          )}
        </div>
      </section>

      {/* Difficulty Distribution & Game History */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#18233D] dark:text-white">
            Difficulty Distribution
          </h2>
          <div className="mt-4 space-y-3.5">
            {(['easy', 'medium', 'hard', 'expert', 'master', 'extreme'] as Difficulty[]).map(
              (diff) => {
                const row = stats.difficultyBreakdown[diff];
                const pct =
                  stats.totalGames > 0 ? Math.round((row.played / stats.totalGames) * 100) : 0;
                return (
                  <div key={diff} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#18233D] dark:text-white">
                        {DIFFICULTY_CONFIGS[diff].label}
                      </span>
                      <span className="font-mono-tabular text-[#5C6C8F] dark:text-[#93A7CE]">
                        {row.won}/{row.played} won · Best{' '}
                        {row.bestTime !== null ? formatDuration(row.bestTime) : '—'}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EDF3FF] dark:bg-[#17264A] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#087BFF]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#18233D] dark:text-white">
              Game History & Replay
            </h2>
            <span className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] tabular-nums">
              {records.length} recorded
            </span>
          </div>

          {records.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
              Your completed and attempted boards will appear here for review or replay.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[#D9E4F7]/60 dark:divide-[#233761]/60 max-h-80 overflow-y-auto">
              {records.slice(0, 15).map((rec) => (
                <div
                  key={rec.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-bold text-[#18233D] dark:text-white flex items-center gap-2">
                      <span>{DIFFICULTY_CONFIGS[rec.difficulty].label}</span>
                      <span className="text-xs font-normal text-[#5C6C8F] dark:text-[#93A7CE]">
                        · {rec.mode.replace('-', ' ')} ·{' '}
                        <span className={rec.won ? 'text-[#16C784] font-semibold' : 'text-[#FF5263] font-semibold'}>
                          {rec.won ? 'Won' : 'Ended'}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs font-mono-tabular text-[#5C6C8F] dark:text-[#93A7CE]">
                      {formatDuration(rec.elapsedSeconds)} · {rec.score.toLocaleString()} pts ·{' '}
                      {rec.accuracy}% acc
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectRecord(rec)}
                      className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-[#D9E4F7] dark:border-[#233761] px-3 text-xs font-semibold hover:border-[#087BFF] cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onReplayPuzzle(rec)}
                      className="min-h-[36px] inline-flex items-center gap-1 rounded-lg bg-[#087BFF] px-3 text-xs font-semibold text-white hover:bg-[#066AE0] cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Replay</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Inspect Completed Board Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1120]/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspect-record-title"
            className="w-full max-w-sm rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 id="inspect-record-title" className="text-lg font-bold text-[#18233D] dark:text-white">
                {DIFFICULTY_CONFIGS[inspectRecord.difficulty].label} Snapshot
              </h3>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                aria-label="Close board snapshot"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#5C6C8F] hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 w-64 h-64 mx-auto grid grid-cols-9 border-2 border-[#17264A] dark:border-[#4B74C8] rounded-xl overflow-hidden">
              {inspectRecord.finalGridString.split('').map((ch, idx) => {
                const r = Math.floor(idx / 9);
                const c = idx % 9;
                const isGiven = inspectRecord.puzzleString[idx] !== '0';
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-center text-xs font-bold tabular-nums ${
                      (c + 1) % 3 === 0 && c < 8
                        ? 'border-r border-r-[#17264A]/50 dark:border-r-[#4B74C8]'
                        : 'border-r border-r-[#D9E4F7]/50 dark:border-r-[#233761]/50'
                    } ${
                      (r + 1) % 3 === 0 && r < 8
                        ? 'border-b border-b-[#17264A]/50 dark:border-b-[#4B74C8]'
                        : 'border-b border-b-[#D9E4F7]/50 dark:border-b-[#233761]/50'
                    } ${
                      isGiven ? 'text-[#18233D] dark:text-white' : 'text-[#087BFF] dark:text-[#00C8FF]'
                    }`}
                  >
                    {ch === '0' ? '' : ch}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                const rec = inspectRecord;
                setInspectRecord(null);
                onReplayPuzzle(rec);
              }}
              className="mt-5 min-h-[44px] w-full rounded-xl bg-[#087BFF] text-white text-sm font-bold hover:bg-[#066AE0] cursor-pointer"
            >
              Replay This Puzzle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
