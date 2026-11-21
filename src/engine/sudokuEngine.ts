import type { Difficulty, SmartHintData } from '../types/sudoku';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  tagline: string;
  description: string;
  targetClues: [number, number];
  challengeLevel: number; // 1 to 6
  xpMultiplier: number;
  baseScore: number;
  estimatedMinutes: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    tagline: 'Relax and enjoy.',
    description: 'Clean singles and smooth momentum for warm-up sessions.',
    targetClues: [38, 43],
    challengeLevel: 1,
    xpMultiplier: 1,
    baseScore: 1000,
    estimatedMinutes: '3–5 min',
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    tagline: 'Warm up your brain.',
    description: 'Balanced pattern scanning with hidden singles and pairs.',
    targetClues: [32, 36],
    challengeLevel: 2,
    xpMultiplier: 1.5,
    baseScore: 1600,
    estimatedMinutes: '5–8 min',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    tagline: 'Put your logic to work.',
    description: 'Requires pointing pairs, box-line reduction, and careful notes.',
    targetClues: [27, 31],
    challengeLevel: 3,
    xpMultiplier: 2.2,
    baseScore: 2400,
    estimatedMinutes: '8–14 min',
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    tagline: 'Think several moves ahead.',
    description: 'Sparse clues demanding candidate elimination and multi-unit deduction.',
    targetClues: [24, 26],
    challengeLevel: 4,
    xpMultiplier: 3,
    baseScore: 3400,
    estimatedMinutes: '12–20 min',
  },
  master: {
    id: 'master',
    label: 'Master',
    tagline: 'Only for serious solvers.',
    description: 'Deep logical chains with X-Wing and hidden subset deductions.',
    targetClues: [21, 23],
    challengeLevel: 5,
    xpMultiplier: 4,
    baseScore: 4600,
    estimatedMinutes: '18–30 min',
  },
  extreme: {
    id: 'extreme',
    label: 'Extreme',
    tagline: 'Enter the ultimate challenge.',
    description: 'Minimal clue density pushing pure analytical mastery to the limit.',
    targetClues: [18, 21],
    challengeLevel: 6,
    xpMultiplier: 5.5,
    baseScore: 6000,
    estimatedMinutes: '25+ min',
  },
};

export type RNG = () => number;

export function createSeededRng(seedInput: string | number): RNG {
  let h = 2166136261 >>> 0;
  const str = String(seedInput);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleArray<T>(arr: T[], rng: RNG = Math.random): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function getRowColBox(index: number): { row: number; col: number; box: number } {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  return { row, col, box };
}

export function getPeerIndices(index: number): number[] {
  const { row, col } = getRowColBox(index);
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const peers = new Set<number>();
  for (let i = 0; i < 9; i++) {
    peers.add(row * 9 + i);
    peers.add(i * 9 + col);
  }
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      peers.add(r * 9 + c);
    }
  }
  peers.delete(index);
  return Array.from(peers);
}

const PEER_CACHE: number[][] = Array.from({ length: 81 }, (_, idx) => getPeerIndices(idx));

export function isValidPlacement(grid: number[], index: number, value: number): boolean {
  if (value < 1 || value > 9) return false;
  const peers = PEER_CACHE[index];
  for (let i = 0; i < peers.length; i++) {
    if (grid[peers[i]] === value) return false;
  }
  return true;
}

export function getCandidates(grid: number[], index: number): number[] {
  if (grid[index] !== 0) return [];
  let usedMask = 0;
  const peers = PEER_CACHE[index];
  for (let i = 0; i < peers.length; i++) {
    const val = grid[peers[i]];
    if (val > 0) usedMask |= 1 << val;
  }
  const candidates: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if ((usedMask & (1 << d)) === 0) candidates.push(d);
  }
  return candidates;
}

