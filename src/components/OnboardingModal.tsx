import React, { useState } from 'react';
import { Grid3X3, Pencil, Sparkles, Trophy, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: 'Master the 9×9 Grid',
    description:
      'Fill every row, column, and 3×3 subgrid with digits 1 through 9 without repeating any number in the same unit.',
    tip: 'Tap any cell or use Arrow keys + number keys 1–9 on desktop.',
    icon: Grid3X3,
  },
  {
    title: 'Use Smart Pencil Notes',
    description:
      'Toggle Notes Mode (or press N) to jot down possible candidates inside a cell. Placing a solved digit automatically clears conflicting peer notes.',
    tip: 'Use Undo and Redo freely while exploring candidate chains.',
    icon: Pencil,
  },
  {
    title: '4-Stage Progressive Hints',
    description:
      'Stuck on a tough deduction? Smart Hints guide you step-by-step: first highlighting the region, then explaining the technique, showing candidates, and finally revealing the answer.',
    tip: 'Want to learn X-Wing or Swordfish? Visit the Technique Coach under Challenges.',
    icon: Sparkles,
  },
  {
    title: 'Modes, Missions & Streaks',
    description:
      'Switch between Classic, Speed Run, Mistake-Free, Zen, and Smart Focus modes. Complete Daily Challenges and missions to earn XP and unlock themes.',
    tip: 'All progress auto-saves locally so you never lose a board.',
    icon: Trophy,
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1120]/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111C33] border border-[#D9E4F7] dark:border-[#233761] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#087BFF] tabular-nums">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip tutorial"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#5C6C8F] hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCEEFF] dark:bg-[#19315E] text-[#087BFF]">
          <Icon className="w-6 h-6" />
        </div>

        <h2
          id="onboarding-title"
          className="mt-4 text-xl font-bold text-[#18233D] dark:text-white"
        >
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5C6C8F] dark:text-[#93A7CE]">
          {step.description}
        </p>

        <div className="mt-4 rounded-xl bg-[#F5F8FF] dark:bg-[#17264A]/60 border border-[#D9E4F7] dark:border-[#233761] p-3.5 text-xs text-[#18233D] dark:text-[#D9E4F7]">
          {step.tip}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-[#5C6C8F] dark:text-[#93A7CE] hover:bg-[#EDF3FF] dark:hover:bg-[#17264A] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#087BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#066AE0] cursor-pointer"
            >
              <span>Start Playing</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#087BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#066AE0] cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
