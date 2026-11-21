import { createDefaultDailyMissions, getLevelFromXp } from '../engine/progression';
import { getDailyDateString } from '../engine/sudokuEngine';
import type {
  ActiveGameState,
  DailyCompletion,
  DailyMission,
  GameRecord,
  LocalLeaderboardEntry,
  PlayerProfile,
  UserSettings,
} from '../types/sudoku';

const KEYS = {
  ACTIVE_GAME: 'sudoku_nexus_active_game_v1',
  RECORDS: 'sudoku_nexus_records_v1',
  DAILY: 'sudoku_nexus_daily_v1',
  PROFILE: 'sudoku_nexus_profile_v1',
  SETTINGS: 'sudoku_nexus_settings_v1',
  MISSIONS: 'sudoku_nexus_missions_v1',
  COMMUNITY: 'sudoku_nexus_community_v1',
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues safely
  }
}

export const DEFAULT_PROFILE: PlayerProfile = {
  username: 'Nexus Solver',
  avatarId: 'nexus-core',
  frameId: 'none',
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
  unlockedAchievements: [],
  unlockedRewards: ['classic-light', 'midnight-dark', 'minimal-white', 'amoled-black'],
  equippedBoardStyle: 'nexus-clean',
  equippedNumberStyle: 'geometric',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'classic-light',
  highContrast: false,
  reducedMotion: false,
  soundEnabled: true,
  sfxVolume: 0.7,
  musicEnabled: false,
  musicVolume: 0.35,
  musicTrack: 'ambient-focus',
  autoCheck: true,
  highlightDuplicates: true,
  highlightRemaining: true,
  autoRemoveNotes: true,
  hapticsEnabled: true,
  gridThickness: 'balanced',
  animationIntensity: 'dynamic',
  hasCompletedOnboarding: false,
};

export function loadActiveGame(): ActiveGameState | null {
  return safeRead<ActiveGameState | null>(KEYS.ACTIVE_GAME, null);
}

export function saveActiveGame(game: ActiveGameState | null): void {
  if (!game) {
    try {
      localStorage.removeItem(KEYS.ACTIVE_GAME);
    } catch {
      // ignore
    }
    return;
  }
  safeWrite(KEYS.ACTIVE_GAME, game);
}

export function loadGameRecords(): GameRecord[] {
  return safeRead<GameRecord[]>(KEYS.RECORDS, []);
}

export function appendGameRecord(record: GameRecord): GameRecord[] {
  const existing = loadGameRecords();
  const next = [record, ...existing].slice(0, 300);
  safeWrite(KEYS.RECORDS, next);
  return next;
}

export function loadDailyCompletions(): DailyCompletion[] {
  return safeRead<DailyCompletion[]>(KEYS.DAILY, []);
}

export function saveDailyCompletion(entry: DailyCompletion): DailyCompletion[] {
  const existing = loadDailyCompletions().filter((d) => d.date !== entry.date);
  const next = [entry, ...existing];
  safeWrite(KEYS.DAILY, next);
  return next;
}

export function loadPlayerProfile(): PlayerProfile {
  const p = safeRead<PlayerProfile>(KEYS.PROFILE, DEFAULT_PROFILE);
  const lvl = getLevelFromXp(p.xp);
  return { ...DEFAULT_PROFILE, ...p, level: lvl.level };
}

export function savePlayerProfile(profile: PlayerProfile): PlayerProfile {
  const lvl = getLevelFromXp(profile.xp);
  const synced = { ...profile, level: lvl.level };
  safeWrite(KEYS.PROFILE, synced);
  return synced;
}

export function loadUserSettings(): UserSettings {
  return { ...DEFAULT_SETTINGS, ...safeRead<Partial<UserSettings>>(KEYS.SETTINGS, {}) };
}

export function saveUserSettings(settings: UserSettings): void {
  safeWrite(KEYS.SETTINGS, settings);
}

export function loadDailyMissions(): { date: string; missions: DailyMission[] } {
  const today = getDailyDateString();
  const stored = safeRead<{ date: string; missions: DailyMission[] } | null>(
    KEYS.MISSIONS,
    null
  );
  if (!stored || stored.date !== today) {
    const fresh = { date: today, missions: createDefaultDailyMissions() };
    safeWrite(KEYS.MISSIONS, fresh);
    return fresh;
  }
  return stored;
}

export function saveDailyMissions(date: string, missions: DailyMission[]): void {
  safeWrite(KEYS.MISSIONS, { date, missions });
}

export function updateStreakOnWin(profile: PlayerProfile, dateStr: string = getDailyDateString()): PlayerProfile {
  if (profile.lastPlayedDate === dateStr) return profile;

  let nextStreak = 1;
  if (profile.lastPlayedDate) {
    const prev = new Date(`${profile.lastPlayedDate}T00:00:00`);
    const curr = new Date(`${dateStr}T00:00:00`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      nextStreak = profile.currentStreak + 1;
    } else if (diffDays === 0) {
      nextStreak = Math.max(1, profile.currentStreak);
    }
  }

  return {
    ...profile,
    currentStreak: nextStreak,
    longestStreak: Math.max(profile.longestStreak, nextStreak),
    lastPlayedDate: dateStr,
  };
}

export function loadLocalLeaderboard(): LocalLeaderboardEntry[] {
  const saved = safeRead<LocalLeaderboardEntry[] | null>(KEYS.COMMUNITY, null);
  if (saved) return saved;
  const today = getDailyDateString();
  // Clearly labeled local demo benchmark rivals so users can test rankings offline
  const seed: LocalLeaderboardEntry[] = [
    {
      id: 'demo-1',
      name: 'Kira_Logic (Demo)',
      avatarId: 'prism-spark',
      score: 4820,
      timeSeconds: 184,
      difficulty: 'hard',
      accuracy: 100,
      date: today,
    },
    {
      id: 'demo-2',
      name: 'MiloV (Demo)',
      avatarId: 'cyber-fox',
      score: 3640,
      timeSeconds: 242,
      difficulty: 'hard',
      accuracy: 97,
      date: today,
    },
    {
      id: 'demo-3',
      name: 'Sora9x9 (Demo)',
      avatarId: 'orbit-blue',
      score: 2910,
      timeSeconds: 315,
      difficulty: 'medium',
      accuracy: 95,
      date: today,
    },
  ];
  safeWrite(KEYS.COMMUNITY, seed);
  return seed;
}

export function recordLocalLeaderboardScore(entry: LocalLeaderboardEntry): LocalLeaderboardEntry[] {
  const existing = loadLocalLeaderboard();
  const next = [...existing, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);
  safeWrite(KEYS.COMMUNITY, next);
  return next;
}