export function solveSudoku(inputGrid: number[], rng?: RNG): number[] | null {
  if (inputGrid.length !== 81) return null;
  const grid = [...inputGrid];

  // Validate initial givens have no immediate conflict
  for (let i = 0; i < 81; i++) {
    const val = grid[i];
    if (val !== 0) {
      grid[i] = 0;
      const valid = isValidPlacement(grid, i, val);
      grid[i] = val;
      if (!valid) return null;
    }
  }

  function backtrack(): boolean {
    let bestIdx = -1;
    let bestCands: number[] | null = null;

    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) {
        const cands = getCandidates(grid, i);
        if (cands.length === 0) return false;
        if (bestCands === null || cands.length < bestCands.length) {
          bestIdx = i;
          bestCands = cands;
          if (cands.length === 1) break;
        }
      }
    }

    if (bestIdx === -1) return true;
    const ordered = rng ? shuffleArray(bestCands!, rng) : bestCands!;
    for (let i = 0; i < ordered.length; i++) {
      grid[bestIdx] = ordered[i];
      if (backtrack()) return true;
      grid[bestIdx] = 0;
    }
    return false;
  }

  return backtrack() ? grid : null;
}

export function countSolutions(inputGrid: number[], limit = 2): number {
  if (inputGrid.length !== 81) return 0;
  const grid = [...inputGrid];

  for (let i = 0; i < 81; i++) {
    const val = grid[i];
    if (val !== 0) {
      grid[i] = 0;
      const valid = isValidPlacement(grid, i, val);
      grid[i] = val;
      if (!valid) return 0;
    }
  }

  let solutions = 0;

  function search() {
    if (solutions >= limit) return;

    let bestIdx = -1;
    let bestCands: number[] | null = null;
    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) {
        const cands = getCandidates(grid, i);
        if (cands.length === 0) return;
        if (bestCands === null || cands.length < bestCands.length) {
          bestIdx = i;
          bestCands = cands;
          if (cands.length === 1) break;
        }
      }
    }

    if (bestIdx === -1) {
      solutions++;
      return;
    }

    for (let i = 0; i < bestCands!.length; i++) {
      grid[bestIdx] = bestCands![i];
      search();
      grid[bestIdx] = 0;
      if (solutions >= limit) return;
    }
  }

  search();
  return solutions;
}

export function generateSolvedGrid(rng: RNG = Math.random): number[] {
  const grid = new Array<number>(81).fill(0);
  // Fill diagonal 3x3 boxes independently first for fast random distribution
  for (let box = 0; box < 9; box += 4) {
    const digits = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    const startRow = Math.floor(box / 3) * 3;
    const startCol = (box % 3) * 3;
    let k = 0;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        grid[r * 9 + c] = digits[k++];
      }
    }
  }
  const solved = solveSudoku(grid, rng);
  return solved ?? generateSolvedGrid(rng);
}

/**
 * Evaluates human-style logical solving difficulty.
 * Returns a complexity tier 1..6 based on which techniques are needed.
 */
