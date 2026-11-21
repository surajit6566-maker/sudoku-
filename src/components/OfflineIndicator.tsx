import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#17264A] text-white px-3.5 py-2 text-xs font-medium shadow-lg border border-[#00C8FF]/40"
    >
      <WifiOff className="w-4 h-4 text-[#00C8FF]" />
      <span>Offline Mode · Local puzzles & progress active</span>
    </div>
  );
};
