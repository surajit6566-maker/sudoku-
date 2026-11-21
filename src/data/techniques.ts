export interface TechniqueTutorial {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  summary: string;
  steps: string[];
  // 9x9 demo pattern (3x3 or full mini snapshot represented as 9 cells in a single row/box for interactive highlight)
  demoGrid: Array<{
    label: string;
    candidates?: number[];
    highlight?: 'target' | 'eliminator' | 'muted';
    solvedValue?: number;
  }>;
  interactivePrompt: string;
  answerDigit: number;
}

export const SUDOKU_TECHNIQUES: TechniqueTutorial[] = [
  {
    id: 'naked-singles',
    name: 'Naked Singles',
    level: 'Beginner',
    summary: 'An empty cell has only one legal candidate remaining after checking its row, column, and 3×3 box.',
    steps: [
      'Select an empty cell with dense neighbors.',
      'Scan digits 1–9 across its row, column, and 3×3 box.',
      'If eight digits are already present, the sole remaining digit is guaranteed.',
    ],
    demoGrid: [
      { label: '1', solvedValue: 1, highlight: 'eliminator' },
      { label: '2', solvedValue: 2, highlight: 'eliminator' },
      { label: '3', solvedValue: 3, highlight: 'eliminator' },
      { label: '4', solvedValue: 4, highlight: 'eliminator' },
      { label: '?', candidates: [5], highlight: 'target' },
      { label: '6', solvedValue: 6, highlight: 'eliminator' },
      { label: '7', solvedValue: 7, highlight: 'eliminator' },
      { label: '8', solvedValue: 8, highlight: 'eliminator' },
      { label: '9', solvedValue: 9, highlight: 'eliminator' },
    ],
    interactivePrompt: 'Which digit belongs in the highlighted center cell?',
    answerDigit: 5,
  },
  {
    id: 'hidden-singles',
    name: 'Hidden Singles',
    level: 'Beginner',
    summary: 'A digit appears as a candidate in only one cell within a row, column, or 3×3 box, even if that cell lists other candidates.',
    steps: [
      'Pick a missing digit inside a row, column, or box.',
      'Check which empty cells in that unit can legally hold it.',
      'If only one cell allows that digit, place it immediately.',
    ],
    demoGrid: [
      { label: '1/4', candidates: [1, 4] },
      { label: '1/4/7', candidates: [1, 4, 7], highlight: 'target' },
      { label: '2', solvedValue: 2 },
      { label: '1/4', candidates: [1, 4] },
      { label: '6', solvedValue: 6 },
      { label: '8', solvedValue: 8 },
      { label: '9', solvedValue: 9 },
      { label: '3', solvedValue: 3 },
      { label: '5', solvedValue: 5 },
    ],
    interactivePrompt: 'Notice 7 only appears as a candidate in one cell. Which digit is forced there?',
    answerDigit: 7,
  },
  {
    id: 'naked-pairs',
    name: 'Naked Pairs',
    level: 'Intermediate',
    summary: 'Two cells in the same unit share the exact same two candidates, locking those two digits out of every other cell in that unit.',
    steps: [
      'Find two cells in a row, column, or box containing identical 2-digit notes (e.g. 3, 8).',
      'Because 3 and 8 must go into those two cells, remove 3 and 8 from all other cells in that unit.',
      'Look for newly exposed singles.',
    ],
    demoGrid: [
      { label: '3/8', candidates: [3, 8], highlight: 'eliminator' },
      { label: '3/8', candidates: [3, 8], highlight: 'eliminator' },
      { label: '3/8/9', candidates: [3, 8, 9], highlight: 'target' },
      { label: '1', solvedValue: 1 },
      { label: '2', solvedValue: 2 },
      { label: '4', solvedValue: 4 },
      { label: '5', solvedValue: 5 },
      { label: '6', solvedValue: 6 },
      { label: '7', solvedValue: 7 },
    ],
    interactivePrompt: 'After the Naked Pair (3, 8) eliminates 3 and 8 from cell 3, which digit remains?',
    answerDigit: 9,
  },
  {
    id: 'hidden-pairs',
    name: 'Hidden Pairs',
    level: 'Intermediate',
    summary: 'Two candidates appear together exclusively inside two cells of a unit, allowing you to strip all other candidates from those two cells.',
    steps: [
      'Scan a unit for two digits that appear only in the same pair of cells.',
      'Remove every other candidate from those two cells.',
      'This often creates a Naked Pair or exposes another Hidden Single.',
    ],
    demoGrid: [
      { label: '2/6/4', candidates: [2, 6, 4], highlight: 'eliminator' },
      { label: '2/6/9', candidates: [2, 6, 9], highlight: 'eliminator' },
      { label: '4/9', candidates: [4, 9], highlight: 'target' },
      { label: '1', solvedValue: 1 },
      { label: '3', solvedValue: 3 },
      { label: '5', solvedValue: 5 },
      { label: '7', solvedValue: 7 },
      { label: '8', solvedValue: 8 },
      { label: '4', solvedValue: 4 },
    ],
    interactivePrompt: 'Digits 2 and 6 only exist in cells 1 & 2, stripping 4 & 9 from them. Since cell 9 is 4, what is cell 3?',
    answerDigit: 9,
  },
  {
    id: 'pointing-pairs',
    name: 'Pointing Pairs',
    level: 'Intermediate',
    summary: 'When a candidate inside a 3×3 box is restricted to a single row or column, it can be eliminated from the rest of that row or column outside the box.',
    steps: [
      'Inspect a 3×3 box for a digit restricted to 2 or 3 cells aligned in one row or column.',
      'That digit must occupy one of those aligned cells inside the box.',
      'Eliminate that digit from all cells along the same line outside the box.',
    ],
    demoGrid: [
      { label: '4/7', candidates: [4, 7], highlight: 'eliminator' },
      { label: '4/7', candidates: [4, 7], highlight: 'eliminator' },
      { label: '2', solvedValue: 2 },
      { label: '1', solvedValue: 1 },
      { label: '3', solvedValue: 3 },
      { label: '5', solvedValue: 5 },
      { label: '6', solvedValue: 6 },
      { label: '8', solvedValue: 8 },
      { label: '4/9', candidates: [4, 9], highlight: 'target' },
    ],
    interactivePrompt: '4 is locked in the left box along this row, eliminating 4 from cell 9. What must cell 9 be?',
    answerDigit: 9,
  },
  {
    id: 'box-line-reduction',
    name: 'Box-Line Reduction',
    level: 'Advanced',
    summary: 'The reverse of Pointing Pairs: when a candidate in a row or column only appears inside one 3×3 box, eliminate it from all other cells in that box.',
    steps: [
      'Scan a row or column for a digit whose candidates all fall inside one 3×3 box.',
      'Remove that candidate from the remaining cells inside that 3×3 box.',
      'Watch for newly forced singles inside the box.',
    ],
    demoGrid: [
      { label: '6/8', candidates: [6, 8], highlight: 'eliminator' },
      { label: '6/8', candidates: [6, 8], highlight: 'eliminator' },
      { label: '1', solvedValue: 1 },
      { label: '6/2', candidates: [6, 2], highlight: 'target' },
      { label: '3', solvedValue: 3 },
      { label: '4', solvedValue: 4 },
      { label: '5', solvedValue: 5 },
      { label: '7', solvedValue: 7 },
      { label: '9', solvedValue: 9 },
    ],
    interactivePrompt: 'If 6 in Row 1 is restricted to this box, removing 6 from cell 4 leaves which digit?',
    answerDigit: 2,
  },
  {
    id: 'x-wing',
    name: 'X-Wing',
    level: 'Advanced',
    summary: 'A candidate appears in only two columns across two rows, forming a rectangle. You can eliminate that candidate from the rest of both columns.',
    steps: [
      'Find two rows where digit D has only two possible columns, and both rows share the exact same two columns.',
      'The four intersection cells form a locked X-Wing rectangle.',
      'Eliminate digit D from every other cell in those two columns (or swap rows/columns).',
    ],
    demoGrid: [
      { label: '3/5', candidates: [3, 5], highlight: 'eliminator' },
      { label: '—', highlight: 'muted' },
      { label: '3/9', candidates: [3, 9], highlight: 'eliminator' },
      { label: '—', highlight: 'muted' },
      { label: '3/7', candidates: [3, 7], highlight: 'target' },
      { label: '—', highlight: 'muted' },
      { label: '3/2', candidates: [3, 2], highlight: 'eliminator' },
      { label: '—', highlight: 'muted' },
      { label: '3/8', candidates: [3, 8], highlight: 'eliminator' },
    ],
    interactivePrompt: 'An X-Wing locks 3 into the corners. Removing 3 from the center column cell leaves which digit?',
    answerDigit: 7,
  },
  {
    id: 'swordfish',
    name: 'Swordfish',
    level: 'Master',
    summary: 'A 3×3 generalization of X-Wing: a candidate restricted to three columns across three rows can be eliminated from all other cells in those three columns.',
    steps: [
      'Look for three rows where a candidate appears in at most three shared columns.',
      'Verify no extra candidates exist for that digit in those rows outside the three columns.',
      'Clear that candidate from all other rows in those three columns.',
    ],
    demoGrid: [
      { label: '8/1', candidates: [8, 1], highlight: 'eliminator' },
      { label: '8/4', candidates: [8, 4], highlight: 'eliminator' },
      { label: '8/6', candidates: [8, 6], highlight: 'eliminator' },
      { label: '2', solvedValue: 2 },
      { label: '8/3', candidates: [8, 3], highlight: 'target' },
      { label: '5', solvedValue: 5 },
      { label: '7', solvedValue: 7 },
      { label: '9', solvedValue: 9 },
      { label: '4', solvedValue: 4 },
    ],
    interactivePrompt: 'Once Swordfish eliminates 8 from the target cell, which digit remains?',
    answerDigit: 3,
  },
];
