"use client";

import { LoadingSurface } from "@/components/loading-surface";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SiteHeader } from "@/components/site-header";
import { useLanguage } from "@/hooks/useLanguage";
import { AnimatePresence, PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface LeaderboardArticle {
  id: number;
  wikiPageId: number;
  title: string;
  summary: string;
  imageUrl: string | null;
  wikipediaUrl: string;
  likes: number;
  dislikes: number;
  score: number;
}

interface LeaderboardResponse {
  articles: LeaderboardArticle[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const SWIPE_OFFSET_THRESHOLD = 95;
const SWIPE_VELOCITY_THRESHOLD = 520;

function parsePageFromUrl(): number {
  const params = new URLSearchParams(window.location.search);
  const parsed = Number.parseInt(params.get("page") ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function visiblePages(currentPage: number, totalPages: number): number[] {
  const pages: number[] = [];

  for (let page = Math.max(1, currentPage - 2); page <= Math.min(totalPages, currentPage + 2); page += 1) {
    pages.push(page);
  }

  return pages;
}

function isWikimediaUrl(url: string): boolean {
  try {
    return new URL(url).hostname === "upload.wikimedia.org";
  } catch {
    return false;
  }
}

export default function LeaderboardPage() {
  const [articles, setArticles] = useState<LeaderboardArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const cacheRef = useRef<Map<number, LeaderboardResponse>>(new Map());
  const inFlightRef = useRef<Map<number, Promise<LeaderboardResponse | null>>>(new Map());
  const { language, setLanguage, copy } = useLanguage();
  const dragX = useMotionValue(0);
  const leftPeekOpacity = useTransform(dragX, [0, 42, 170], [0, 0.2, 0.58]);
  const rightPeekOpacity = useTransform(dragX, [-170, -42, 0], [0.58, 0.2, 0]);
  const leftPeekOffset = useTransform(dragX, [0, 200], [14, 0]);
  const rightPeekOffset = useTransform(dragX, [-200, 0], [0, -14]);
  const centerScale = useTransform(dragX, [-180, 0, 180], [0.992, 1, 0.992]);

  const fetchLeaderboardPage = useCallback(async (page: number): Promise<LeaderboardResponse | null> => {
    const cached = cacheRef.current.get(page);
    if (cached) {
      return cached;
    }

    const inFlight = inFlightRef.current.get(page);
    if (inFlight) {
      return inFlight;
    }

    const task = (async () => {
      try {
        const response = await fetch(`/api/leaderboard?page=${page}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("LEADERBOARD_LOAD_FAILED");
        }

        const payload = (await response.json()) as LeaderboardResponse;
        cacheRef.current.set(payload.page, payload);

        return payload;
      } catch {
        return null;
      } finally {
        inFlightRef.current.delete(page);
      }
    })();

    inFlightRef.current.set(page, task);
    return task;
  }, []);

  const syncUrlState = useCallback(
    (page: number) => {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", language);

      if (page <= 1) {
        url.searchParams.delete("page");
      } else {
        url.searchParams.set("page", String(page));
      }

      const queryString = url.searchParams.toString();
      const nextUrl = queryString ? `${url.pathname}?${queryString}` : url.pathname;
      window.history.replaceState({}, "", nextUrl);
    },
    [language]
  );

  const prefetchNeighbors = useCallback(
    async (page: number, maxPages: number) => {
      const neighbors = [page - 1, page + 1].filter((value) => value >= 1 && value <= maxPages);
      await Promise.all(neighbors.map((neighborPage) => fetchLeaderboardPage(neighborPage)));

      const keepPages = new Set([page - 1, page, page + 1]);
      for (const key of cacheRef.current.keys()) {
        if (!keepPages.has(key)) {
          cacheRef.current.delete(key);
        }
      }
    },
    [fetchLeaderboardPage]
  );

  useEffect(() => {
    setCurrentPage(parsePageFromUrl());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    syncUrlState(currentPage);
  }, [currentPage, isReady, syncUrlState]);

  const changePage = useCallback(
    (nextPage: number) => {
      const clamped = Math.min(totalPages, Math.max(1, nextPage));
      if (clamped === currentPage) return;

      setPageDirection(clamped > currentPage ? 1 : -1);
      setCurrentPage(clamped);
    },
    [currentPage, totalPages]
  );

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    const loadLeaderboardPage = async () => {
      setError(null);

      const cached = cacheRef.current.get(currentPage);
      if (cached) {
        setArticles(cached.articles);
        setTotal(cached.total);
        setTotalPages(cached.totalPages);
        setLoading(false);
        void prefetchNeighbors(cached.page, cached.totalPages);
        return;
      }

      setLoading(true);

      const payload = await fetchLeaderboardPage(currentPage);
      if (cancelled) return;

      if (!payload) {
        setError("LEADERBOARD_LOAD_FAILED");
        setLoading(false);
        return;
      }

      setArticles(payload.articles);
      setTotal(payload.total);
      setTotalPages(payload.totalPages);
      setLoading(false);

      if (payload.page !== currentPage) {
        setPageDirection(payload.page > currentPage ? 1 : -1);
        setCurrentPage(payload.page);
      }

      void prefetchNeighbors(payload.page, payload.totalPages);
    };

    void loadLeaderboardPage();

    return () => {
      cancelled = true;
    };
  }, [currentPage, fetchLeaderboardPage, isReady, prefetchNeighbors]);

  const pageNumbers = useMemo(() => visiblePages(currentPage, totalPages), [currentPage, totalPages]);
  const backHref = `/?lang=${language}`;
  const handleLeaderboardDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const fastEnough = Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD;
      const farEnough = Math.abs(info.offset.x) > SWIPE_OFFSET_THRESHOLD;
      if (!fastEnough && !farEnough) return;

      if (info.offset.x < 0 || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD) {
        changePage(currentPage + 1);
        return;
      }

      if (info.offset.x > 0 || info.velocity.x > SWIPE_VELOCITY_THRESHOLD) {
        changePage(currentPage - 1);
      }
    },
    [changePage, currentPage]
  );

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.32 } }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-12">
      <SiteHeader
        title={copy.leaderboardTitle}
        subtitle={copy.leaderboardSubtitle}
        actionHref={backHref}
        actionLabel={copy.actionBackToSwipe}
        language={language}
        languageLabel={copy.languageLabel}
        onLanguageChange={setLanguage}
      />

      <motion.main
        initial="hidden"
        animate="show"
        variants={sectionVariants}
        className="rounded-3xl border border-white/15 bg-panel/75 p-4 shadow-glow backdrop-blur sm:p-6"
      >
        {loading ? <LoadingSurface label={copy.leaderboardLoading} minHeightClassName="min-h-[360px]" /> : null}

        {error ? (
          <p className="rounded-2xl border border-negative/35 bg-negative/10 px-4 py-3 text-sm text-red-100">
            {copy.leaderboardLoadError}
          </p>
        ) : null}

        {!loading && !error && total === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/15 px-5 py-8 text-center">
            <p className="font-serif text-2xl text-ink">{copy.noVotesTitle}</p>
            <p className="mt-2 text-sm text-muted">{copy.noVotesDescription}</p>
          </div>
        ) : null}

        {!loading && !error && total > 0 ? (
          <div className="space-y-4">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleLeaderboardDragEnd}
              whileDrag={{ scale: 0.997 }}
              style={{ x: dragX }}
              className="touch-pan-y rounded-2xl"
            >
              <div className="relative overflow-hidden rounded-2xl">
                <motion.div
                  aria-hidden="true"
                  style={{ opacity: leftPeekOpacity, x: leftPeekOffset }}
                  className="pointer-events-none absolute inset-y-2 left-1 z-0 flex w-20 flex-col justify-between rounded-xl border border-white/10 bg-black/25 p-2"
                >
                  <span className="text-center text-[11px] text-muted">{currentPage > 1 ? currentPage - 1 : ""}</span>
                  <span className="text-center text-sm text-ink/70">‹</span>
                </motion.div>

                <motion.div
                  aria-hidden="true"
                  style={{ opacity: rightPeekOpacity, x: rightPeekOffset }}
                  className="pointer-events-none absolute inset-y-2 right-1 z-0 flex w-20 flex-col justify-between rounded-xl border border-white/10 bg-black/25 p-2"
                >
                  <span className="text-center text-[11px] text-muted">
                    {currentPage < totalPages ? currentPage + 1 : ""}
                  </span>
                  <span className="text-center text-sm text-ink/70">›</span>
                </motion.div>

                <motion.div style={{ scale: centerScale }} className="relative z-10">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.ul
                      key={`leaderboard-page-${currentPage}`}
                      initial={{ opacity: 0, x: pageDirection > 0 ? 42 : -42 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: pageDirection > 0 ? -42 : 42 }}
                      transition={{ type: "spring", stiffness: 190, damping: 24 }}
                      className="space-y-3"
                    >
                      {articles.map((article, index) => {
                        const rank = (currentPage - 1) * 10 + index + 1;

                        return (
                          <motion.li
                            key={article.wikiPageId}
                            layout
                            transition={{ type: "spring", stiffness: 240, damping: 25, mass: 0.85 }}
                            className="grid gap-3 rounded-2xl border border-white/12 bg-black/20 p-3 sm:grid-cols-[56px_140px_1fr]"
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-white/5 font-serif text-2xl text-ink">
                              {rank}
                            </div>

                            <div className="relative h-24 overflow-hidden rounded-xl border border-white/10 sm:h-28">
                              {article.imageUrl ? (
                                <Image
                                  src={article.imageUrl}
                                  alt={article.title}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 140px"
                                  className="object-cover object-center"
                                  unoptimized={isWikimediaUrl(article.imageUrl)}
                                />
                              ) : (
                                <>
                                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(73,198,255,0.24),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(84,209,157,0.2),transparent_35%),linear-gradient(145deg,#11223a,#0b1528)]" />
                                  <div className="absolute inset-0 bg-[url('/grain.svg')] opacity-30" />
                                  <div className="absolute inset-0 flex items-end justify-between p-3">
                                    <span className="font-serif text-4xl leading-none text-white/30">W</span>
                                    <span className="rounded-full border border-white/25 bg-black/35 px-2 py-1 text-[11px] text-ink/95">
                                      {copy.noImage}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex min-w-0 flex-col gap-2">
                              <h3 className="truncate font-serif text-2xl leading-tight text-ink sm:text-[30px]">
                                {article.title}
                              </h3>
                              <p className="line-clamp-2 text-sm text-muted">{article.summary}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-ink/90">
                                <span className="rounded-full border border-positive/35 bg-positive/10 px-3 py-1">
                                  {copy.likes}: {article.likes}
                                </span>
                                <span className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1">
                                  {copy.dislikes}: {article.dislikes}
                                </span>
                                <span className="rounded-full border border-brand/35 bg-brand/10 px-3 py-1">
                                  {copy.score}: {article.score}
                                </span>
                                <a
                                  href={article.wikipediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 transition hover:bg-white/10"
                                >
                                  {copy.viewSource}
                                </a>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </motion.ul>
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/12 bg-black/20 p-3">
              <button
                type="button"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label={copy.paginationPrevious}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-ink transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span aria-hidden="true">←</span>
                <span className="sr-only">{copy.paginationPrevious}</span>
              </button>

              <div className="flex items-center gap-2">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => changePage(page)}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-lg border px-3 text-sm transition ${
                      page === currentPage
                        ? "border-brand/45 bg-brand/15 text-ink"
                        : "border-white/20 bg-white/5 text-muted hover:bg-white/10 hover:text-ink"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label={copy.paginationNext}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-ink transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span aria-hidden="true">→</span>
                <span className="sr-only">{copy.paginationNext}</span>
              </button>
            </div>

            <p className="text-center text-xs text-muted">{copy.paginationStatus(currentPage, totalPages)}</p>
          </div>
        ) : null}
      </motion.main>

      <MobileBottomNav
        language={language}
        labels={{
          home: copy.mobileNavHome,
          leaderboard: copy.mobileNavLeaderboard,
          aria: copy.mobileNavAria,
          timerToggleAria: copy.mobileTimerToggleAria
        }}
      />
    </div>
  );
}
