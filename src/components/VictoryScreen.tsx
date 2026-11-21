import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BarChart3,
  Check,
  Copy,
  Download,
  Home,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { formatDuration, getLevelFromXp } from '../engine/progression';
import { DIFFICULTY_CONFIGS } from '../engine/sudokuEngine';
import type { AchievementDef, GameRecord, PlayerProfile } from '../types/sudoku';

interface VictoryScreenProps {
  record: GameRecord;
  profile: PlayerProfile;
  newlyUnlocked: AchievementDef[];
  reducedMotion: boolean;
  onNextPuzzle: () => void;
  onPlayAgain: () => void;
  onViewStats: () => void;
  onHome: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  record,
  profile,
  newlyUnlocked,
  reducedMotion,
  onNextPuzzle,
  onPlayAgain,
  onViewStats,
  onHome,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const levelInfo = getLevelFromXp(profile.xp);
  const diffLabel = DIFFICULTY_CONFIGS[record.difficulty].label;
  const completedGrid = record.finalGridString.split('').map(Number);
  const givenGrid = record.puzzleString.split('').map(Number);

  // Subtle celebratory confetti burst on mount
  useEffect(() => {
    if (reducedMotion || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#087BFF', '#00C8FF', '#16C784', '#F59E0B', '#FFFFFF'];
    const pieces = Array.from({ length: 64 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 140,
      vx: (Math.random() - 0.5) * 3,
      vy: 2.2 + Math.random() * 3.5,
      size: 5 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.14,
    }));

    let rafId = 0;
    let frames = 0;
    const render = () => {
      frames++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y < canvas.height + 20) active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frames / 160);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }
      if (active && frames < 165) {
        rafId = window.requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    rafId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(rafId);
  }, [reducedMotion]);

  const shareSummary = `SUDOKU NEXUS · ${diffLabel} (${record.mode})\nTime: ${formatDuration(
    record.elapsedSeconds
  )} · Score: ${record.score.toLocaleString()} · Accuracy: ${record.accuracy}%\nMistakes: ${
    record.mistakes
  } · Hints: ${record.hintsUsed}\nThink Different. Play Smarter.`;

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareSummary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadCard = () => {
    const c = document.createElement('canvas');
    c.width = 900;
    c.height = 520;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#17264A';
    ctx.fillRect(0, 0, 900, 520);

    ctx.fillStyle = '#087BFF';
    ctx.fillRect(48, 48, 804, 8);

    ctx.fillStyle = '#00C8FF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SUDOKU NEXUS · VERIFIED COMPLETION', 48, 102);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('YOU DID IT!', 48, 168);

    ctx.fillStyle = '#C7D6F5';
    ctx.font = '24px sans-serif';
    ctx.fillText(`${diffLabel} · ${record.mode.toUpperCase()}`, 48, 212);

    const statsItems = [
      ['TIME', formatDuration(record.elapsedSeconds)],
      ['SCORE', record.score.toLocaleString()],
      ['ACCURACY', `${record.accuracy}%`],
      ['XP EARNED', `+${record.xpEarned}`],
    ];
    statsItems.forEach(([label, val], idx) => {
      const x = 48 + idx * 145;
      ctx.fillStyle = '#1F3463';
      ctx.fillRect(x, 260, 130, 96);
      ctx.fillStyle = '#93A7CE';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(label, x + 16, 290);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(val, x + 16, 332);
    });

    ctx.fillStyle = '#93A7CE';
    ctx.font = '18px sans-serif';
    ctx.fillText('Think Different. Play Smarter.', 48, 462);

    // Mini completed 9x9 grid on the right
    const gx = 640;
    const gy = 135;
    const cell = 24;
    ctx.fillStyle = '#0B1221';
    ctx.fillRect(gx, gy, cell * 9, cell * 9);
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9);
      const col = i % 9;
      ctx.strokeStyle = '#233761';
      ctx.strokeRect(gx + col * cell, gy + r * cell, cell, cell);
      ctx.fillStyle = givenGrid[i] !== 0 ? '#FFFFFF' : '#00C8FF';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(String(completedGrid[i] || ''), gx + col * cell + 8, gy + r * cell + 17);
    }

    const link = document.createElement('a');
    link.download = `sudoku-nexus-${record.difficulty}.png`;
    link.href = c.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--nx-bg)]">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-40"
      />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 sm:p-10 shadow-xl">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16C784]/15 text-[#16C784]">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#18233D] dark:text-white">
            YOU DID IT!
          </h1>
          <p className="mt-1.5 text-base text-[#5C6C8F] dark:text-[#93A7CE]">
            Another puzzle conquered · {diffLabel} ({record.mode.replace('-', ' ')})
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Completed Sudoku Visual */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div
              aria-label="Completed Sudoku board snapshot"
              className="w-52 h-52 grid grid-cols-9 border-2 border-[#17264A] dark:border-[#3A5A9C] rounded-xl overflow-hidden bg-[#F5F8FF] dark:bg-[#0D1730]"
            >
              {completedGrid.map((val, idx) => {
                const r = Math.floor(idx / 9);
                const c = idx % 9;
                const isGiven = givenGrid[idx] !== 0;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-center text-[11px] font-bold tabular-nums ${
                      (c + 1) % 3 === 0 && c < 8
                        ? 'border-r border-r-[#17264A]/50 dark:border-r-[#4B74C8]'
                        : 'border-r border-r-[#D9E4F7]/60 dark:border-r-[#233761]/60'
                    } ${
                      (r + 1) % 3 === 0 && r < 8
                        ? 'border-b border-b-[#17264A]/50 dark:border-b-[#4B74C8]'
                        : 'border-b border-b-[#D9E4F7]/60 dark:border-b-[#233761]/60'
                    } ${
                      isGiven
                        ? 'text-[#18233D] dark:text-white'
                        : 'text-[#087BFF] dark:text-[#00C8FF]'
                    }`}
                  >
                    {val}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="md:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A]/60 p-3.5">
                <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">Time</div>
                <div className="mt-1 text-xl font-extrabold font-mono-tabular text-[#18233D] dark:text-white">
                  {formatDuration(record.elapsedSeconds)}
                </div>
              </div>
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A]/60 p-3.5">
                <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">Score</div>
                <div className="mt-1 text-xl font-extrabold font-mono-tabular text-[#087BFF] dark:text-[#00C8FF]">
                  {record.score.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A]/60 p-3.5">
                <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">Accuracy</div>
                <div className="mt-1 text-xl font-extrabold font-mono-tabular text-[#16C784]">
                  {record.accuracy}%
                </div>
              </div>
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A]/60 p-3.5">
                <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">Mistakes</div>
                <div className="mt-1 text-lg font-bold font-mono-tabular text-[#18233D] dark:text-white">
                  {record.mistakes}
                </div>
              </div>
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A]/60 p-3.5">
                <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">Hints Used</div>
                <div className="mt-1 text-lg font-bold font-mono-tabular text-[#18233D] dark:text-white">
                  {record.hintsUsed}
                </div>
              </div>
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A]/60 p-3.5">
                <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">XP Earned</div>
                <div className="mt-1 text-lg font-bold font-mono-tabular text-[#087BFF] dark:text-[#00C8FF]">
                  +{record.xpEarned}
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div className="rounded-xl border border-[#D9E4F7] dark:border-[#233761] p-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#18233D] dark:text-white">
                  Level {levelInfo.level} Progress
                </span>
                <span className="font-mono-tabular text-[#5C6C8F] dark:text-[#93A7CE]">
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP ({levelInfo.progressPct}%)
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#EDF3FF] dark:bg-[#17264A] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#087BFF] to-[#00C8FF] transition-all duration-500"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Newly Unlocked Achievements */}
        {newlyUnlocked.length > 0 && (
          <div className="mt-6 rounded-2xl bg-[#16C784]/10 border border-[#16C784]/30 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#119E68] dark:text-[#16C784]">
              <Award className="w-4 h-4" />
              <span>New Achievement{newlyUnlocked.length > 1 ? 's' : ''} Unlocked!</span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {newlyUnlocked.map((ach) => (
                <div
                  key={ach.id}
                  className="rounded-xl bg-[var(--nx-surface)] p-3 border border-[#16C784]/25"
                >
                  <div className="font-bold text-sm text-[#18233D] dark:text-white">
                    {ach.title} · +{ach.xpReward} XP
                  </div>
                  <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                    {ach.rewardLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onNextPuzzle}
            className="col-span-2 sm:col-span-1 min-h-[46px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#087BFF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#066AE0] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Next Puzzle</span>
          </button>

          <button
            type="button"
            onClick={onPlayAgain}
            className="min-h-[46px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-3 py-2.5 text-sm font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="min-h-[46px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-3 py-2.5 text-sm font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#087BFF]" />
            <span>Share Result</span>
          </button>

          <button
            type="button"
            onClick={onViewStats}
            className="min-h-[46px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-3 py-2.5 text-sm font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistics</span>
          </button>

          <button
            type="button"
            onClick={onHome}
            className="min-h-[46px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-3 py-2.5 text-sm font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>
      </div>

      {/* Shareable Result Card Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1120]/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-card-title"
            className="w-full max-w-md rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 id="share-card-title" className="text-lg font-bold text-[#18233D] dark:text-white">
                Shareable Result Card
              </h2>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                aria-label="Close share dialog"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#5C6C8F] hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-[#17264A] text-white p-5 space-y-3">
              <div className="text-xs font-semibold text-[#00C8FF]">
                SUDOKU NEXUS · {diffLabel.toUpperCase()}
              </div>
              <div className="text-2xl font-extrabold">
                {formatDuration(record.elapsedSeconds)} · {record.score.toLocaleString()} pts
              </div>
              <div className="text-xs text-[#C7D6F5]">
                Accuracy {record.accuracy}% · Mistakes {record.mistakes} · Hints {record.hintsUsed}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => void handleCopyShare()}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#087BFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#066AE0] cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCard}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-4 py-2 text-sm font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
