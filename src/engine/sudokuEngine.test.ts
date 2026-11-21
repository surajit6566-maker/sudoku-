import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countSolutions,
  eliminatePeerNotes,
  exportPuzzleString,
  generateDailyPuzzle,
  generatePuzzle,
  getDuplicateIndices,
  getRemainingCounts,
  getSmartHint,
  isBoardCompleteAndValid,
  isValidPlacement,
  parsePuzzleString,
  solveSudoku,
} from './sudokuEngine';
import type { Difficulty } from '../types/sudoku';

test('generated puzzles across all 6 difficulties have 81 cells and exactly 1 unique solution', () => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master', 'extreme'];
  for (const diff of difficulties) {
    const gen = generatePuzzle(diff, `seed_${diff}`);
    assert.equal(gen.puzzle.length, 81);
    assert.equal(gen.solution.length, 81);
    assert.equal(countSolutions(gen.puzzle, 2), 1, `${diff} puzzle must have unique solution`);
    assert.equal(isBoardCompleteAndValid(gen.solution), true, `${diff} solution must be valid`);
    for (let i = 0; i < 81; i++) {
      if (gen.puzzle[i] !== 0) {
        assert.equal(gen.puzzle[i], gen.solution[i]);
      }
    }
  }
});

test('daily puzzle generation is deterministic per date', () => {
  const a = generateDailyPuzzle('2026-11-21');
  const b = generateDailyPuzzle('2026-11-21');
  assert.deepEqual(a.puzzle, b.puzzle);
  assert.deepEqual(a.solution, b.solution);
});

test('row, column, and 3x3 validation and duplicate detection work accurately', () => {
  const gen = generatePuzzle('easy', 'validation_seed');
  const grid = [...gen.puzzle];
  const emptyIdx = grid.findIndex((v) => v === 0);
  assert.ok(emptyIdx >= 0);

  const correctVal = gen.solution[emptyIdx];
  assert.equal(isValidPlacement(grid, emptyIdx, correctVal), true);

  // Place a conflicting value from the same row
  const row = Math.floor(emptyIdx / 9);
  let conflictVal = 0;
  for (let c = 0; c < 9; c++) {
    const val = grid[row * 9 + c];
    if (val !== 0) {
      conflictVal = val;
      break;
    }
  }
  assert.ok(conflictVal > 0);
  assert.equal(isValidPlacement(grid, emptyIdx, conflictVal), false);

  grid[emptyIdx] = conflictVal;
  const dupes = getDuplicateIndices(grid);
  assert.equal(dupes.has(emptyIdx), true);
});

test('remaining counts and completion detection prevent invalid completion', () => {
  const gen = generatePuzzle('easy', 'completion_seed');
  const almostDone = [...gen.solution];
  const lastIdx = 40;
  almostDone[lastIdx] = 0;

  const counts = getRemainingCounts(almostDone);
  assert.equal(counts[gen.solution[lastIdx]], 1);
  assert.equal(isBoardCompleteAndValid(almostDone), false);

  // Put wrong value in last cell
  const wrongVal = (gen.solution[lastIdx] % 9) + 1;
  almostDone[lastIdx] = wrongVal;
  assert.equal(isBoardCompleteAndValid(almostDone), false);

  // Put right value
  almostDone[lastIdx] = gen.solution[lastIdx];
  assert.equal(isBoardCompleteAndValid(almostDone), true);
});

test('peer notes are eliminated when a number is placed', () => {
  const notes: number[][] = Array.from({ length: 81 }, () => []);
  notes[1] = [3, 5, 7]; // same row & box as index 0
  notes[9] = [5, 8]; // same col & box as index 0
  notes[80] = [5]; // unrelated cell

  const { nextNotes, removed } = eliminatePeerNotes(notes, 0, 5);
  assert.deepEqual(nextNotes[1], [3, 7]);
  assert.deepEqual(nextNotes[9], [8]);
  assert.deepEqual(nextNotes[80], [5]);
  assert.equal(removed.length, 2);
});

test('smart hint identifies valid next move and technique', () => {
  const gen = generatePuzzle('medium', 'hint_seed');
  const hint = getSmartHint(gen.puzzle, gen.solution);
  assert.ok(hint !== null);
  const idx = hint!.row * 9 + hint!.col;
  assert.equal(hint!.value, gen.solution[idx]);
  assert.ok(hint!.technique.length > 0);
  assert.ok(hint!.explanation.length > 10);
});

test('puzzle string export and parse roundtrip works and solves custom grid', () => {
  const gen = generatePuzzle('hard', 'string_seed');
  const str = exportPuzzleString(gen.puzzle);
  assert.equal(str.length, 81);
  const parsed = parsePuzzleString(str);
  assert.deepEqual(parsed, gen.puzzle);
  const solved = solveSudoku(parsed!);
  assert.deepEqual(solved, gen.solution);
});
