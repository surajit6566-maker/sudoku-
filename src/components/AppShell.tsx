import React from 'react';
import { BarChart3, CalendarDays, Grid3X3, Home, User } from 'lucide-react';
import type { NavigationTab, ScreenView } from '../types/sudoku';
import { OfflineIndicator } from './OfflineIndicator';

interface AppShellProps {
  activeTab: NavigationTab;
  currentView: ScreenView;
  onNavigate: (tab: NavigationTab) => void;
  onQuickStart: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{ id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'play', label: 'Play', icon: Grid3X3 },
  { id: 'challenges', label: 'Challenges', icon: CalendarDays },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  currentView,
  onNavigate,
  onQuickStart,
  children,
}) => {
  // Distraction-free gameplay: hide top/bottom navigation when solving or celebrating
  const hideChrome = currentView === 'game';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--nx-bg)] text-[#18233D] dark:text-[#F1F5FF] transition-colors duration-200">
      {!hideChrome && (
        <header className="sticky top-0 z-30 border-b border-[#D9E4F7] dark:border-[#233761] bg-[var(--nx-surface)]/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
            {/* Zone 1: Single-element Brand wordmark */}
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-lg font-extrabold tracking-tight text-[#17264A] dark:text-white whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2.5"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#087BFF] text-white text-xs font-extrabold">
                9×9
              </span>
              <span>SUDOKU NEXUS</span>
            </button>

            {/* Zone 2: 5 concise single-line nav links on desktop */}
            <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'text-[#087BFF] dark:text-[#00C8FF]'
                        : 'text-[#5C6C8F] dark:text-[#93A7CE] hover:text-[#18233D] dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#087BFF] dark:bg-[#00C8FF]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Single primary action */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={onQuickStart}
                className="min-h-[40px] rounded-xl bg-[#087BFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#066AE0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Play Now
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 ${!hideChrome ? 'pb-20 md:pb-8' : ''}`}>{children}</main>

      {!hideChrome && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-[#D9E4F7] dark:border-[#233761] bg-[var(--nx-surface)]/95 backdrop-blur-md grid grid-cols-5 items-center"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#087BFF] dark:text-[#00C8FF]'
                    : 'text-[#5C6C8F] dark:text-[#93A7CE]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      <OfflineIndicator />
    </div>
  );
};
