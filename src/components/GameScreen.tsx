import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  EyeOff,
  Lightbulb,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { calculateAccuracy, calculateGameScore, formatDuration } from '../engine/progression';
import {
  DIFFICULTY_CONFIGS,
  eliminatePeerNotes,
  getDuplicateIndices,
  getRemainingCounts,
  getSmartHint,
  isBoardCompleteAndValid,
} from '../engine/sudokuEngine';
import type {
  ActiveGameState,
  MoveHistoryEntry,
  PlayerProfile,
  SmartHintData,
  UserSettings,
} from '../types/sudoku';
import { GameToolbar } from './GameToolbar';
import { NumberPad } from './NumberPad';
import { SudokuBoard } from './SudokuBoard';

interface GameScreenProps {
  game: ActiveGameState;
  settings: UserSettings;
  profile: PlayerProfile;
  onUpdateGame: (next: ActiveGameState) => void;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onCompleteGame: (finalGame: ActiveGameState, won: boolean) => void;
  onRestartPuzzle: () => void;
  onExitGame: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  game,
  settings,
  profile,
  onUpdateGame,
  onUpdateSettings,
  onCompleteGame,
  onRestartPuzzle,
  onExitGame,
}) => {
  const [selectedCell, setSelectedCell] = useState<number | null>(() => {
    const firstEmpty = game.grid.findIndex((v) => v === 0);
    return firstEmpty >= 0 ? firstEmpty : 0;
  });
  const [notesMode, setNotesMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [focusMode, setFocusMode] = useState(game.mode === 'focus');
  const [activeHint, setActiveHint] = useState<SmartHintData | null>(null);
  const [lastEnteredCell, setLastEnteredCell] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync body state attribute for testability & game state machine hygiene
  useEffect(() => {
    if (isGameOver) {
      document.body.dataset.state = 'gameover';
    } else if (isPaused) {
      document.body.dataset.state = 'paused';
    } else {
      document.body.dataset.state = 'playing';
    }
    return () => {
      document.body.dataset.state = 'idle';
    };
  }, [isPaused, isGameOver]);

  // Game timer tick (pauses cleanly when paused or game over)
  useEffect(() => {
    if (isPaused || isGameOver) return;
    const id = window.setInterval(() => {
      onUpdateGame({
        ...game,
        elapsedSeconds: game.elapsedSeconds + 1,
        lastUpdatedAt: Date.now(),
      });
      if (game.mode === 'speed-run' && game.elapsedSeconds > 0 && game.elapsedSeconds % 60 === 0) {
        soundManager.play('countdown');
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [game, isPaused, isGameOver, onUpdateGame]);

  const remainingCounts = useMemo(() => getRemainingCounts(game.grid), [game.grid]);
  const duplicates = useMemo(() => getDuplicateIndices(game.grid), [game.grid]);

  const filledCount = useMemo(() => game.grid.filter((v) => v !== 0).length, [game.grid]);
  const progressPct = Math.round((filledCount / 81) * 100);

  const liveScore = useMemo(() => {
    const base = calculateGameScore({
      difficulty: game.difficulty,
      mode: game.mode,
      elapsedSeconds: game.elapsedSeconds,
      mistakes: game.mistakes,
      hintsUsed: game.hintsUsed,
      won: true,
    });
    return Math.round((base * filledCount) / 81);
  }, [game.difficulty, game.mode, game.elapsedSeconds, game.mistakes, game.hintsUsed, filledCount]);

  const triggerHaptic = useCallback(() => {
    if (settings.hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [settings.hapticsEnabled]);

  const handleSelectCell = useCallback((index: number) => {
    setSelectedCell(index);
    soundManager.play('cellSelect');
  }, []);

  const handleEnterNumber = useCallback(
    (num: number) => {
      if (isPaused || isGameOver || selectedCell === null) return;
      if (game.puzzle[selectedCell] !== 0) return; // cannot overwrite given cell

      soundManager.unlockFromGesture();

      if (notesMode) {
        const prevNotes = game.notes[selectedCell] ?? [];
        const hasNote = prevNotes.includes(num);
        const nextCellNotes = hasNote
          ? prevNotes.filter((n) => n !== num)
          : [...prevNotes, num].sort((a, b) => a - b);

        const nextNotes = game.notes.map((arr, idx) =>
          idx === selectedCell ? nextCellNotes : arr
        );
        const entry: MoveHistoryEntry = {
          row: Math.floor(selectedCell / 9),
          col: selectedCell % 9,
          prevValue: game.grid[selectedCell],
          nextValue: game.grid[selectedCell],
          prevNotes,
          nextNotes: nextCellNotes,
          affectedPeerNotes: [],
        };

        soundManager.play('notesToggle');
        onUpdateGame({
          ...game,
          notes: nextNotes,
          undoStack: [...game.undoStack, entry],
          redoStack: [],
          lastUpdatedAt: Date.now(),
        });
        return;
      }

      const prevValue = game.grid[selectedCell];
      if (prevValue === num) return;

      const isCorrect = num === game.solution[selectedCell];
      const nextGrid = [...game.grid];
      nextGrid[selectedCell] = num;

      let nextNotes = game.notes.map((arr, idx) => (idx === selectedCell ? [] : [...arr]));
      let affectedPeerNotes: MoveHistoryEntry['affectedPeerNotes'] = [];

      if (settings.autoRemoveNotes && isCorrect) {
        const res = eliminatePeerNotes(nextNotes, selectedCell, num);
        nextNotes = res.nextNotes;
        affectedPeerNotes = res.removed;
      }

      const entry: MoveHistoryEntry = {
        row: Math.floor(selectedCell / 9),
        col: selectedCell % 9,
        prevValue,
        nextValue: num,
        prevNotes: game.notes[selectedCell] ?? [],
        nextNotes: [],
        affectedPeerNotes,
      };

      let nextMistakes = game.mistakes;
      if (!isCorrect && game.mode !== 'zen') {
        nextMistakes++;
        soundManager.play('incorrectNumber');
      } else if (isCorrect) {
        soundManager.play('correctNumber');
      } else {
        soundManager.play('numberEntry');
      }

      triggerHaptic();
      setLastEnteredCell(selectedCell);
      setActiveHint(null);

      const updated: ActiveGameState = {
        ...game,
        grid: nextGrid,
        notes: nextNotes,
        mistakes: nextMistakes,
        undoStack: [...game.undoStack, entry],
        redoStack: [],
        lastUpdatedAt: Date.now(),
      };

      // Check mistake limit defeat
      if (game.maxMistakes !== null && nextMistakes >= game.maxMistakes) {
        onUpdateGame(updated);
        setIsGameOver(true);
        soundManager.play('gameOver');
        return;
      }

      // Check valid board completion
      if (isBoardCompleteAndValid(nextGrid)) {
        onCompleteGame(updated, true);
        return;
      }

      onUpdateGame(updated);
    },
    [
      game,
      isGameOver,
      isPaused,
      notesMode,
      onCompleteGame,
      onUpdateGame,
      selectedCell,
      settings.autoRemoveNotes,
      triggerHaptic,
    ]
  );

  const handleErase = useCallback(() => {
    if (isPaused || isGameOver || selectedCell === null) return;
    if (game.puzzle[selectedCell] !== 0) return;

    const prevValue = game.grid[selectedCell];
    const prevNotes = game.notes[selectedCell] ?? [];
    if (prevValue === 0 && prevNotes.length === 0) return;

    const nextGrid = [...game.grid];
    nextGrid[selectedCell] = 0;
    const nextNotes = game.notes.map((arr, idx) => (idx === selectedCell ? [] : arr));

    const entry: MoveHistoryEntry = {
      row: Math.floor(selectedCell / 9),
      col: selectedCell % 9,
      prevValue,
      nextValue: 0,
      prevNotes,
      nextNotes: [],
      affectedPeerNotes: [],
    };

    soundManager.play('erase');
    onUpdateGame({
      ...game,
      grid: nextGrid,
      notes: nextNotes,
      undoStack: [...game.undoStack, entry],
      redoStack: [],
      lastUpdatedAt: Date.now(),
    });
  }, [game, isGameOver, isPaused, onUpdateGame, selectedCell]);

  const handleUndo = useCallback(() => {
    if (isPaused || isGameOver || game.undoStack.length === 0) return;
    const last = game.undoStack[game.undoStack.length - 1];
    const idx = last.row * 9 + last.col;

    const nextGrid = [...game.grid];
    nextGrid[idx] = last.prevValue;

    const nextNotes = game.notes.map((arr) => [...arr]);
    nextNotes[idx] = [...last.prevNotes];
    for (const p of last.affectedPeerNotes) {
      const pIdx = p.row * 9 + p.col;
      if (!nextNotes[pIdx].includes(p.removedNote)) {
        nextNotes[pIdx] = [...nextNotes[pIdx], p.removedNote].sort((a, b) => a - b);
      }
    }

    soundManager.play('undo');
    setSelectedCell(idx);
    onUpdateGame({
      ...game,
      grid: nextGrid,
      notes: nextNotes,
      undoStack: game.undoStack.slice(0, -1),
      redoStack: [...game.redoStack, last],
      lastUpdatedAt: Date.now(),
    });
  }, [game, isGameOver, isPaused, onUpdateGame]);

  const handleRedo = useCallback(() => {
    if (isPaused || isGameOver || game.redoStack.length === 0) return;
    const nextMove = game.redoStack[game.redoStack.length - 1];
    const idx = nextMove.row * 9 + nextMove.col;

    const nextGrid = [...game.grid];
    nextGrid[idx] = nextMove.nextValue;

    const nextNotes = game.notes.map((arr) => [...arr]);
    nextNotes[idx] = [...nextMove.nextNotes];
    for (const p of nextMove.affectedPeerNotes) {
      const pIdx = p.row * 9 + p.col;
      nextNotes[pIdx] = nextNotes[pIdx].filter((n) => n !== p.removedNote);
    }

    soundManager.play('numberEntry');
    setSelectedCell(idx);
    onUpdateGame({
      ...game,
      grid: nextGrid,
      notes: nextNotes,
      undoStack: [...game.undoStack, nextMove],
      redoStack: game.redoStack.slice(0, -1),
      lastUpdatedAt: Date.now(),
    });
  }, [game, isGameOver, isPaused, onUpdateGame]);

  const handleSmartHint = useCallback(() => {
    if (isPaused || isGameOver) return;
    soundManager.play('hint');

    if (!activeHint) {
      const computed = getSmartHint(game.grid, game.solution);
      if (!computed) return;
      setActiveHint({ ...computed, stage: 1 });
      return;
    }

    if (activeHint.stage < 4) {
      const nextStage = (activeHint.stage + 1) as 2 | 3 | 4;
      setActiveHint({ ...activeHint, stage: nextStage });
      if (nextStage === 3) {
        setSelectedCell(activeHint.row * 9 + activeHint.col);
      }
      if (nextStage === 4) {
        const targetIdx = activeHint.row * 9 + activeHint.col;
        const nextGrid = [...game.grid];
        nextGrid[targetIdx] = activeHint.value;
        const { nextNotes } = eliminatePeerNotes(game.notes, targetIdx, activeHint.value);
        nextNotes[targetIdx] = [];

        const updated: ActiveGameState = {
          ...game,
          grid: nextGrid,
          notes: nextNotes,
          hintsUsed: game.hintsUsed + 1,
          hintedCells: [...game.hintedCells, targetIdx],
          lastUpdatedAt: Date.now(),
        };
        setSelectedCell(targetIdx);
        setLastEnteredCell(targetIdx);
        setActiveHint(null);

        if (isBoardCompleteAndValid(nextGrid)) {
          onCompleteGame(updated, true);
        } else {
          onUpdateGame(updated);
        }
      }
    }
  }, [activeHint, game, isGameOver, isPaused, onCompleteGame, onUpdateGame]);

  // Keyboard shortcuts for desktop play
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (!isGameOver) {
          setIsPaused((p) => !p);
        }
        return;
      }

      if (isPaused || isGameOver) return;

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleEnterNumber(Number(e.key));
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        handleErase();
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNotesMode((m) => !m);
        soundManager.play('notesToggle');
        return;
      }

      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        handleSmartHint();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (selectedCell !== null) {
        const r = Math.floor(selectedCell / 9);
        const c = selectedCell % 9;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCell(((r + 8) % 9) * 9 + c);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCell(((r + 1) % 9) * 9 + c);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedCell(r * 9 + ((c + 8) % 9));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedCell(r * 9 + ((c + 1) % 9));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleErase,
    handleRedo,
    handleSmartHint,
    handleUndo,
    handleEnterNumber,
    isGameOver,
    isPaused,
    selectedCell,
  ]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore if fullscreen is restricted in iframe
    }
  };

  const diffLabel = DIFFICULTY_CONFIGS[game.difficulty].label;
  const activeNumber = selectedCell !== null && game.grid[selectedCell] !== 0 ? game.grid[selectedCell] : null;
  const accuracy = calculateAccuracy(game.puzzle, game.mistakes, game.hintsUsed);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--nx-bg)] px-3 sm:px-6 py-3 sm:py-5">
      {/* Compact Game Header */}
      <header className="w-full max-w-[980px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExitGame}
            aria-label="Back to dashboard"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] flex items-center justify-center text-[#18233D] dark:text-white hover:border-[#087BFF] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="text-sm sm:text-base font-extrabold text-[#18233D] dark:text-white leading-tight">
              {game.challengeTitle || (game.isDaily ? 'Daily Challenge' : `${diffLabel} Sudoku`)}
            </div>
            <div className="text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
              {diffLabel} · {game.mode.replace('-', ' ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {focusMode && (
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#087BFF] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Exit Focus</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            aria-label={settings.soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] flex items-center justify-center text-[#5C6C8F] dark:text-[#93A7CE] hover:text-[#087BFF] cursor-pointer"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="hidden sm:flex min-h-[44px] min-w-[44px] rounded-xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] items-center justify-center text-[#5C6C8F] dark:text-[#93A7CE] hover:text-[#087BFF] cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsPaused(true)}
            aria-label="Pause game"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] flex items-center justify-center text-[#18233D] dark:text-white hover:border-[#087BFF] cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Live Telemetry Strip */}
      <div className="w-full max-w-[490px] mx-auto mt-3 mb-3 space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm px-1">
          <div className="flex items-center gap-3 sm:gap-5">
            <div>
              <span className="text-[#5C6C8F] dark:text-[#93A7CE] mr-1">Mistakes</span>
              <strong
                data-testid="mistakes-counter"
                className={`font-mono-tabular ${
                  game.mistakes > 0 ? 'text-[#FF5263]' : 'text-[#18233D] dark:text-white'
                }`}
              >
                {game.maxMistakes !== null ? `${game.mistakes}/${game.maxMistakes}` : game.mistakes}
              </strong>
            </div>

            {!focusMode && game.mode !== 'zen' && (
              <div>
                <span className="text-[#5C6C8F] dark:text-[#93A7CE] mr-1">Score</span>
                <strong className="font-mono-tabular text-[#18233D] dark:text-white">
                  {liveScore.toLocaleString()}
                </strong>
              </div>
            )}

            <div>
              <span className="text-[#5C6C8F] dark:text-[#93A7CE] mr-1">Done</span>
              <strong className="font-mono-tabular text-[#087BFF] dark:text-[#00C8FF]">
                {progressPct}%
              </strong>
            </div>
          </div>

          <div
            data-testid="game-timer"
            className="font-mono-tabular font-bold text-sm sm:text-base text-[#18233D] dark:text-white"
          >
            {formatDuration(game.elapsedSeconds)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-[#DCEEFF] dark:bg-[#17264A] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#087BFF] to-[#00C8FF] transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main Board & Controls */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <SudokuBoard
          grid={game.grid}
          puzzle={game.puzzle}
          solution={game.solution}
          notes={game.notes}
          selectedCell={selectedCell}
          autoCheck={settings.autoCheck}
          highlightDuplicates={settings.highlightDuplicates}
          duplicates={duplicates}
          activeHint={activeHint}
          lastEnteredCell={lastEnteredCell}
          boardStyle={profile.equippedBoardStyle}
          numberStyle={profile.equippedNumberStyle}
          gridThickness={settings.gridThickness}
          onSelectCell={handleSelectCell}
        />

        {/* Progressive 4-Stage Smart Hint Coach Panel */}
        {activeHint && (
          <div
            role="region"
            aria-label="Smart Hint Coach"
            className="w-full max-w-[490px] rounded-2xl bg-[var(--nx-surface)] border border-[#00C8FF] p-4 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#087BFF] dark:text-[#00C8FF]">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>Smart Hint · Stage {activeHint.stage} of 4</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveHint(null)}
                aria-label="Dismiss hint"
                className="text-[#5C6C8F] hover:text-[#18233D] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 text-sm text-[#18233D] dark:text-[#F1F5FF]">
              {activeHint.stage === 1 && (
                <p>
                  Inspect the highlighted{' '}
                  <strong>
                    {activeHint.regionType === 'box'
                      ? `3×3 Box ${activeHint.regionIndex + 1}`
                      : activeHint.regionType === 'row'
                        ? `Row ${activeHint.regionIndex + 1}`
                        : `Column ${activeHint.regionIndex + 1}`}
                  </strong>
                  . A forced move exists inside this region.
                </p>
              )}
              {activeHint.stage === 2 && (
                <div>
                  <p className="font-bold text-[#087BFF] dark:text-[#00C8FF]">
                    Technique: {activeHint.technique}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#5C6C8F] dark:text-[#93A7CE]">
                    {activeHint.explanation}
                  </p>
                </div>
              )}
              {activeHint.stage === 3 && (
                <div>
                  <p className="font-bold">
                    Target Cell: R{activeHint.row + 1}C{activeHint.col + 1}
                  </p>
                  <p className="mt-1 text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                    Remaining candidate(s):{' '}
                    <strong className="font-mono-tabular text-[#18233D] dark:text-white">
                      {activeHint.candidates.join(', ')}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSmartHint}
                className="min-h-[38px] rounded-xl bg-[#087BFF] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#066AE0] cursor-pointer"
              >
                {activeHint.stage === 1
                  ? 'Reveal Technique (Stage 2)'
                  : activeHint.stage === 2
                    ? 'Show Candidates (Stage 3)'
                    : 'Reveal & Fill Answer (Stage 4)'}
              </button>
            </div>
          </div>
        )}

        <GameToolbar
          notesMode={notesMode}
          canUndo={game.undoStack.length > 0}
          canRedo={game.redoStack.length > 0}
          autoCheck={settings.autoCheck}
          highlightDuplicates={settings.highlightDuplicates}
          highlightRemaining={settings.highlightRemaining}
          focusMode={focusMode}
          onToggleNotes={() => {
            setNotesMode((m) => !m);
            soundManager.play('notesToggle');
          }}
          onErase={handleErase}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onHint={handleSmartHint}
          onToggleAutoCheck={() => onUpdateSettings({ autoCheck: !settings.autoCheck })}
          onToggleDuplicates={() =>
            onUpdateSettings({ highlightDuplicates: !settings.highlightDuplicates })
          }
          onToggleRemaining={() =>
            onUpdateSettings({ highlightRemaining: !settings.highlightRemaining })
          }
          onToggleFocus={() => setFocusMode((f) => !f)}
        />

        <NumberPad
          remainingCounts={remainingCounts}
          highlightRemaining={settings.highlightRemaining}
          notesMode={notesMode}
          activeNumber={activeNumber}
          onNumberPress={handleEnterNumber}
        />
      </div>

      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1120]/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
            className="w-full max-w-sm rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-2xl text-center"
          >
            <h2
              id="pause-modal-title"
              className="text-2xl font-extrabold text-[#18233D] dark:text-white"
            >
              Game Paused
            </h2>
            <p className="mt-1 text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
              {diffLabel} · {formatDuration(game.elapsedSeconds)} elapsed · {progressPct}% complete
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="min-h-[46px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#087BFF] text-white text-sm font-bold hover:bg-[#066AE0] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Game</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPaused(false);
                  onRestartPuzzle();
                }}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E4F7] dark:border-[#233761] text-sm font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart Board</span>
              </button>

              <button
                type="button"
                onClick={onExitGame}
                className="min-h-[44px] w-full rounded-xl text-sm font-semibold text-[#5C6C8F] dark:text-[#93A7CE] hover:text-[#18233D] dark:hover:text-white cursor-pointer"
              >
                Save & Exit to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal (Mistake Limit Reached) */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1120]/75 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gameover-modal-title"
            className="w-full max-w-sm rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-2xl text-center"
          >
            <h2
              id="gameover-modal-title"
              className="text-2xl font-extrabold text-[#FF5263]"
            >
              Out of Mistakes
            </h2>
            <p className="mt-1.5 text-sm text-[#5C6C8F] dark:text-[#93A7CE]">
              {game.mode === 'mistake-free'
                ? 'Mistake-Free Challenge ended on the first incorrect digit.'
                : `You reached ${game.mistakes} mistakes at ${progressPct}% completion.`}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A] p-2.5">
                <div className="text-[#5C6C8F] dark:text-[#93A7CE]">Time</div>
                <div className="font-mono-tabular font-bold text-[#18233D] dark:text-white mt-0.5">
                  {formatDuration(game.elapsedSeconds)}
                </div>
              </div>
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A] p-2.5">
                <div className="text-[#5C6C8F] dark:text-[#93A7CE]">Progress</div>
                <div className="font-mono-tabular font-bold text-[#18233D] dark:text-white mt-0.5">
                  {progressPct}%
                </div>
              </div>
              <div className="rounded-xl bg-[#F5F8FF] dark:bg-[#17264A] p-2.5">
                <div className="text-[#5C6C8F] dark:text-[#93A7CE]">Accuracy</div>
                <div className="font-mono-tabular font-bold text-[#18233D] dark:text-white mt-0.5">
                  {accuracy}%
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                data-start="true"
                onClick={() => {
                  setIsGameOver(false);
                  onRestartPuzzle();
                }}
                className="min-h-[46px] w-full rounded-xl bg-[#087BFF] text-white text-sm font-bold hover:bg-[#066AE0] cursor-pointer"
              >
                Try Same Puzzle Again
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsGameOver(false);
                  onUpdateGame({
                    ...game,
                    mode: 'zen',
                    maxMistakes: null,
                  });
                }}
                className="min-h-[44px] w-full rounded-xl border border-[#D9E4F7] dark:border-[#233761] text-sm font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
              >
                Continue in Zen Mode
              </button>

              <button
                type="button"
                onClick={() => onCompleteGame(game, false)}
                className="min-h-[44px] w-full rounded-xl text-sm font-semibold text-[#5C6C8F] dark:text-[#93A7CE] hover:text-[#18233D] dark:hover:text-white cursor-pointer"
              >
                Exit to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
