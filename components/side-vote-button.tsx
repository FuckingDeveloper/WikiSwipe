"use client";

interface SideVoteButtonProps {
  direction: "left" | "right";
  locked: boolean;
  busy: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}

export function SideVoteButton({ direction, locked, busy, onClick, label, hint }: SideVoteButtonProps) {
  const disabled = locked || busy;
  const isRight = direction === "right";

  const styles = isRight
    ? "border-positive/45 bg-positive/10 text-positive hover:bg-positive/20"
    : "border-negative/45 bg-negative/10 text-negative hover:bg-negative/20";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`sticky top-28 flex h-[420px] w-full flex-col items-center justify-center rounded-3xl border px-2 text-center transition-all ${styles} disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/5 disabled:text-muted`}
    >
      <span className="font-serif text-4xl leading-none">{isRight ? "→" : "←"}</span>
      <span className="mt-4 text-lg font-semibold">{label}</span>
      <span className="mt-1 text-xs opacity-80">{hint}</span>
    </button>
  );
}
