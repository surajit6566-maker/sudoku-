import React, { useState } from 'react';
import { Download, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (compact) return null;
    return (
      <div className="inline-flex items-center gap-2 text-xs font-medium text-[#16C784]">
        <CheckCircle2 className="w-4 h-4" />
        <span>Installed as App</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087BFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#066AE0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E4F7] dark:border-[#233761] bg-white dark:bg-[#111C33] px-4 py-2 text-sm font-semibold text-[#18233D] dark:text-[#F1F5FF] hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#087BFF]" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1120]/60 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ios-install-title"
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111C33] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 id="ios-install-title" className="text-lg font-bold text-[#18233D] dark:text-white">
                  Install on iPhone or iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close installation instructions"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#5C6C8F] hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-[#5C6C8F] dark:text-[#93A7CE] list-decimal list-inside">
                <li>Tap the Share button in the Safari toolbar.</li>
                <li>Scroll down and tap Add to Home Screen.</li>
                <li>Tap Add to launch SUDOKU NEXUS offline anytime.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#087BFF] py-2.5 text-sm font-semibold text-white hover:bg-[#066AE0] cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
