import type {
  AchievementDef,
  DailyMission,
  Difficulty,
  GameMode,
  GameRecord,
  PlayerProfile,
  StatisticsSummary,
} from '../types/sudoku';
import { DIFFICULTY_CONFIGS } from './sudokuEngine';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-win',
    title: 'First Win',
    description: 'Complete your first Sudoku Nexus puzzle.',
    xpReward: 120,
    rewardLabel: 'Theme: Ocean Blue',
    iconName: 'Trophy',
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Solve a Medium or harder puzzle in under 4 minutes.',
    xpReward: 240,
    rewardLabel: 'Number Style: Bold Arcade',
    iconName: 'Zap',
  },
  {
    id: 'perfect-solver',
    title: 'Perfect Solver',
    description: 'Complete a puzzle with 0 mistakes and 0 hints.',
    xpReward: 260,
    rewardLabel: 'Frame: Prism Gold',
    iconName: 'Sparkles',
  },
  {
    id: 'seven-day-streak',
    title: 'Seven-Day Streak',
    description: 'Maintain a 7-day puzzle streak.',
    xpReward: 400,
    rewardLabel: 'Theme: Cyber Neon',
    iconName: 'Flame',
  },
  {
    id: 'no-hint-hero',
    title: 'No Hint Hero',
    description: 'Win 5 puzzles without using a single hint.',
    xpReward: 300,
    rewardLabel: 'Board: Architect Grid',
    iconName: 'Brain',
  },
  {
    id: 'master-mind',
    title: 'Master Mind',
    description: 'Conquer a Master difficulty puzzle.',
    xpReward: 450,
    rewardLabel: 'Theme: Lavender Dream',
    iconName: 'Crown',
  },
  {
    id: 'extreme-survivor',
    title: 'Extreme Survivor',
    description: 'Complete an Extreme difficulty puzzle.',
    xpReward: 650,
    rewardLabel: 'Frame: Nexus Apex',
    iconName: 'Shield',
  },
  {
    id: 'century-club',
    title: 'Century Club',
    description: 'Score 4,000+ points in a single puzzle.',
    xpReward: 320,
    rewardLabel: 'Avatar: Cyber Fox',
    iconName: 'Award',
  },
  {
    id: 'puzzle-addict',
    title: 'Puzzle Addict',
    description: 'Win 15 total Sudoku puzzles.',
    xpReward: 500,
    rewardLabel: 'Theme: Sunset Gradient',
    iconName: 'Layers',
  },
];

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Progressive curve: 250, 600, 1050, 1600, ...
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += 200 + l * 100;
  }
  return total;
}

export function getLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  let level = 1;
  while (xp >= getXpForLevel(level + 1)) {
    level++;
  }
  const floorXp = getXpForLevel(level);
  const ceilXp = getXpForLevel(level + 1);
  const span = Math.max(1, ceilXp - floorXp);
  const currentLevelXp = xp - floorXp;
  const progressPct = Math.min(100, Math.round((currentLevelXp / span) * 100));
  return {
    level,
    currentLevelXp,
    nextLevelXp: ceilXp - floorXp,
    progressPct,
  };
}

export function calculateGameScore(params: {
  difficulty: Difficulty;
  mode: GameMode;
  elapsedSeconds: number;
  mistakes: number;
  hintsUsed: number;
  won: boolean;
}): number {
  if (!params.won) return 0;
  const config = DIFFICULTY_CONFIGS[params.difficulty];
  const timeTarget = config.challengeLevel * 240; // e.g., Easy=240s, Extreme=1440s
  const timeBonus = Math.max(0, Math.round((timeTarget - params.elapsedSeconds) * 2.5));
  const mistakePenalty = params.mistakes * 220;
  const hintPenalty = params.hintsUsed * 180;
  const modeBonus =
    params.mode === 'mistake-free' ? 500 : params.mode === 'speed-run' ? 350 : 0;

  return Math.max(250, config.baseScore + timeBonus + modeBonus - mistakePenalty - hintPenalty);
}

export function calculateAccuracy(
  initialPuzzle: number[],
  mistakes: number,
  hintsUsed: number
): number {
  const emptyCount = Math.max(1, initialPuzzle.filter((n) => n === 0).length);
  const totalAttempts = emptyCount + mistakes;
  const raw = ((emptyCount - hintsUsed * 0.5) / totalAttempts) * 100;
  return Math.max(10, Math.min(100, Math.round(raw)));
}