export function evaluateLogicalDifficulty(puzzle: number[]): {
  tier: number;
  clues: number;
  maxTechnique: string;
} {
  const grid = [...puzzle];
  let clues = 0;
  for (let i = 0; i < 81; i++) if (grid[i] !== 0) clues++;

  // Build candidate sets
  const cands: Set<number>[] = Array.from({ length: 81 }, (_, i) =>
    grid[i] === 0 ? new Set(getCandidates(grid, i)) : new Set<number>()
  );

  let maxLevel = 1;
  let maxTechnique = 'Naked Single';

  const assignCell = (idx: number, val: number) => {
    grid[idx] = val;
    cands[idx].clear();
    const peers = PEER_CACHE[idx];
    for (let p = 0; p < peers.length; p++) {
      cands[peers[p]].delete(val);
    }
  };

  let progress = true;
  let hiddenSinglesUsed = 0;
  let advancedEliminations = 0;

  while (progress) {
    progress = false;

    // 1. Naked Singles
    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0 && cands[i].size === 1) {
        const val = Array.from(cands[i])[0];
        assignCell(i, val);
        progress = true;
      }
    }
    if (progress) continue;

    // 2. Hidden Singles in rows, cols, boxes
    const units = getAllUnits();
    for (const unit of units) {
      for (let d = 1; d <= 9; d++) {
        const spots: number[] = [];
        for (const idx of unit) {
          if (grid[idx] === 0 && cands[idx].has(d)) spots.push(idx);
        }
        if (spots.length === 1) {
          assignCell(spots[0], d);
          hiddenSinglesUsed++;
          if (maxLevel < 2) {
            maxLevel = 2;
            maxTechnique = 'Hidden Single';
          }
          progress = true;
          break;
        }
      }
      if (progress) break;
    }
    if (progress) continue;

    // 3. Pointing Pairs / Locked Candidates
    for (let b = 0; b < 9; b++) {
      const boxCells = getBoxIndices(b);
      for (let d = 1; d <= 9; d++) {
        const spots = boxCells.filter((idx) => grid[idx] === 0 && cands[idx].has(d));
        if (spots.length >= 2 && spots.length <= 3) {
          const rows = new Set(spots.map((i) => Math.floor(i / 9)));
          const cols = new Set(spots.map((i) => i % 9));
          if (rows.size === 1) {
            const row = Array.from(rows)[0];
            for (let c = 0; c < 9; c++) {
              const idx = row * 9 + c;
              if (!boxCells.includes(idx) && cands[idx].delete(d)) {
                progress = true;
                advancedEliminations++;
                if (maxLevel < 3) {
                  maxLevel = 3;
                  maxTechnique = 'Pointing Pair';
                }
              }
            }
          } else if (cols.size === 1) {
            const col = Array.from(cols)[0];
            for (let r = 0; r < 9; r++) {
              const idx = r * 9 + col;
              if (!boxCells.includes(idx) && cands[idx].delete(d)) {
                progress = true;
                advancedEliminations++;
                if (maxLevel < 3) {
                  maxLevel = 3;
                  maxTechnique = 'Pointing Pair';
                }
              }
            }
          }
        }
      }
    }
    if (progress) continue;

    // 4. Naked Pairs
    for (const unit of units) {
      const pairCells = unit.filter((idx) => grid[idx] === 0 && cands[idx].size === 2);
      for (let i = 0; i < pairCells.length; i++) {
        for (let j = i + 1; j < pairCells.length; j++) {
          const a = pairCells[i];
          const b = pairCells[j];
          const aVals = Array.from(cands[a]);
          if (cands[b].has(aVals[0]) && cands[b].has(aVals[1])) {
            for (const other of unit) {
              if (other !== a && other !== b && grid[other] === 0) {
                if (cands[other].delete(aVals[0])) {
                  progress = true;
                  advancedEliminations++;
                }
                if (cands[other].delete(aVals[1])) {
                  progress = true;
                  advancedEliminations++;
                }
              }
            }
            if (progress && maxLevel < 4) {
              maxLevel = 4;
              maxTechnique = 'Naked Pair';
            }
          }
        }
      }
    }
  }

  const remainingEmpty = grid.filter((v) => v === 0).length;
  let tier = maxLevel;

  if (remainingEmpty > 0) {
    // Requires deeper multi-step logic / X-Wing / Swordfish / forcing chains
    if (clues <= 21) {
      tier = 6;
      maxTechnique = 'Forcing Chains & Swordfish';
    } else if (clues <= 24) {
      tier = 5;
      maxTechnique = 'X-Wing & Hidden Subsets';
    } else {
      tier = Math.max(4, maxLevel);
      maxTechnique = 'Advanced Elimination';
    }
  } else {
    if (tier === 2 && hiddenSinglesUsed < 4 && clues >= 37) tier = 1;
    else if (tier === 3 && clues <= 26) tier = 4;
    else if (tier === 4 && clues <= 23) tier = 5;
    if (advancedEliminations > 6 && tier < 4) tier = 4;
  }

  return { tier, clues, maxTechnique };
}

export interface GeneratedPuzzle {
  puzzle: number[];
  solution: number[];
  difficulty: Difficulty;
  complexityTier: number;
  maxTechnique: string;
}

export function generatePuzzle(
  difficulty: Difficulty,
  seed?: string | number
): GeneratedPuzzle {
  const rng = seed !== undefined ? createSeededRng(seed) : Math.random;
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [minClues, maxClues] = config.targetClues;
  const targetClues = Math.floor(minClues + rng() * (maxClues - minClues + 1));

  let bestCandidate: GeneratedPuzzle | null = null;
  let bestScoreDiff = Infinity;

  const maxAttempts = difficulty === 'master' || difficulty === 'extreme' ? 4 : 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = generateSolvedGrid(rng);
    const puzzle = [...solution];
    const indices = shuffleArray(
      Array.from({ length: 81 }, (_, i) => i),
      rng
    );

    let clues = 81;
    for (let i = 0; i < indices.length; i++) {
      if (clues <= targetClues) break;
      const idx = indices[i];
      const backup = puzzle[idx];
      puzzle[idx] = 0;

      // Ensure unique solution!
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[idx] = backup;
      } else {
        clues--;
      }
    }

    const evalResult = evaluateLogicalDifficulty(puzzle);
    const tierDiff = Math.abs(evalResult.tier - config.challengeLevel);
    const clueDiff = Math.abs(evalResult.clues - targetClues) * 0.25;
    const scoreDiff = tierDiff * 2 + clueDiff;

    if (scoreDiff < bestScoreDiff) {
      bestScoreDiff = scoreDiff;
      bestCandidate = {
        puzzle,
        solution,
        difficulty,
        complexityTier: evalResult.tier,
        maxTechnique: evalResult.maxTechnique,
      };
    }

    if (tierDiff === 0 && Math.abs(evalResult.clues - targetClues) <= 2) {
      break;
    }
  }

  return bestCandidate!;
}

