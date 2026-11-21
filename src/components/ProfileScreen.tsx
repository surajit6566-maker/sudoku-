import React, { useState } from 'react';
import {
  Award,
  Check,
  Lock,
  Music,
  Palette,
  Sliders,
  Trash2,
  Volume2,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { AVATARS, BOARD_STYLES, FRAMES, NUMBER_STYLES, THEMES } from '../data/themes';
import { ACHIEVEMENTS, getLevelFromXp } from '../engine/progression';
import type { MusicTrackId, PlayerProfile, UserSettings } from '../types/sudoku';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileScreenProps {
  profile: PlayerProfile;
  settings: UserSettings;
  onUpdateProfile: (next: Partial<PlayerProfile>) => void;
  onUpdateSettings: (next: Partial<UserSettings>) => void;
  onReplayOnboarding: () => void;
  onResetAllData: () => void;
}

const MUSIC_TRACKS: Array<{ id: MusicTrackId; label: string }> = [
  { id: 'ambient-focus', label: 'Ambient Focus' },
  { id: 'chill-electronic', label: 'Chill Electronic' },
  { id: 'lofi', label: 'Lo-Fi Study' },
  { id: 'minimal-beats', label: 'Minimal Futuristic' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onReplayOnboarding,
  onResetAllData,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const levelInfo = getLevelFromXp(profile.xp);
  const unlockedSet = new Set(profile.unlockedAchievements);

  const activeAvatar = AVATARS.find((a) => a.id === profile.avatarId) ?? AVATARS[0];
  const activeFrame = FRAMES.find((f) => f.id === profile.frameId) ?? FRAMES[0];

  const isThemeUnlocked = (themeId: string, hint?: string) => {
    if (!hint) return true;
    if (themeId === 'ocean-blue') return unlockedSet.has('first-win');
    if (themeId === 'cyber-neon') return unlockedSet.has('seven-day-streak');
    if (themeId === 'lavender-dream') return unlockedSet.has('master-mind');
    if (themeId === 'sunset-gradient') return unlockedSet.has('puzzle-addict');
    return true;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Player Profile Header */}
      <section className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            className={`h-20 w-20 rounded-3xl bg-gradient-to-br ${activeAvatar.bg} ${activeFrame.ringClass} flex items-center justify-center text-white font-extrabold text-2xl shrink-0`}
          >
            {activeAvatar.glyph}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="profile-username" className="sr-only">
                Player Display Name
              </label>
              <input
                id="profile-username"
                type="text"
                maxLength={24}
                value={profile.username}
                onChange={(e) => onUpdateProfile({ username: e.target.value })}
                className="text-xl font-extrabold bg-transparent border-b border-transparent focus:border-[#087BFF] focus:outline-none text-[#18233D] dark:text-white"
              />
            </div>

            <div className="text-xs font-semibold text-[#5C6C8F] dark:text-[#93A7CE] tabular-nums">
              Level {levelInfo.level} · {profile.xp.toLocaleString()} Total XP ·{' '}
              {profile.unlockedAchievements.length}/{ACHIEVEMENTS.length} Badges
            </div>

            <div className="flex items-center gap-3">
              <div className="w-56 h-2 rounded-full bg-[#EDF3FF] dark:bg-[#17264A] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#087BFF] to-[#00C8FF]"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <span className="text-xs font-mono-tabular text-[#5C6C8F] dark:text-[#93A7CE]">
                {levelInfo.progressPct}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PWAInstallButton />
          <button
            type="button"
            onClick={onReplayOnboarding}
            className="min-h-[42px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-4 py-2 text-xs font-semibold text-[#18233D] dark:text-white hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
          >
            Replay Tutorial
          </button>
        </div>
      </section>

      {/* Avatar & Frame Customization */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#18233D] dark:text-white">
            Avatars & Profile Frames
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((av) => {
              const selected = profile.avatarId === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => onUpdateProfile({ avatarId: av.id })}
                  className={`rounded-xl p-3 border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    selected
                      ? 'border-[#087BFF] bg-[#DCEEFF]/40 dark:bg-[#19315E]/40'
                      : 'border-[#D9E4F7] dark:border-[#233761]'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-xl bg-gradient-to-br ${av.bg} flex items-center justify-center text-white text-xs font-extrabold`}
                  >
                    {av.glyph}
                  </div>
                  <span className="text-[11px] font-semibold text-center">{av.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {FRAMES.map((fr) => {
              const selected = profile.frameId === fr.id;
              return (
                <button
                  key={fr.id}
                  type="button"
                  onClick={() => onUpdateProfile({ frameId: fr.id })}
                  className={`min-h-[42px] rounded-xl border px-3 text-xs font-semibold cursor-pointer ${
                    selected
                      ? 'border-[#087BFF] bg-[#087BFF] text-white'
                      : 'border-[#D9E4F7] dark:border-[#233761] hover:border-[#087BFF]'
                  }`}
                >
                  {fr.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio & Music Settings */}
        <div className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#18233D] dark:text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#087BFF]" />
              <span>Sound & Ambient Music</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                soundManager.unlockFromGesture();
                soundManager.play('puzzleCompleted');
              }}
              className="text-xs font-semibold text-[#087BFF] dark:text-[#00C8FF] hover:underline cursor-pointer"
            >
              Test Audio
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Global Sound Effects</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.soundEnabled}
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`min-h-[36px] px-4 rounded-xl text-xs font-bold cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-[#087BFF] text-white'
                  : 'bg-[#EDF3FF] dark:bg-[#17264A] text-[#5C6C8F]'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
              <label htmlFor="sfx-volume">Effects Volume</label>
              <span className="font-mono-tabular">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              id="sfx-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => onUpdateSettings({ sfxVolume: Number(e.target.value) })}
              className="w-full accent-[#087BFF] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#D9E4F7] dark:border-[#233761]">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Music className="w-4 h-4 text-[#087BFF]" />
              <span>Background Focus Music</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.musicEnabled}
              onClick={() => {
                soundManager.unlockFromGesture();
                onUpdateSettings({ musicEnabled: !settings.musicEnabled });
              }}
              className={`min-h-[36px] px-4 rounded-xl text-xs font-bold cursor-pointer ${
                settings.musicEnabled
                  ? 'bg-[#087BFF] text-white'
                  : 'bg-[#EDF3FF] dark:bg-[#17264A] text-[#5C6C8F]'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
              <label htmlFor="music-volume">Music Volume</label>
              <span className="font-mono-tabular">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              id="music-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => onUpdateSettings({ musicVolume: Number(e.target.value) })}
              className="w-full accent-[#087BFF] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MUSIC_TRACKS.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => onUpdateSettings({ musicTrack: track.id })}
                className={`min-h-[38px] rounded-xl border px-3 text-xs font-semibold cursor-pointer ${
                  settings.musicTrack === track.id
                    ? 'border-[#087BFF] bg-[#DCEEFF] dark:bg-[#19315E] text-[#087BFF] dark:text-[#00C8FF]'
                    : 'border-[#D9E4F7] dark:border-[#233761]'
                }`}
              >
                {track.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Theme Customizer (8 Themes + Board/Number Styles) */}
      <section className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-[#18233D] dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#087BFF]" />
            <span>Theme & Visual Personalization</span>
          </h2>
          <p className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] mt-0.5">
            Switch instantly between light, dark, and unlockable signature themes.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEMES.map((t) => {
            const active = settings.theme === t.id;
            const unlocked = isThemeUnlocked(t.id, t.unlockHint);
            return (
              <button
                key={t.id}
                type="button"
                disabled={!unlocked}
                onClick={() => onUpdateSettings({ theme: t.id })}
                className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  active
                    ? 'border-[#087BFF] ring-2 ring-[#087BFF]/30'
                    : 'border-[#D9E4F7] dark:border-[#233761] hover:border-[#087BFF]/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: t.previewBg }}
                    />
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: t.previewPrimary }}
                    />
                  </div>
                  {active ? (
                    <Check className="w-4 h-4 text-[#087BFF]" />
                  ) : !unlocked ? (
                    <Lock className="w-3.5 h-3.5 text-[#5C6C8F]" />
                  ) : null}
                </div>
                <div className="mt-2.5 text-sm font-bold text-[#18233D] dark:text-white">
                  {t.name}
                </div>
                <div className="text-[11px] text-[#5C6C8F] dark:text-[#93A7CE]">
                  {unlocked ? (t.isDark ? 'Dark mode' : 'Light mode') : t.unlockHint}
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#D9E4F7] dark:border-[#233761]">
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#5C6C8F] dark:text-[#93A7CE]">Board Style</div>
            <div className="grid grid-cols-2 gap-2">
              {BOARD_STYLES.map((bs) => (
                <button
                  key={bs.id}
                  type="button"
                  onClick={() => onUpdateProfile({ equippedBoardStyle: bs.id })}
                  className={`min-h-[40px] rounded-xl border px-3 text-xs font-semibold cursor-pointer ${
                    profile.equippedBoardStyle === bs.id
                      ? 'border-[#087BFF] bg-[#087BFF] text-white'
                      : 'border-[#D9E4F7] dark:border-[#233761]'
                  }`}
                >
                  {bs.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-[#5C6C8F] dark:text-[#93A7CE]">
              Number Typography
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NUMBER_STYLES.map((ns) => (
                <button
                  key={ns.id}
                  type="button"
                  onClick={() => onUpdateProfile({ equippedNumberStyle: ns.id })}
                  className={`min-h-[40px] rounded-xl border px-3 text-xs font-semibold cursor-pointer ${
                    profile.equippedNumberStyle === ns.id
                      ? 'border-[#087BFF] bg-[#087BFF] text-white'
                      : 'border-[#D9E4F7] dark:border-[#233761]'
                  }`}
                >
                  {ns.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-[#5C6C8F] dark:text-[#93A7CE]">
              Grid Line Weight
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['thin', 'balanced', 'bold'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdateSettings({ gridThickness: w })}
                  className={`min-h-[40px] rounded-xl border px-2 text-xs font-semibold capitalize cursor-pointer ${
                    settings.gridThickness === w
                      ? 'border-[#087BFF] bg-[#087BFF] text-white'
                      : 'border-[#D9E4F7] dark:border-[#233761]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility & Gameplay Preferences */}
      <section className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#18233D] dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#087BFF]" />
          <span>Gameplay & Accessibility Controls</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              key: 'highContrast' as const,
              label: 'High-Contrast Accessibility',
              val: settings.highContrast,
            },
            {
              key: 'reducedMotion' as const,
              label: 'Reduced Motion',
              val: settings.reducedMotion,
            },
            {
              key: 'autoRemoveNotes' as const,
              label: 'Auto-Remove Conflicting Notes',
              val: settings.autoRemoveNotes,
            },
            {
              key: 'autoCheck' as const,
              label: 'Auto-Check Mistakes',
              val: settings.autoCheck,
            },
            {
              key: 'highlightDuplicates' as const,
              label: 'Highlight Duplicates',
              val: settings.highlightDuplicates,
            },
            {
              key: 'hapticsEnabled' as const,
              label: 'Haptic Feedback (Mobile)',
              val: settings.hapticsEnabled,
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              role="switch"
              aria-checked={item.val}
              onClick={() => onUpdateSettings({ [item.key]: !item.val })}
              className="min-h-[48px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-4 py-2.5 flex items-center justify-between text-xs font-semibold cursor-pointer hover:border-[#087BFF]"
            >
              <span>{item.label}</span>
              <span
                className={`px-2.5 py-1 rounded-md font-bold ${
                  item.val
                    ? 'bg-[#087BFF] text-white'
                    : 'bg-[#EDF3FF] dark:bg-[#17264A] text-[#5C6C8F]'
                }`}
              >
                {item.val ? 'ON' : 'OFF'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Achievements Gallery */}
      <section className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#18233D] dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#087BFF]" />
            <span>Achievements & Unlockable Rewards</span>
          </h2>
          <span className="text-xs font-mono-tabular text-[#5C6C8F] dark:text-[#93A7CE]">
            {profile.unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = unlockedSet.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-xl border p-4 ${
                  unlocked
                    ? 'border-[#16C784]/50 bg-[#16C784]/10'
                    : 'border-[#D9E4F7] dark:border-[#233761] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={unlocked ? 'text-[#16C784]' : 'text-[#5C6C8F]'}>
                    {unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                  <span className="font-mono-tabular text-[#087BFF] dark:text-[#00C8FF]">
                    +{ach.xpReward} XP
                  </span>
                </div>
                <div className="mt-1.5 font-bold text-sm text-[#18233D] dark:text-white">
                  {ach.title}
                </div>
                <p className="mt-0.5 text-xs text-[#5C6C8F] dark:text-[#93A7CE]">
                  {ach.description}
                </p>
                <div className="mt-2 text-[11px] font-semibold text-[#18233D] dark:text-[#D9E4F7]">
                  Reward: {ach.rewardLabel}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Local Data Management */}
      <section className="rounded-2xl bg-[var(--nx-surface)] border border-[#D9E4F7] dark:border-[#233761] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#18233D] dark:text-white">
            Privacy-First Local Storage
          </h2>
          <p className="text-xs text-[#5C6C8F] dark:text-[#93A7CE] mt-0.5">
            All game saves, statistics, and preferences stay on your device.
          </p>
        </div>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-[#FF5263]/40 px-4 py-2 text-xs font-semibold text-[#FF5263] hover:bg-[#FF5263]/10 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Local Progress</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmReset(false);
                onResetAllData();
              }}
              className="min-h-[42px] rounded-xl bg-[#FF5263] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="min-h-[42px] rounded-xl border border-[#D9E4F7] dark:border-[#233761] px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
