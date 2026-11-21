import React from 'react';

interface NumberPadProps {
  remainingCounts: Record<number, number>;
  highlightRemaining: boolean;
  notesMode: boolean;
  activeNumber: number | null;
  onNumberPress: (num: number) => void;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  remainingCounts,
  highlightRemaining,
  notesMode,
  activeNumber,
  onNumberPress,
}) => {
  return (
    <div
      aria-label="Number pad 1 to 9"
      className="grid grid-cols-9 gap-1.5 sm:gap-2 w-full max-w-[490px] mx-auto"
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
        const remaining = remainingCounts[num] ?? 0;
        const isCompleted = remaining === 0;
        const isActive = activeNumber === num;

        return (
          <button
            key={num}
            type="button"
            disabled={isCompleted && !notesMode}
            onClick={() => onNumberPress(num)}
            aria-label={`Enter number ${num}, ${remaining} remaining`}
            className={`min-h-[52px] sm:min-h-[58px] rounded-xl border flex flex-col items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:cursor-default ${
              isCompleted && !notesMode
                ? 'opacity-30 bg-[#EDF3FF]/60 dark:bg-[#17264A]/40 border-[#D9E4F7] dark:border-[#233761] text-[#5C6C8F]'
                : isActive
                  ? 'bg-[#087BFF] text-white border-[#087BFF] shadow-md shadow-[#087BFF]/25 -translate-y-0.5'
                  : notesMode
                    ? 'bg-[var(--nx-surface)] border-[#00C8FF]/60 text-[#18233D] dark:text-white hover:bg-[#DCEEFF] dark:hover:bg-[#19315E] active:scale-95'
                    : 'bg-[var(--nx-surface)] border-[#D9E4F7] dark:border-[#233761] text-[#18233D] dark:text-white hover:border-[#087BFF] hover:bg-[#DCEEFF]/60 dark:hover:bg-[#19315E] active:scale-95 shadow-xs'
            }`}
          >
            <span className="text-lg sm:text-xl font-extrabold leading-none tabular-nums">
              {num}
            </span>
            {highlightRemaining && (
              <span
                className={`mt-1 text-[10px] font-mono-tabular leading-none ${
                  isActive ? 'text-white/90' : 'text-[#5C6C8F] dark:text-[#93A7CE]'
                }`}
              >
                {remaining}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