function getBoxIndices(boxIndex: number): number[] {
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;
  const cells: number[] = [];
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      cells.push(r * 9 + c);
    }
  }
  return cells;
}

function getAllUnits(): number[][] {
  const units: number[][] = [];
  for (let r = 0; r < 9; r++) {
    units.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  }
  for (let c = 0; c < 9; c++) {
    units.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  }
  for (let b = 0; b < 9; b++) {
    units.push(getBoxIndices(b));
  }
  return units;
}

export function getSmartHint(
  currentGrid: number[],
  solution: number[]
): Omit<SmartHintData, 'stage'> | null {
  // Build clean grid containing only valid entries so hints are always reliable
  const safeGrid = currentGrid.map((val, idx) => (val === solution[idx] ? val : 0));

  // 1. Check for Naked Singles
  for (let i = 0; i < 81; i++) {
    if (currentGrid[i] === 0 || currentGrid[i] !== solution[i]) {
      const cands = getCandidates(safeGrid, i);
      if (cands.length === 1) {
        const { row, col, box } = getRowColBox(i);
        return {
          row,
          col,
          value: solution[i],
          candidates: cands,
          technique: 'Naked Single',
          regionType: 'box',
          regionIndex: box,
          explanation: `Cell R${row + 1}C${col + 1} can only hold ${solution[i]} because every other digit 1–9 already appears in its row, column, or 3×3 box.`,
        };
      }
    }
  }

  // 2. Check for Hidden Singles in rows, columns, and boxes
  for (let r = 0; r < 9; r++) {
    for (let d = 1; d <= 9; d++) {
      const spots: number[] = [];
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        if (safeGrid[idx] === 0 && getCandidates(safeGrid, idx).includes(d)) {
          spots.push(idx);
        }
      }
      if (spots.length === 1) {
        const idx = spots[0];
        const { row, col } = getRowColBox(idx);
        return {
          row,
          col,
          value: d,
          candidates: getCandidates(safeGrid, idx),
          technique: 'Hidden Single (Row)',
          regionType: 'row',
          regionIndex: r,
          explanation: `In Row ${r + 1}, the digit ${d} has only one possible home at R${row + 1}C${col + 1}.`,
        };
      }
    }
  }

  for (let c = 0; c < 9; c++) {
    for (let d = 1; d <= 9; d++) {
      const spots: number[] = [];
      for (let r = 0; r < 9; r++) {
        const idx = r * 9 + c;
        if (safeGrid[idx] === 0 && getCandidates(safeGrid, idx).includes(d)) {
          spots.push(idx);
        }
      }
      if (spots.length === 1) {
        const idx = spots[0];
        const { row, col } = getRowColBox(idx);
        return {
          row,
          col,
          value: d,
          candidates: getCandidates(safeGrid, idx),
          technique: 'Hidden Single (Column)',
          regionType: 'col',
          regionIndex: c,
          explanation: `In Column ${c + 1}, the digit ${d} can only be placed in cell R${row + 1}C${col + 1}.`,
        };
      }
    }
  }

  for (let b = 0; b < 9; b++) {
    const cells = getBoxIndices(b);
    for (let d = 1; d <= 9; d++) {
      const spots = cells.filter(
        (idx) => safeGrid[idx] === 0 && getCandidates(safeGrid, idx).includes(d)
      );
      if (spots.length === 1) {
        const idx = spots[0];
        const { row, col } = getRowColBox(idx);
        return {
          row,
          col,
          value: d,
          candidates: getCandidates(safeGrid, idx),
          technique: 'Hidden Single (3×3 Box)',
          regionType: 'box',
          regionIndex: b,
          explanation: `Inside Box ${b + 1}, ${d} is eliminated from every other empty square, leaving R${row + 1}C${col + 1}.`,
        };
      }
    }
  }

  // 3. Fallback: pick most constrained empty cell (MRV)
  let bestIdx = -1;
  let bestCands: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (currentGrid[i] === 0 || currentGrid[i] !== solution[i]) {
      const cands = getCandidates(safeGrid, i);
      if (bestIdx === -1 || (cands.length > 0 && cands.length < bestCands.length)) {
        bestIdx = i;
        bestCands = cands;
      }
    }
  }

  if (bestIdx === -1) return null;
  const { row, col, box } = getRowColBox(bestIdx);
  return {
    row,
    col,
    value: solution[bestIdx],
    candidates: bestCands.length > 0 ? bestCands : [solution[bestIdx]],
    technique: 'Candidate Chain Deduction',
    regionType: 'box',
    regionIndex: box,
    explanation: `Focus on Box ${box + 1} around R${row + 1}C${col + 1}. Narrowing candidates down to ${bestCands.join(', ')} reveals the forced chain.`,
  };
}

