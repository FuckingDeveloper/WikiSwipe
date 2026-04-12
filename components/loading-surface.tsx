"use client";

import { ArticlePreloader } from "@/components/article-preloader";

interface LoadingSurfaceProps {
  label: string;
  minHeightClassName?: string;
}

export function LoadingSurface({
  label,
  minHeightClassName = "min-h-[560px]"
}: LoadingSurfaceProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/15 bg-panel/70 shadow-glow ${minHeightClassName}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(73,198,255,0.2),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(84,209,157,0.16),transparent_35%),linear-gradient(140deg,#14233a,#08111d)]" />
      <ArticlePreloader label={label} />
    </div>
  );
}