export function calculateXpEarned(params: {
  difficulty: Difficulty;
  mode: GameMode;
  mistakes: number;
  hintsUsed: number;
  isDaily?: boolean;
  won: boolean;
  currentStreak: number;
}): number {
  if (!params.won) return 20;
  const mult = DIFFICULTY_CONFIGS[params.difficulty].xpMultiplier;
  let xp = Math.round(100 * mult);
  if (params.mistakes === 0 && params.hintsUsed === 0) xp += Math.round(60 * mult);
  if (params.mode === 'mistake-free') xp += 90;
  if (params.isDaily) xp += 110;
  xp += Math.min(100, params.currentStreak * 15);
  return xp;
}

export function isPerfectGame(record: Pick<GameRecord, 'won' | 'mistakes' | 'hintsUsed'>): boolean {
  return record.won && record.mistakes === 0 && record.hintsUsed === 0;
}

export function evaluateNewAchievements(
  profile: PlayerProfile,
  records: GameRecord[],
  latestRecord: GameRecord
): AchievementDef[] {
  if (!latestRecord.won) return [];

  const unlocked = new Set(profile.unlockedAchievements);
  const wonRecords = records.filter((r) => r.won);
  const newlyUnlocked: AchievementDef[] = [];

  const check = (id: string, condition: boolean) => {
    if (!unlocked.has(id) && condition) {
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) newlyUnlocked.push(def);
    }
  };

  check('first-win', wonRecords.length >= 1);
  check(
    'speed-demon',
    latestRecord.difficulty !== 'easy' && latestRecord.elapsedSeconds < 240
  );
  check('perfect-solver', isPerfectGame(latestRecord));
  check('seven-day-streak', profile.currentStreak >= 7 || profile.longestStreak >= 7);
  check('no-hint-hero', wonRecords.filter((r) => r.hintsUsed === 0).length >= 5);
  check('master-mind', latestRecord.difficulty === 'master');
  check('extreme-survivor', latestRecord.difficulty === 'extreme');
  check('century-club', latestRecord.score >= 4000);
  check('puzzle-addict', wonRecords.length >= 15);

  return newlyUnlocked;
}

export function createDefaultDailyMissions(): DailyMission[] {
  return [
    {
      id: 'm-solve-2',
      title: 'Daily Momentum',
      description: 'Solve 2 puzzles today',
      target: 2,
      progress: 0,
      xpReward: 120,
      completed: false,
      type: 'solve_count',
    },
    {
      id: 'm-medium-plus',
      title: 'Logic Escalation',
      description: 'Complete 1 Medium or harder puzzle',
      target: 1,
      progress: 0,
      xpReward: 150,
      completed: false,
      type: 'medium_plus',
    },
    {
      id: 'm-no-hints',
      title: 'Pure Deduction',
      description: 'Win 1 puzzle without hints',
      target: 1,
      progress: 0,
      xpReward: 180,
      completed: false,
      type: 'no_hints',
    },
    {
      id: 'm-under-5min',
      title: 'Clock Breaker',
      description: 'Finish any puzzle under 5 minutes',
      target: 1,
      progress: 0,
      xpReward: 160,
      completed: false,
      type: 'under_5min',
    },
  ];
}

export function updateDailyMissionsOnWin(
  missions: DailyMission[],
  record: GameRecord
): { nextMissions: DailyMission[]; bonusXp: number } {
  if (!record.won) return { nextMissions: missions, bonusXp: 0 };
  let bonusXp = 0;

  const nextMissions = missions.map((m) => {
    if (m.completed) return m;
    let inc = 0;
    if (m.type === 'solve_count') inc = 1;
    if (m.type === 'medium_plus' && record.difficulty !== 'easy') inc = 1;
    if (m.type === 'no_hints' && record.hintsUsed === 0) inc = 1;
    if (m.type === 'under_5min' && record.elapsedSeconds < 300) inc = 1;

    if (inc === 0) return m;
    const nextProgress = Math.min(m.target, m.progress + inc);
    const completed = nextProgress >= m.target;
    if (completed) bonusXp += m.xpReward;
    return { ...m, progress: nextProgress, completed };
  });

  return { nextMissions, bonusXp };
}