export function getDuplicateIndices(grid: number[]): Set<number> {
  const duplicates = new Set<number>();
  const units = getAllUnits();
  for (const unit of units) {
    const seen = new Map<number, number[]>();
    for (const idx of unit) {
      const val = grid[idx];
      if (val !== 0) {
        const list = seen.get(val) ?? [];
        list.push(idx);
        seen.set(val, list);
      }
    }
    for (const positions of seen.values()) {
      if (positions.length > 1) {
        positions.forEach((p) => duplicates.add(p));
      }
    }
  }
  return duplicates;
}

export function getRemainingCounts(grid: number[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 };
  for (let i = 0; i < 81; i++) {
    const val = grid[i];
    if (val >= 1 && val <= 9) {
      counts[val] = Math.max(0, counts[val] - 1);
    }
  }
  return counts;
}

export function isBoardCompleteAndValid(grid: number[]): boolean {
  if (grid.length !== 81) return false;
  for (let i = 0; i < 81; i++) {
    if (grid[i] < 1 || grid[i] > 9) return false;
  }
  const units = getAllUnits();
  for (const unit of units) {
    const seen = new Set<number>();
    for (const idx of unit) {
      if (seen.has(grid[idx])) return false;
      seen.add(grid[idx]);
    }
  }
  return true;
}

export function eliminatePeerNotes(
  notes: number[][],
  cellIndex: number,
  placedValue: number
): { nextNotes: number[][]; removed: Array<{ row: number; col: number; removedNote: number }> } {
  const nextNotes = notes.map((arr) => [...arr]);
  const removed: Array<{ row: number; col: number; removedNote: number }> = [];
  const peers = PEER_CACHE[cellIndex];
  for (const p of peers) {
    if (nextNotes[p].includes(placedValue)) {
      nextNotes[p] = nextNotes[p].filter((n) => n !== placedValue);
      const { row, col } = getRowColBox(p);
      removed.push({ row, col, removedNote: placedValue });
    }
  }
  return { nextNotes, removed };
}

export function parsePuzzleString(input: string): number[] | null {
  const cleaned = input.replace(/[\s\n\r,|-]/g, '').replace(/\./g, '0');
  if (cleaned.length !== 81) return null;
  const grid: number[] = [];
  for (let i = 0; i < 81; i++) {
    const ch = cleaned[i];
    if (ch < '0' || ch > '9') return null;
    grid.push(Number(ch));
  }
  return grid;
}

export function exportPuzzleString(grid: number[]): string {
  return grid.map((n) => (n >= 1 && n <= 9 ? String(n) : '0')).join('');
}

export function getDailyDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyDifficultyForDate(dateStr: string): Difficulty {
  const day = Number(dateStr.split('-')[2] || 1) % 7;
  const rotation: Difficulty[] = ['easy', 'medium', 'medium', 'hard', 'hard', 'expert', 'master'];
  return rotation[day];
}

export function generateDailyPuzzle(dateStr: string = getDailyDateString()): GeneratedPuzzle {
  const difficulty = getDailyDifficultyForDate(dateStr);
  return generatePuzzle(difficulty, `SUDOKU_NEXUS_DAILY_${dateStr}`);
}
