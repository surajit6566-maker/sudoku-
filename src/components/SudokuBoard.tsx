import React from 'react';
import { NUMBER_STYLES } from '../data/themes';
import type { BoardStyleId, NumberStyleId, SmartHintData } from '../types/sudoku';

interface SudokuCellProps {
  index: number;
  value: number;
  given: boolean;
  notes: number[];
  isSelected: boolean;
  isPeer: boolean;
  isSameNumber: boolean;
  isDuplicate: boolean;
  isError: boolean;
  isHintRegion: boolean;
  isHintTarget: boolean;
  isJustEntered: boolean;
  boardStyle: BoardStyleId;
  numberClass: string;
  thickRight: boolean;
  thickBottom: boolean;
  gridThickness: 'thin' | 'balanced' | 'bold';
  onSelect: (index: number) => void;
}

const SudokuCell = React.memo<SudokuCellProps>(
  ({
    index,
    value,
    given,
    notes,
    isSelected,
    isPeer,
    isSameNumber,
    isDuplicate,
    isError,
    isHintRegion,
    isHintTarget,
    isJustEntered,
    boardStyle,
    numberClass,
    thickRight,
    thickBottom,
    gridThickness,
    onSelect,
  }) => {
    const row = Math.floor(index / 9) + 1;
    const col = (index % 9) + 1;

    const subBorderWeight =
      gridThickness === 'bold'
        ? 'border-r-[3px] border-r-[#17264A] dark:border-r-[#4B74C8]'
        : gridThickness === 'thin'
          ? 'border-r border-r-[#17264A]/65 dark:border-r-[#4B74C8]/80'
          : 'border-r-2 border-r-[#17264A] dark:border-r-[#4B74C8]';

    const subBottomWeight =
      gridThickness === 'bold'
        ? 'border-b-[3px] border-b-[#17264A] dark:border-b-[#4B74C8]'
        : gridThickness === 'thin'
          ? 'border-b border-b-[#17264A]/65 dark:border-b-[#4B74C8]/80'
          : 'border-b-2 border-b-[#17264A] dark:border-b-[#4B74C8]';

    const rightClass =
      col === 9
        ? ''
        : thickRight
          ? subBorderWeight
          : 'border-r border-r-[#D9E4F7] dark:border-r-[#233761]';

    const bottomClass =
      row === 9
        ? ''
        : thickBottom
          ? subBottomWeight
          : 'border-b border-b-[#D9E4F7] dark:border-b-[#233761]';

    let bgClass =
      boardStyle === 'obsidian-slate'
        ? 'bg-[#F8FAFF] dark:bg-[#0D1730]'
        : 'bg-[var(--nx-surface)]';

    if (isHintRegion) {
      bgClass = 'bg-amber-50 dark:bg-amber-950/35';
    }
    if (isPeer) {
      bgClass = 'bg-[#EDF4FF] dark:bg-[#16274B]';
    }
    if (isSameNumber) {
      bgClass = 'bg-[#CEE5FF] dark:bg-[#1E3B73]';
    }
    if (isError || isDuplicate) {
      bgClass = 'bg-[#FF5263]/16 dark:bg-[#FF5263]/24';
    }
    if (isHintTarget) {
      bgClass = 'bg-[#00C8FF]/22 dark:bg-[#00C8FF]/25 ring-2 ring-inset ring-[#00C8FF]';
    }
    if (isSelected) {
      bgClass = 'bg-[#087BFF]/20 dark:bg-[#087BFF]/35 ring-2 ring-inset ring-[#087BFF]';
    }

    let textColorClass = 'text-[#18233D] dark:text-[#F1F5FF]';
    if (!given && value !== 0) {
      if (isError || isDuplicate) {
        textColorClass = 'text-[#FF5263]';
      } else {
        textColorClass = 'text-[#087BFF] dark:text-[#00C8FF]';
      }
    }

    const tileStyle =
      boardStyle === 'rounded-tiles' ? 'rounded-[4px]' : '';

    return (
      <button
        type="button"
        onClick={() => onSelect(index)}
        aria-label={`Row ${row} Column ${col}${
          value !== 0 ? `, ${given ? 'given' : 'entered'} ${value}` : ', empty'
        }${isError ? ', incorrect' : ''}`}
        aria-pressed={isSelected}
        data-cell-index={index}
        className={`relative aspect-square w-full flex items-center justify-center select-none transition-colors duration-100 focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[#087BFF] cursor-pointer ${rightClass} ${bottomClass} ${bgClass} ${tileStyle}`}
      >
        {value !== 0 ? (
          <span
            className={`text-lg sm:text-2xl leading-none tabular-nums ${numberClass} ${textColorClass} ${
              isJustEntered ? 'animate-cell-pop' : ''
            } ${isError && isJustEntered ? 'animate-cell-shake' : ''}`}
          >
            {value}
          </span>
        ) : notes.length > 0 ? (
          <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 sm:p-1 pointer-events-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span
                key={n}
                className={`flex items-center justify-center text-[9px] sm:text-[10px] leading-none font-semibold tabular-nums ${
                  notes.includes(n)
                    ? 'text-[#5C6C8F] dark:text-[#93A7CE]'
                    : 'text-transparent'
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        ) : null}
      </button>
    );
  }
);

SudokuCell.displayName = 'SudokuCell';

interface SudokuBoardProps {
  grid: number[];
  puzzle: number[];
  solution: number[];
  notes: number[][];
  selectedCell: number | null;
  autoCheck: boolean;
  highlightDuplicates: boolean;
  duplicates: Set<number>;
  activeHint: SmartHintData | null;
  lastEnteredCell: number | null;
  boardStyle: BoardStyleId;
  numberStyle: NumberStyleId;
  gridThickness: 'thin' | 'balanced' | 'bold';
  onSelectCell: (index: number) => void;
}

export const SudokuBoard: React.FC<SudokuBoardProps> = ({
  grid,
  puzzle,
  solution,
  notes,
  selectedCell,
  autoCheck,
  highlightDuplicates,
  duplicates,
  activeHint,
  lastEnteredCell,
  boardStyle,
  numberStyle,
  gridThickness,
  onSelectCell,
}) => {
  const numberStyleObj = NUMBER_STYLES.find((s) => s.id === numberStyle) ?? NUMBER_STYLES[0];

  const selectedRow = selectedCell !== null ? Math.floor(selectedCell / 9) : -1;
  const selectedCol = selectedCell !== null ? selectedCell % 9 : -1;
  const selectedBox =
    selectedCell !== null
      ? Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3)
      : -1;
  const selectedVal = selectedCell !== null ? grid[selectedCell] : 0;

  return (
    <div
      role="grid"
      aria-label="9 by 9 Sudoku board"
      data-testid="sudoku-board"
      className={`w-full max-w-[490px] aspect-square mx-auto grid grid-cols-9 rounded-2xl overflow-hidden shadow-md border-2 ${
        boardStyle === 'architect-grid'
          ? 'border-[#17264A] dark:border-[#3A5A9C]'
          : 'border-[#17264A] dark:border-[#4B74C8]'
      } bg-[var(--nx-surface)]`}
    >
      {grid.map((val, idx) => {
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const given = puzzle[idx] !== 0;

        const isSelected = idx === selectedCell;
        const isPeer =
          selectedCell !== null &&
          !isSelected &&
          (r === selectedRow || c === selectedCol || b === selectedBox);
        const isSameNumber = selectedVal !== 0 && val === selectedVal && !isSelected;
        const isError = autoCheck && val !== 0 && !given && val !== solution[idx];
        const isDuplicate = highlightDuplicates && duplicates.has(idx);

        let isHintRegion = false;
        let isHintTarget = false;
        if (activeHint) {
          if (activeHint.regionType === 'row' && r === activeHint.regionIndex) isHintRegion = true;
          if (activeHint.regionType === 'col' && c === activeHint.regionIndex) isHintRegion = true;
          if (activeHint.regionType === 'box' && b === activeHint.regionIndex) isHintRegion = true;
          if (activeHint.stage >= 3 && activeHint.row === r && activeHint.col === c) {
            isHintTarget = true;
          }
        }

        return (
          <SudokuCell
            key={idx}
            index={idx}
            value={val}
            given={given}
            notes={notes[idx] ?? []}
            isSelected={isSelected}
            isPeer={isPeer}
            isSameNumber={isSameNumber}
            isDuplicate={isDuplicate}
            isError={isError}
            isHintRegion={isHintRegion}
            isHintTarget={isHintTarget}
            isJustEntered={lastEnteredCell === idx}
            boardStyle={boardStyle}
            numberClass={numberStyleObj.className}
            thickRight={(c + 1) % 3 === 0 && c < 8}
            thickBottom={(r + 1) % 3 === 0 && r < 8}
            gridThickness={gridThickness}
            onSelect={onSelectCell}
          />
        );
      })}
    </div>
  );
};
