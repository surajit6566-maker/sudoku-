import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAccuracy,
  calculateGameScore,
  calculateXpEarned,
  computeStatistics,
  createDefaultDailyMissions,
  evaluateNewAchievements,
  getLevelFromXp,
  isPerfectGame,
  updateDailyMissionsOnWin,
} from './progression';
import type { GameRecord, PlayerProfile } from '../types/sudoku';

const baseProfile: PlayerProfile = {
  username: 'Tester',
  avatarId: 'nexus-core',
  frameId: 'none',
  xp: 0,
  level: 1,
  currentStreak: 1,
  longestStreak: 1,
  lastPlayedDate: null,
  unlockedAchievements: [],
  unlockedRewards: ['classic-light', 'midnight-dark'],
  equippedBoardStyle: 'nexus-clean',
  equippedNumberStyle: 'geometric',
};

test('leveling curve progresses monotonically with XP', () => {
  const l1 = getLevelFromXp(0);
  assert.equal(l1.level, 1);
  const l2 = getLevelFromXp(350);
  assert.ok(l2.level >= 2);
  const lHigh = getLevelFromXp(5000);
  assert.ok(lHigh.level > l2.level);
  assert.ok(lHigh.progressPct >= 0 && lHigh.progressPct <= 100);
});

test('perfect-game badge is NEVER awarded if mistakes > 0 or hints > 0', () => {
  const recWithMistake: GameRecord = {
    id: 'r1',
    difficulty: 'medium',
    mode: 'classic',
    won: true,
    elapsedSeconds: 180,
    score: 1800,
    mistakes: 1,
    hintsUsed: 0,
    accuracy: 96,
    xpEarned: 150,
    completedAt: Date.now(),
    puzzleString: '0'.repeat(81),
    solutionString: '1'.repeat(81),
    finalGridString: '1'.repeat(81),
  };

  assert.equal(isPerfectGame(recWithMistake), false);
  const unlocked1 = evaluateNewAchievements(baseProfile, [recWithMistake], recWithMistake);
  assert.equal(
    unlocked1.some((a) => a.id === 'perfect-solver'),
    false,
    'must not unlock perfect-solver with mistakes'
  );

  const recWithHint: GameRecord = { ...recWithMistake, mistakes: 0, hintsUsed: 1 };
  assert.equal(isPerfectGame(recWithHint), false);
  const unlocked2 = evaluateNewAchievements(baseProfile, [recWithHint], recWithHint);
  assert.equal(
    unlocked2.some((a) => a.id === 'perfect-solver'),
    false,
    'must not unlock perfect-solver with hints'
  );

  const perfectRec: GameRecord = { ...recWithMistake, mistakes: 0, hintsUsed: 0 };
  assert.equal(isPerfectGame(perfectRec), true);
  const unlocked3 = evaluateNewAchievements(baseProfile, [perfectRec], perfectRec);
  assert.equal(
    unlocked3.some((a) => a.id === 'perfect-solver'),
    true,
    'should unlock perfect-solver on clean win'
  );
});

test('daily missions update accurately on win', () => {
  const missions = createDefaultDailyMissions();
  const winRec: GameRecord = {
    id: 'r2',
    difficulty: 'hard',
    mode: 'classic',
    won: true,
    elapsedSeconds: 210,
    score: 2500,
    mistakes: 0,
    hintsUsed: 0,
    accuracy: 100,
    xpEarned: 220,
    completedAt: Date.now(),
    puzzleString: '0'.repeat(81),
    solutionString: '1'.repeat(81),
    finalGridString: '1'.repeat(81),
  };

  const { nextMissions, bonusXp } = updateDailyMissionsOnWin(missions, winRec);
  assert.equal(nextMissions.find((m) => m.id === 'm-solve-2')?.progress, 1);
  assert.equal(nextMissions.find((m) => m.id === 'm-medium-plus')?.completed, true);
  assert.equal(nextMissions.find((m) => m.id === 'm-no-hints')?.completed, true);
  assert.equal(nextMissions.find((m) => m.id === 'm-under-5min')?.completed, true);
  assert.equal(bonusXp, 150 + 180 + 160);
});

test('statistics compute real aggregated metrics and respect timeframe filters', () => {
  const now = new Date('2026-11-21T12:00:00Z').getTime();
  const records: GameRecord[] = [
    {
      id: '1',
      difficulty: 'easy',
      mode: 'classic',
      won: true,
      elapsedSeconds: 120,
      score: 1200,
      mistakes: 0,
      hintsUsed: 0,
      accuracy: 100,
      xpEarned: 160,
      completedAt: now - 1000 * 60 * 30, // today
      puzzleString: '0'.repeat(81),
      solutionString: '1'.repeat(81),
      finalGridString: '1'.repeat(81),
    },
    {
      id: '2',
      difficulty: 'hard',
      mode: 'classic',
      won: false,
      elapsedSeconds: 300,
      score: 0,
      mistakes: 3,
      hintsUsed: 2,
      accuracy: 80,
      xpEarned: 20,
      completedAt: now - 86400000 * 10, // 10 days ago
      puzzleString: '0'.repeat(81),
      solutionString: '1'.repeat(81),
      finalGridString: '0'.repeat(81),
    },
  ];

  const todayStats = computeStatistics(records, baseProfile, 'today', now);
  assert.equal(todayStats.totalGames, 1);
  assert.equal(todayStats.gamesWon, 1);
  assert.equal(todayStats.winRate, 100);
  assert.equal(todayStats.bestScore, 1200);

  const allStats = computeStatistics(records, baseProfile, 'all', now);
  assert.equal(allStats.totalGames, 2);
  assert.equal(allStats.gamesWon, 1);
  assert.equal(allStats.winRate, 50);
  assert.equal(allStats.totalMistakes, 3);
});

test('scoring and accuracy penalize mistakes and hints', () => {
  const cleanScore = calculateGameScore({
    difficulty: 'medium',
    mode: 'classic',
    elapsedSeconds: 200,
    mistakes: 0,
    hintsUsed: 0,
    won: true,
  });
  const messyScore = calculateGameScore({
    difficulty: 'medium',
    mode: 'classic',
    elapsedSeconds: 200,
    mistakes: 2,
    hintsUsed: 2,
    won: true,
  });
  assert.ok(cleanScore > messyScore);
  assert.equal(
    calculateXpEarned({
      difficulty: 'expert',
      mode: 'mistake-free',
      mistakes: 0,
      hintsUsed: 0,
      won: true,
      currentStreak: 2,
    }) > 300,
    true
  );
  const acc = calculateAccuracy(new Array(81).fill(0), 2, 1);
  assert.ok(acc < 100 && acc > 50);
});
