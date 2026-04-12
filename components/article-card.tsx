"use client";

import { useSwipe } from "@/hooks/useSwipe";
import { NormalizedArticle, SwipeDirection } from "@/lib/types";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";

interface ArticleCardProps {
  article: NormalizedArticle;
  canSwipe: boolean;
  disabled: boolean;
  pendingSwipe: SwipeDirection | null;
  onSwipeVote: (direction: SwipeDirection) => void;
  labels: {
    yes: string;
    no: string;
    machineTranslatedBadge: string;
    openWikipedia: string;
    noImage: string;
    articleAriaPrefix: string;
  };
}

function splitSummary(summary: string): string[] {
  return summary
    .split(/\.\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .reduce<string[]>((chunks, sentence, index) => {
      if (index % 2 === 0) {
        chunks.push(sentence);
      } else {
        const previous = chunks[chunks.length - 1] ?? "";
        chunks[chunks.length - 1] = `${previous}. ${sentence}`;
      }
      return chunks;
    }, []);
}

function isWikimediaUrl(url: string): boolean {
  try {
    return new URL(url).hostname === "upload.wikimedia.org";
  } catch {
    return false;
  }
}

export function ArticleCard({
  article,
  canSwipe,
  disabled,
  pendingSwipe,
  onSwipeVote,
  labels
}: ArticleCardProps) {
  const swipe = useSwipe({
    enabled: canSwipe && !disabled,
    onSwipe: onSwipeVote
  });

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-9, 0, 9]);
  const likeOpacity = useTransform(x, [40, 180], [0, 1]);
  const nopeOpacity = useTransform(x, [-180, -40], [1, 0]);
  const paragraphs = useMemo(() => splitSummary(article.summary), [article.summary]);

  return (
    <motion.article
      key={article.pageId}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        x: pendingSwipe === "left" ? -800 : pendingSwipe === "right" ? 800 : 0,
        rotate: pendingSwipe === "left" ? -12 : pendingSwipe === "right" ? 12 : 0
      }}
      transition={{ duration: pendingSwipe ? 0.32 : 0.45, ease: "easeOut" }}
      style={{ x, rotate }}
      className="relative overflow-hidden rounded-[28px] border border-white/15 bg-panel/80 shadow-glow backdrop-blur-xl"
      drag={swipe.drag}
      dragElastic={swipe.dragElastic}
      dragMomentum={swipe.dragMomentum}
      dragConstraints={swipe.dragConstraints}
      onDragEnd={swipe.onDragEnd}
      role="article"
      aria-label={`${labels.articleAriaPrefix}: ${article.title}`}
    >
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-5 z-20 rounded-full border border-positive/60 bg-positive/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-positive"
      >
        {labels.yes}
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="pointer-events-none absolute right-5 top-5 z-20 rounded-full border border-negative/60 bg-negative/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-negative"
      >
        {labels.no}
      </motion.div>

      <div className="relative h-60 w-full overflow-hidden sm:h-72">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover"
            unoptimized={isWikimediaUrl(article.imageUrl)}
            priority
          />
        ) : (
          <>
            <Image
              src="/placeholder-article.svg"
              alt={labels.noImage}
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 flex items-end justify-between px-6 pb-5">
              <span className="font-serif text-7xl text-white/35">{article.title[0]}</span>
              <span className="rounded-full border border-white/25 bg-black/35 px-3 py-1 text-xs text-ink/90">
                {labels.noImage}
              </span>
            </div>
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1020] via-[#0a1020]/25 to-transparent" />
        <a
          href={article.wikipediaUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-4 right-4 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-ink transition hover:bg-black/55"
        >
          {labels.openWikipedia}
        </a>
      </div>

      <div className="space-y-5 p-5 sm:p-7">
        <h2 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">{article.title}</h2>
        {article.isMachineTranslated ? (
          <p className="inline-flex w-fit rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-100">
            {labels.machineTranslatedBadge}
          </p>
        ) : null}

        <div className="max-h-72 space-y-4 overflow-y-auto pr-1 text-[15px] leading-relaxed text-slate-200/90 sm:text-base">
          {paragraphs.map((paragraph, index) => (
            <p key={`${article.pageId}-${index}`}>{paragraph.endsWith(".") ? paragraph : `${paragraph}.`}</p>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