export function computeStatistics(
  records: GameRecord[],
  profile: PlayerProfile,
  filter: 'today' | '7d' | '30d' | 'all',
  nowMs: number = Date.now()
): StatisticsSummary {
  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const cutoff =
    filter === 'today'
      ? startOfToday.getTime()
      : filter === '7d'
        ? nowMs - 7 * 86400000
        : filter === '30d'
          ? nowMs - 30 * 86400000
          : 0;

  const filtered = records.filter((r) => r.completedAt >= cutoff);
  const wonList = filtered.filter((r) => r.won);

  const totalGames = filtered.length;
  const gamesWon = wonList.length;
  const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;

  const bestScore = wonList.length > 0 ? Math.max(...wonList.map((r) => r.score)) : 0;
  const averageScore =
    wonList.length > 0
      ? Math.round(wonList.reduce((sum, r) => sum + r.score, 0) / wonList.length)
      : 0;
  const perfectGames = wonList.filter((r) => isPerfectGame(r)).length;
  const totalMistakes = filtered.reduce((sum, r) => sum + r.mistakes, 0);
  const totalHintsUsed = filtered.reduce((sum, r) => sum + r.hintsUsed, 0);
  const totalSolvingSeconds = filtered.reduce((sum, r) => sum + r.elapsedSeconds, 0);

  const bestTimeSeconds =
    wonList.length > 0 ? Math.min(...wonList.map((r) => r.elapsedSeconds)) : null;
  const averageTimeSeconds =
    wonList.length > 0
      ? Math.round(wonList.reduce((sum, r) => sum + r.elapsedSeconds, 0) / wonList.length)
      : null;

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master', 'extreme'];
  const difficultyBreakdown = {} as StatisticsSummary['difficultyBreakdown'];
  for (const diff of difficulties) {
    const sub = filtered.filter((r) => r.difficulty === diff);
    const subWon = sub.filter((r) => r.won);
    difficultyBreakdown[diff] = {
      played: sub.length,
      won: subWon.length,
      bestTime: subWon.length > 0 ? Math.min(...subWon.map((r) => r.elapsedSeconds)) : null,
    };
  }

  // Last 7 days chart built strictly from real records
  const last7Days: StatisticsSummary['last7Days'] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(nowMs - offset * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayRecs = records.filter((r) => {
      const rd = new Date(r.completedAt);
      const rKey = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(
        rd.getDate()
      ).padStart(2, '0')}`;
      return rKey === key;
    });
    const dayWon = dayRecs.filter((r) => r.won);
    const avgTime =
      dayWon.length > 0
        ? Math.round(dayWon.reduce((s, r) => s + r.elapsedSeconds, 0) / dayWon.length)
        : 0;
    last7Days.push({
      date: key,
      label,
      played: dayRecs.length,
      won: dayWon.length,
      avgTime,
    });
  }

  // Accuracy trend from last 8 won games
  const recentWon = [...wonList]
    .sort((a, b) => a.completedAt - b.completedAt)
    .slice(-8);
  const accuracyTrend = recentWon.map((r, i) => ({
    label: `#${i + 1}`,
    accuracy: r.accuracy,
  }));

  // Real solving speed improvement comparing previous 7 days vs current 7 days
  const thisWeekWon = records.filter(
    (r) => r.won && r.completedAt >= nowMs - 7 * 86400000
  );
  const prevWeekWon = records.filter(
    (r) =>
      r.won &&
      r.completedAt >= nowMs - 14 * 86400000 &&
      r.completedAt < nowMs - 7 * 86400000
  );
  let speedImprovementPct: number | null = null;
  if (thisWeekWon.length >= 2 && prevWeekWon.length >= 2) {
    const avgThis =
      thisWeekWon.reduce((s, r) => s + r.elapsedSeconds, 0) / thisWeekWon.length;
    const avgPrev =
      prevWeekWon.reduce((s, r) => s + r.elapsedSeconds, 0) / prevWeekWon.length;
    if (avgPrev > 0) {
      speedImprovementPct = Math.round(((avgPrev - avgThis) / avgPrev) * 100);
    }
  } else if (wonList.length >= 4) {
    const half = Math.floor(wonList.length / 2);
    const sorted = [...wonList].sort((a, b) => a.completedAt - b.completedAt);
    const firstAvg = sorted.slice(0, half).reduce((s, r) => s + r.elapsedSeconds, 0) / half;
    const lastAvg =
      sorted.slice(half).reduce((s, r) => s + r.elapsedSeconds, 0) / (sorted.length - half);
    if (firstAvg > 0) {
      speedImprovementPct = Math.round(((firstAvg - lastAvg) / firstAvg) * 100);
    }
  }

  return {
    totalGames,
    gamesWon,
    winRate,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    bestScore,
    averageScore,
    perfectGames,
    totalMistakes,
    totalSolvingSeconds,
    bestTimeSeconds,
    averageTimeSeconds,
    totalHintsUsed,
    difficultyBreakdown,
    last7Days,
    accuracyTrend,
    speedImprovementPct,
  };
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
