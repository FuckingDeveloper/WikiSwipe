"use client";

import { AppLanguage } from "@/lib/i18n";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileBottomNavProps {
  language: AppLanguage;
  labels: {
    home: string;
    leaderboard: string;
    aria: string;
    timerToggleAria?: string;
  };
  timer?: {
    secondsLeft: number;
    totalSeconds: number;
  };
  timerExpanded?: boolean;
  onTimerToggle?: () => void;
  onNavigate?: () => void;
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M3.5 10.2L12 3.5l8.5 6.7v9.3a1 1 0 0 1-1 1h-5.3v-6h-4.4v6H4.5a1 1 0 0 1-1-1v-9.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7.2 4h9.6v2.5a4.8 4.8 0 0 1-9.6 0V4Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.2 6.2H4.5A2.5 2.5 0 0 0 7 8.7h.2M16.8 6.2h2.7A2.5 2.5 0 0 1 17 8.7h-.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 11v3.3M8.7 20h6.6M9.4 17.5h5.2v2.5H9.4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MobileBottomNav({
  language,
  labels,
  timer,
  timerExpanded = false,
  onTimerToggle,
  onNavigate
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const homeActive = pathname === "/";
  const leaderboardActive = pathname === "/leaderboard";

  const progress = timer
    ? Math.min(1, Math.max(0, (timer.totalSeconds - timer.secondsLeft) / timer.totalSeconds))
    : 0;

  return (
    <motion.nav
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      aria-label={labels.aria}
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 md:hidden"
    >
      <div className={`grid ${timer ? "grid-cols-3" : "grid-cols-2"} gap-2 rounded-2xl border border-white/20 bg-[#09182f]/90 p-2 shadow-glow backdrop-blur-xl`}>
        <Link
          href={`/?lang=${language}`}
          aria-label={labels.home}
          onClick={onNavigate}
          className={`flex h-12 items-center justify-center rounded-xl border transition ${
            homeActive
              ? "border-brand/40 bg-brand/15 text-ink"
              : "border-white/15 bg-white/5 text-muted hover:bg-white/10 hover:text-ink"
          }`}
        >
          <HomeIcon />
          <span className="sr-only">{labels.home}</span>
        </Link>

        {timer ? (
          <button
            type="button"
            onClick={onTimerToggle}
            aria-label={labels.timerToggleAria ?? "Toggle timer info"}
            aria-expanded={timerExpanded}
            className={`flex h-12 items-center justify-center rounded-xl border text-ink transition ${
              timerExpanded
                ? "border-brand/40 bg-brand/15"
                : "border-white/15 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div
              className="relative flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(#49c6ff ${progress * 360}deg, rgba(255,255,255,0.14) 0deg)` }}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0b162a] text-[10px] font-semibold text-ink">
                {timer.secondsLeft}
              </div>
            </div>
          </button>
        ) : null}

        <Link
          href={`/leaderboard?lang=${language}`}
          aria-label={labels.leaderboard}
          onClick={onNavigate}
          className={`flex h-12 items-center justify-center rounded-xl border transition ${
            leaderboardActive
              ? "border-brand/40 bg-brand/15 text-ink"
              : "border-white/15 bg-white/5 text-muted hover:bg-white/10 hover:text-ink"
          }`}
        >
          <TrophyIcon />
          <span className="sr-only">{labels.leaderboard}</span>
        </Link>
      </div>
    </motion.nav>
  );
}
