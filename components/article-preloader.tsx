"use client";

import { motion } from "framer-motion";

interface ArticlePreloaderProps {
  label: string;
}

export function ArticlePreloader({ label }: ArticlePreloaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center rounded-[28px] bg-[#071224]/78 backdrop-blur-sm"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-sm text-ink">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
        <span>{label}</span>
      </div>
    </motion.div>
  );
}
