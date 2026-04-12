"use client";

import { motion } from "framer-motion";

interface VoteControlsProps {
  locked: boolean;
  busy: boolean;
  onLike: () => void;
  onDislike: () => void;
  labels: {
    no: string;
    yes: string;
    swipeLeft: string;
    swipeRight: string;
    locked: string;
    saving: string;
    unlocked: string;
    sectionAria: string;
  };
}

function ControlButton({
  label,
  hint,
  disabled,
  intent,
  onClick
}: {
  label: string;
  hint: string;
  disabled: boolean;
  intent: "positive" | "negative";
  onClick: () => void;
}) {
  const intentClass =
    intent === "positive"
      ? "border-positive/45 bg-positive/10 text-positive hover:bg-positive/20"
      : "border-negative/45 bg-negative/10 text-negative hover:bg-negative/20";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      whileHover={disabled ? undefined : { y: -1, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={`flex min-h-[72px] w-full flex-col items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${intentClass} disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/5 disabled:text-muted`}
    >
      <span className="text-base">{label}</span>
      <span className="text-xs opacity-80">{hint}</span>
    </motion.button>
  );
}

export function VoteControls({ locked, busy, onLike, onDislike, labels }: VoteControlsProps) {
  const disabled = locked || busy;

  return (
    <section aria-label={labels.sectionAria} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <ControlButton
          label={labels.no}
          hint={labels.swipeLeft}
          disabled={disabled}
          intent="negative"
          onClick={onDislike}
        />
        <ControlButton
          label={labels.yes}
          hint={labels.swipeRight}
          disabled={disabled}
          intent="positive"
          onClick={onLike}
        />
      </div>
      <p className="text-center text-xs text-muted">
        {locked ? labels.locked : busy ? labels.saving : labels.unlocked}
      </p>
    </section>
  );
}
