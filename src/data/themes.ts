import type { BoardStyleId, NumberStyleId, ThemeId } from '../types/sudoku';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  isDark: boolean;
  previewBg: string;
  previewSurface: string;
  previewPrimary: string;
  previewAccent: string;
  unlockHint?: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'classic-light',
    name: 'Classic Light',
    isDark: false,
    previewBg: '#F5F8FF',
    previewSurface: '#FFFFFF',
    previewPrimary: '#087BFF',
    previewAccent: '#00C8FF',
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Dark',
    isDark: true,
    previewBg: '#0A1120',
    previewSurface: '#111C33',
    previewPrimary: '#2B8FFF',
    previewAccent: '#00C8FF',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    isDark: false,
    previewBg: '#EAF4FF',
    previewSurface: '#FFFFFF',
    previewPrimary: '#0066E6',
    previewAccent: '#00B8D9',
    unlockHint: 'Win 1 game to unlock',
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    isDark: true,
    previewBg: '#090E1C',
    previewSurface: '#121933',
    previewPrimary: '#00C8FF',
    previewAccent: '#16C784',
    unlockHint: '7-day streak to unlock',
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    isDark: false,
    previewBg: '#F4F3FF',
    previewSurface: '#FFFFFF',
    previewPrimary: '#5B4BFF',
    previewAccent: '#00C8FF',
    unlockHint: 'Conquer Master to unlock',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    isDark: false,
    previewBg: '#FAFAFC',
    previewSurface: '#FFFFFF',
    previewPrimary: '#17264A',
    previewAccent: '#087BFF',
  },
  {
    id: 'amoled-black',
    name: 'AMOLED Black',
    isDark: true,
    previewBg: '#000000',
    previewSurface: '#0B0F19',
    previewPrimary: '#087BFF',
    previewAccent: '#00C8FF',
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Horizon',
    isDark: false,
    previewBg: '#FFF5F2',
    previewSurface: '#FFFFFF',
    previewPrimary: '#E5484D',
    previewAccent: '#087BFF',
    unlockHint: 'Win 15 games to unlock',
  },
];

export const BOARD_STYLES: Array<{ id: BoardStyleId; label: string; description: string }> = [
  { id: 'nexus-clean', label: 'Nexus Clean', description: 'Crisp architectural borders with soft blue highlights' },
  { id: 'architect-grid', label: 'Architect Grid', description: 'Precision hairline drafting layout' },
  { id: 'rounded-tiles', label: 'Tactile Tiles', description: 'Elevated rounded individual cells' },
  { id: 'obsidian-slate', label: 'Obsidian Slate', description: 'High-contrast deep surface contrast' },
];

export const NUMBER_STYLES: Array<{ id: NumberStyleId; label: string; className: string }> = [
  { id: 'geometric', label: 'Geometric Sans', className: 'font-sans font-bold' },
  { id: 'mono-tech', label: 'Mono Tech', className: 'font-mono-tabular font-bold' },
  { id: 'editorial', label: 'Clean Light', className: 'font-sans font-semibold tracking-tight' },
  { id: 'bold-arcade', label: 'Bold Arcade', className: 'font-sans font-extrabold' },
];

export const AVATARS: Array<{ id: string; label: string; bg: string; glyph: string }> = [
  { id: 'nexus-core', label: 'Nexus Core', bg: 'from-[#087BFF] to-[#00C8FF]', glyph: 'NX' },
  { id: 'orbit-blue', label: 'Orbit Alpha', bg: 'from-[#17264A] to-[#087BFF]', glyph: '9X' },
  { id: 'prism-spark', label: 'Prism Emerald', bg: 'from-[#16C784] to-[#00C8FF]', glyph: 'PS' },
  { id: 'cyber-fox', label: 'Apex Indigo', bg: 'from-[#4F46E5] to-[#087BFF]', glyph: 'AX' },
];

export const FRAMES: Array<{ id: string; label: string; ringClass: string }> = [
  { id: 'none', label: 'Clean Ring', ringClass: 'ring-2 ring-[#087BFF]/30' },
  { id: 'prism-gold', label: 'Prism Gold', ringClass: 'ring-2 ring-amber-400 shadow-sm shadow-amber-400/30' },
  { id: 'nexus-apex', label: 'Nexus Apex', ringClass: 'ring-2 ring-[#00C8FF] shadow-sm shadow-[#00C8FF]/40' },
];

export function applyThemeToDocument(themeId: ThemeId, highContrast: boolean, reducedMotion: boolean): void {
  if (typeof document === 'undefined') return;
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const root = document.documentElement;
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.dataset.theme = theme.id;
  root.classList.toggle('high-contrast', highContrast);
  root.classList.toggle('reduced-motion', reducedMotion);

  // Set dynamic theme palette variables
  const vars: Record<string, string> = {
    '--nx-bg': theme.previewBg,
    '--nx-surface': theme.previewSurface,
    '--nx-primary': theme.previewPrimary,
    '--nx-secondary': theme.previewAccent,
  };
  if (highContrast) {
    vars['--nx-bg'] = theme.isDark ? '#000000' : '#FFFFFF';
    vars['--nx-surface'] = theme.isDark ? '#080C14' : '#FFFFFF';
    vars['--nx-border'] = theme.isDark ? '#60A5FA' : '#17264A';
  }
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
