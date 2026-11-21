export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'extreme';

export type GameMode = 'classic' | 'speed-run' | 'mistake-free' | 'zen' | 'focus';

export type NavigationTab = 'home' | 'play' | 'challenges' | 'stats' | 'profile';

export type ScreenView =
  | 'home'
  | 'play'
  | 'game'
  | 'victory'
  | 'challenges'
  | 'stats'
  | 'profile';

export type ThemeId =
  | 'classic-light'
  | 'midnight-dark'
  | 'ocean-blue'
  | 'cyber-neon'
  | 'lavender-dream'
  | 'minimal-white'
  | 'amoled-black'
  | 'sunset-gradient';

export type BoardStyleId = 'nexus-clean' | 'architect-grid' | 'rounded-tiles' | 'obsidian-slate';
export type NumberStyleId = 'geometric' | 'mono-tech' | 'editorial' | 'bold-arcade';
export type MusicTrackId = 'chill-electronic' | 'lofi' | 'ambient-focus' | 'minimal-beats';

export interface CellState {
  row: number;
  col: number;
  value: number; // 0 if empty
  given: boolean;
  notes: number[];
  isError: boolean;
  isHinted?: boolean;
}

export interface MoveHistoryEntry {
  row: number;
  col: number;
  prevValue: number;
  nextValue: number;
  prevNotes: number[];
  nextNotes: number[];
  affectedPeerNotes: Array<{ row: number; col: number; removedNote: number }>;
}

export interface SmartHintData {
  row: number;
  col: number;
  value: number;
  candidates: number[];
  technique: string;
  regionType: 'row' | 'col' | 'box';
  regionIndex: number;
  explanation: string;
  stage: 1 | 2 | 3 | 4;
}

export interface ActiveGameState {
  id: string;
  difficulty: Difficulty;
  mode: GameMode;
  puzzle: number[]; // 81-length initial givens
  solution: number[]; // 81-length unique solution
  grid: number[]; // 81-length current values
  notes: number[][]; // 81-length arrays of pencil digits
  elapsedSeconds: number;
  score: number;
  mistakes: number;
  maxMistakes: number | null; // null in zen mode, 1 in mistake-free, 3 in classic/speed-run
  hintsUsed: number;
  hintedCells: number[]; // indices
  undoStack: MoveHistoryEntry[];
  redoStack: MoveHistoryEntry[];
  isDaily?: boolean;
  dailyDate?: string;
  challengeId?: string;
  challengeTitle?: string;
  startedAt: number;
  lastUpdatedAt: number;
}

export interface GameRecord {
  id: string;
  difficulty: Difficulty;
  mode: GameMode;
  won: boolean;
  elapsedSeconds: number;
  score: number;
  mistakes: number;
  hintsUsed: number;
  accuracy: number;
  xpEarned: number;
  completedAt: number; // timestamp ms
  isDaily?: boolean;
  dailyDate?: string;
  puzzleString: string;
  solutionString: string;
  finalGridString: string;
}

export interface DailyCompletion {
  date: string; // YYYY-MM-DD
  completedAt: number;
  elapsedSeconds: number;
  score: number;
  mistakes: number;
  hintsUsed: number;
  difficulty: Difficulty;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  rewardLabel: string;
  iconName: string;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
  type: 'solve_count' | 'medium_plus' | 'no_hints' | 'under_5min';
}

export interface PlayerProfile {
  username: string;
  avatarId: string;
  frameId: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  unlockedAchievements: string[];
  unlockedRewards: string[];
  equippedBoardStyle: BoardStyleId;
  equippedNumberStyle: NumberStyleId;
}

export interface UserSettings {
  theme: ThemeId;
  highContrast: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
  sfxVolume: number; // 0 to 1
  musicEnabled: boolean;
  musicVolume: number; // 0 to 1
  musicTrack: MusicTrackId;
  autoCheck: boolean;
  highlightDuplicates: boolean;
  highlightRemaining: boolean;
  autoRemoveNotes: boolean;
  hapticsEnabled: boolean;
  gridThickness: 'thin' | 'balanced' | 'bold';
  animationIntensity: 'subtle' | 'dynamic' | 'minimal';
  hasCompletedOnboarding: boolean;
}

export interface StatisticsSummary {
  totalGames: number;
  gamesWon: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  bestScore: number;
  averageScore: number;
  perfectGames: number;
  totalMistakes: number;
  totalSolvingSeconds: number;
  bestTimeSeconds: number | null;
  averageTimeSeconds: number | null;
  totalHintsUsed: number;
  difficultyBreakdown: Record<Difficulty, { played: number; won: number; bestTime: number | null }>;
  last7Days: Array<{ date: string; label: string; played: number; won: number; avgTime: number }>;
  accuracyTrend: Array<{ label: string; accuracy: number }>;
  speedImprovementPct: number | null;
}

export interface LocalLeaderboardEntry {
  id: string;
  name: string;
  avatarId: string;
  score: number;
  timeSeconds: number;
  difficulty: Difficulty;
  accuracy: number;
  date: string;
  isCurrentUser?: boolean;
}

export interface ChallengePayload {
  id: string;
  title: string;
  creator: string;
  difficulty: Difficulty;
  puzzleString: string;
  creatorTime?: number;
  creatorAccuracy?: number;
  creatorHints?: number;
}
