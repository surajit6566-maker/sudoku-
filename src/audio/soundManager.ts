import type { MusicTrackId, UserSettings } from '../types/sudoku';

export type SoundEffectName =
  | 'cellSelect'
  | 'numberEntry'
  | 'correctNumber'
  | 'incorrectNumber'
  | 'erase'
  | 'notesToggle'
  | 'undo'
  | 'hint'
  | 'buttonClick'
  | 'puzzleCompleted'
  | 'levelUp'
  | 'achievementUnlocked'
  | 'dailyStreak'
  | 'countdown'
  | 'gameOver'
  | 'newGame';

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private soundEnabled = true;
  private sfxVolume = 0.7;
  private musicEnabled = false;
  private musicVolume = 0.35;
  private musicTrack: MusicTrackId = 'ambient-focus';
  private musicTimer: number | null = null;
  private musicStep = 0;
  private lastPlayedAt: Partial<Record<SoundEffectName, number>> = {};

  private ensureContext(fromGesture = false): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const ua = (navigator as unknown as { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (!fromGesture && ua && !ua.hasBeenActive && !this.ctx) {
      return null;
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.connect(this.ctx.destination);
      this.syncVolumes();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockFromGesture(): void {
    const ctx = this.ensureContext(true);
    if (ctx && this.soundEnabled && this.musicEnabled && this.musicTimer === null) {
      this.startMusicLoop();
    }
  }

  public applySettings(settings: Pick<UserSettings, 'soundEnabled' | 'sfxVolume' | 'musicEnabled' | 'musicVolume' | 'musicTrack'>): void {
    this.soundEnabled = settings.soundEnabled;
    this.sfxVolume = settings.sfxVolume;
    const trackChanged = this.musicTrack !== settings.musicTrack;
    this.musicTrack = settings.musicTrack;
    this.musicEnabled = settings.musicEnabled;
    this.musicVolume = settings.musicVolume;
    this.syncVolumes();

    if (!this.soundEnabled || !this.musicEnabled) {
      this.stopMusicLoop();
    } else if (this.ctx && (this.musicTimer === null || trackChanged)) {
      this.stopMusicLoop();
      this.startMusicLoop();
    }
  }

  private syncVolumes(): void {
    if (!this.ctx || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const effSfx = this.soundEnabled ? Math.min(0.6, Math.max(0, this.sfxVolume * 0.55)) : 0;
    const effMusic =
      this.soundEnabled && this.musicEnabled ? Math.min(0.3, Math.max(0, this.musicVolume * 0.28)) : 0;
    this.sfxGain.gain.setTargetAtTime(effSfx, now, 0.02);
    this.musicGain.gain.setTargetAtTime(effMusic, now, 0.05);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    delay = 0,
    gainVal = 0.25,
    endFreq?: number,
    destination: 'sfx' | 'music' = 'sfx'
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || !this.musicGain) return;
    const targetNode = destination === 'music' ? this.musicGain : this.sfxGain;
    const start = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    }

    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(gainVal, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(g);
    g.connect(targetNode);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  public play(name: SoundEffectName): void {
    if (!this.soundEnabled) return;
    const nowMs = performance.now();
    const minCooldown = name === 'cellSelect' || name === 'countdown' ? 45 : 65;
    if (this.lastPlayedAt[name] && nowMs - this.lastPlayedAt[name]! < minCooldown) {
      return;
    }
    this.lastPlayedAt[name] = nowMs;

    switch (name) {
      case 'cellSelect':
        this.playTone(540, 0.045, 'sine', 0, 0.14, 480);
        break;
      case 'numberEntry':
        this.playTone(320, 0.055, 'triangle', 0, 0.24, 210);
        this.playTone(640, 0.035, 'sine', 0.01, 0.12);
        break;
      case 'correctNumber':
        this.playTone(587.33, 0.09, 'sine', 0, 0.22);
        this.playTone(880, 0.14, 'sine', 0.055, 0.24);
        break;
      case 'incorrectNumber':
        this.playTone(190, 0.14, 'sawtooth', 0, 0.16, 130);
        this.playTone(145, 0.18, 'triangle', 0.08, 0.18, 110);
        break;
      case 'erase':
        this.playTone(360, 0.08, 'sine', 0, 0.18, 180);
        break;
      case 'notesToggle':
        this.playTone(720, 0.04, 'triangle', 0, 0.16, 920);
        break;
      case 'undo':
        this.playTone(520, 0.09, 'sine', 0, 0.18, 340);
        break;
      case 'hint':
        this.playTone(659.25, 0.12, 'sine', 0, 0.18);
        this.playTone(987.77, 0.14, 'sine', 0.06, 0.2);
        this.playTone(1318.51, 0.22, 'triangle', 0.12, 0.16);
        break;
      case 'buttonClick':
        this.playTone(460, 0.04, 'sine', 0, 0.13, 410);
        break;
      case 'puzzleCompleted': {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
        notes.forEach((n, idx) => this.playTone(n, 0.26, 'triangle', idx * 0.085, 0.25));
        break;
      }
      case 'levelUp':
        [440, 554.37, 659.25, 880, 1108.73].forEach((n, idx) =>
          this.playTone(n, 0.2, 'sine', idx * 0.07, 0.24)
        );
        break;
      case 'achievementUnlocked':
        [587.33, 739.99, 880, 1174.66].forEach((n, idx) =>
          this.playTone(n, 0.24, 'triangle', idx * 0.075, 0.22)
        );
        break;
      case 'dailyStreak':
        this.playTone(523.25, 0.12, 'sine', 0, 0.2);
        this.playTone(783.99, 0.16, 'sine', 0.07, 0.22);
        this.playTone(1046.5, 0.22, 'sine', 0.14, 0.22);
        break;
      case 'countdown':
        this.playTone(880, 0.035, 'sine', 0, 0.1);
        break;
      case 'gameOver':
        [392, 349.23, 311.13, 261.63].forEach((n, idx) =>
          this.playTone(n, 0.22, 'sine', idx * 0.11, 0.2)
        );
        break;
      case 'newGame':
        this.playTone(330, 0.09, 'sine', 0, 0.18, 520);
        this.playTone(660, 0.14, 'triangle', 0.06, 0.2, 880);
        break;
    }
  }

  public startMusicLoop(): void {
    if (typeof window === 'undefined' || !this.soundEnabled || !this.musicEnabled) return;
    if (this.musicTimer !== null) return;

    const scales: Record<MusicTrackId, number[]> = {
      'chill-electronic': [261.63, 311.13, 392.0, 466.16, 523.25, 392.0],
      lofi: [220.0, 261.63, 329.63, 392.0, 329.63, 293.66],
      'ambient-focus': [196.0, 246.94, 293.66, 392.0, 440.0, 293.66],
      'minimal-beats': [174.61, 220.0, 261.63, 349.23, 261.63, 220.0],
    };

    const intervalMs =
      this.musicTrack === 'minimal-beats'
        ? 460
        : this.musicTrack === 'chill-electronic'
          ? 560
          : this.musicTrack === 'lofi'
            ? 680
            : 950;

    const tick = () => {
      if (!this.soundEnabled || !this.musicEnabled || !this.ctx || this.ctx.state !== 'running') {
        return;
      }
      const seq = scales[this.musicTrack];
      const freq = seq[this.musicStep % seq.length];
      const wave: OscillatorType =
        this.musicTrack === 'ambient-focus'
          ? 'sine'
          : this.musicTrack === 'lofi'
            ? 'triangle'
            : 'sine';
      this.playTone(freq, intervalMs / 1000 * 1.4, wave, 0, 0.16, undefined, 'music');
      if (this.musicStep % 2 === 0) {
        this.playTone(freq / 2, intervalMs / 1000 * 1.8, 'sine', 0, 0.12, undefined, 'music');
      }
      this.musicStep++;
    };

    tick();
    this.musicTimer = window.setInterval(tick, intervalMs);
  }

  public stopMusicLoop(): void {
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundManager = new SoundManager();
