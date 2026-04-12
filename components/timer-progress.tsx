"use client";

interface TimerProgressProps {
  secondsLeft: number | null;
  totalSeconds: number | null;
  progress: number;
  ariaLabel: string;
  readingLockLabel: string;
  pendingText: string;
  unlocksAfterText: string;
}

export function TimerProgress({
  secondsLeft,
  totalSeconds,
  progress,
  ariaLabel,
  readingLockLabel,
  pendingText,
  unlocksAfterText
}: TimerProgressProps) {
  const isPending = secondsLeft === null || totalSeconds === null;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = isPending ? 0 : progress;
  const strokeDashoffset = circumference * (1 - safeProgress);

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-sm">
      <svg className="h-14 w-14" viewBox="0 0 64 64" role="img" aria-label={ariaLabel}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="url(#timerGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 32 32)"
        />
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ac9ff" />
            <stop offset="100%" stopColor="#54d19d" />
          </linearGradient>
        </defs>
      </svg>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{readingLockLabel}</p>
        <p className="font-serif text-lg leading-none text-ink">
          {isPending ? "—" : `${secondsLeft}s`}
        </p>
        <p className="text-[11px] text-muted">
          {isPending ? pendingText : unlocksAfterText || `Unlocks after ${totalSeconds}s`}
        </p>
      </div>
    </div>
  );
}
