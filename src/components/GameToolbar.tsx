import React from 'react';
import {
  CheckCircle2,
  CopyCheck,
  Eraser,
  Eye,
  Hash,
  Lightbulb,
  Pencil,
  Redo2,
  Undo2,
} from 'lucide-react';

interface GameToolbarProps {
  notesMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  autoCheck: boolean;
  highlightDuplicates: boolean;
  highlightRemaining: boolean;
  focusMode: boolean;
  onToggleNotes: () => void;
  onErase: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
  onToggleAutoCheck: () => void;
  onToggleDuplicates: () => void;
  onToggleRemaining: () => void;
  onToggleFocus: () => void;
}

export const GameToolbar: React.FC<GameToolbarProps> = ({
  notesMode,
  canUndo,
  canRedo,
  autoCheck,
  highlightDuplicates,
  highlightRemaining,
  focusMode,
  onToggleNotes,
  onErase,
  onUndo,
  onRedo,
  onHint,
  onToggleAutoCheck,
  onToggleDuplicates,
  onToggleRemaining,
  onToggleFocus,
}) => {
  return (
    <div className="w-full max-w-[490px] mx-auto space-y-2.5">
      {/* Primary 5-button action bar */}
      <div className="grid grid-cols-5 gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last move"
          className="min-h-[48px] rounded-xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] flex flex-col items-center justify-center gap-0.5 text-xs font-semibold text-[#18233D] dark:text-[#F1F5FF] hover:border-[#087BFF] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 className="w-4 h-4" />
          <span>Undo</span>
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo move"
          className="min-h-[48px] rounded-xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] flex flex-col items-center justify-center gap-0.5 text-xs font-semibold text-[#18233D] dark:text-[#F1F5FF] hover:border-[#087BFF] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          <Redo2 className="w-4 h-4" />
          <span>Redo</span>
        </button>

        <button
          type="button"
          onClick={onErase}
          aria-label="Erase selected cell"
          className="min-h-[48px] rounded-xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] flex flex-col items-center justify-center gap-0.5 text-xs font-semibold text-[#18233D] dark:text-[#F1F5FF] hover:border-[#FF5263] hover:text-[#FF5263] cursor-pointer transition-colors"
        >
          <Eraser className="w-4 h-4" />
          <span>Erase</span>
        </button>

        <button
          type="button"
          onClick={onToggleNotes}
          aria-pressed={notesMode}
          aria-label={`Notes mode ${notesMode ? 'on' : 'off'}`}
          className={`min-h-[48px] rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs font-semibold cursor-pointer transition-colors ${
            notesMode
              ? 'bg-[#087BFF] text-white border-[#087BFF]'
              : 'bg-[var(--nx-surface)] border-[#D9E4F7] dark:border-[#233761] text-[#18233D] dark:text-[#F1F5FF] hover:border-[#087BFF]'
          }`}
        >
          <Pencil className="w-4 h-4" />
          <span>{notesMode ? 'Notes ON' : 'Notes'}</span>
        </button>

        <button
          type="button"
          onClick={onHint}
          aria-label="Get smart progressive hint"
          className="min-h-[48px] rounded-xl bg-[#17264A] dark:bg-[#087BFF] text-white flex flex-col items-center justify-center gap-0.5 text-xs font-semibold hover:opacity-95 cursor-pointer transition-opacity"
        >
          <Lightbulb className="w-4 h-4 text-[#00C8FF] dark:text-white" />
          <span>Hint</span>
        </button>
      </div>

      {/* Secondary assist toggles */}
      {!focusMode && (
        <div className="grid grid-cols-4 gap-1.5 text-[10.5px] sm:text-[11px] font-semibold">
          <button
            type="button"
            onClick={onToggleAutoCheck}
            aria-pressed={autoCheck}
            className={`min-h-[38px] rounded-lg border px-1.5 sm:px-2 flex items-center justify-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
              autoCheck
                ? 'bg-[#DCEEFF] dark:bg-[#19315E] border-[#087BFF]/40 text-[#087BFF] dark:text-[#00C8FF]'
                : 'bg-[var(--nx-surface)] border-[#D9E4F7] dark:border-[#233761] text-[#5C6C8F] dark:text-[#93A7CE]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Auto Check</span>
          </button>

          <button
            type="button"
            onClick={onToggleDuplicates}
            aria-pressed={highlightDuplicates}
            className={`min-h-[38px] rounded-lg border px-1.5 sm:px-2 flex items-center justify-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
              highlightDuplicates
                ? 'bg-[#DCEEFF] dark:bg-[#19315E] border-[#087BFF]/40 text-[#087BFF] dark:text-[#00C8FF]'
                : 'bg-[var(--nx-surface)] border-[#D9E4F7] dark:border-[#233761] text-[#5C6C8F] dark:text-[#93A7CE]'
            }`}
          >
            <CopyCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Duplicates</span>
          </button>

          <button
            type="button"
            onClick={onToggleRemaining}
            aria-pressed={highlightRemaining}
            className={`min-h-[38px] rounded-lg border px-1.5 sm:px-2 flex items-center justify-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
              highlightRemaining
                ? 'bg-[#DCEEFF] dark:bg-[#19315E] border-[#087BFF]/40 text-[#087BFF] dark:text-[#00C8FF]'
                : 'bg-[var(--nx-surface)] border-[#D9E4F7] dark:border-[#233761] text-[#5C6C8F] dark:text-[#93A7CE]'
            }`}
          >
            <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Remaining</span>
          </button>

          <button
            type="button"
            onClick={onToggleFocus}
            aria-pressed={focusMode}
            className="min-h-[38px] rounded-lg border border-[#D9E4F7] dark:border-[#233761] bg-[var(--nx-surface)] px-1.5 sm:px-2 flex items-center justify-center gap-1 text-[#5C6C8F] dark:text-[#93A7CE] hover:text-[#18233D] dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Focus</span>
          </button>
        </div>
      )}
    </div>
  );
};
