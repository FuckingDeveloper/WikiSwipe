"use client";

import { ArticleCard } from "@/components/article-card";
import { ArticlePreloader } from "@/components/article-preloader";
import { LoadingSurface } from "@/components/loading-surface";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SideVoteButton } from "@/components/side-vote-button";
import { SiteHeader } from "@/components/site-header";
import { TimerProgress } from "@/components/timer-progress";
import { VoteControls } from "@/components/vote-controls";
import { useCountdown } from "@/hooks/useCountdown";
import { useLanguage } from "@/hooks/useLanguage";
import { AppLanguage } from "@/lib/i18n";
import { NormalizedArticle, SwipeDirection, VoteType } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const TIMER_SECONDS = 30;
const HEARTBEAT_INTERVAL_MS = 2200;
const VIEWED_STORAGE_KEY = "wikiswipe-viewed-page-ids";
const HISTORY_LIMIT = 45;

interface SessionStatePayload {
  pageId: number;
  articleLanguage: AppLanguage;
  readingElapsedMs: number;
  lastHeartbeatAt: number | null;
  unlocked: boolean;
}

interface SessionStateResponse {
  state: SessionStatePayload | null;
}

function parseStoredIds(raw: string | null): number[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((value) => Number.parseInt(String(value), 10))
      .filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

export default function HomePage() {
  const viewedIdsRef = useRef<number[]>([]);
  const didInitRef = useRef(false);

  const [article, setArticle] = useState<NormalizedArticle | null>(null);
  const [articleLanguage, setArticleLanguage] = useState<AppLanguage | null>(null);
  const [readingElapsedMs, setReadingElapsedMs] = useState(0);
  const [isPageFocused, setIsPageFocused] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [pendingSwipe, setPendingSwipe] = useState<SwipeDirection | null>(null);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { language, setLanguage, copy } = useLanguage();

  const hasReadableArticle = Boolean(article);
  const sessionActive =
    hasReadableArticle && isPageFocused && !loadingArticle && !submittingVote && !pendingSwipe;

  const { secondsLeft, progress, isComplete } = useCountdown({
    duration: TIMER_SECONDS,
    resetKey: article?.pageId ?? null,
    elapsedMs: readingElapsedMs,
    isRunning: sessionActive
  });

  const fetchArticleByPageId = useCallback(async (pageId: number, targetLanguage: AppLanguage) => {
    const params = new URLSearchParams({
      pageId: String(pageId),
      lang: targetLanguage
    });

    const response = await fetch(`/api/article/translate?${params.toString()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("ARTICLE_TRANSLATE_FAILED");
    }

    return (await response.json()) as NormalizedArticle;
  }, []);

  const syncSession = useCallback(
    async (options: { pageId: number; articleLanguage: AppLanguage; active: boolean }) => {
      try {
        const response = await fetch("/api/session/current-article", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(options)
        });

        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as SessionStateResponse;
        return payload.state;
      } catch {
        return null;
      }
    },
    []
  );

  const sendPauseBeacon = useCallback((pageId: number, languageCode: AppLanguage): boolean => {
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
      return false;
    }

    const payload = JSON.stringify({
      pageId,
      articleLanguage: languageCode,
      active: false
    });

    const blob = new Blob([payload], { type: "application/json" });
    return navigator.sendBeacon("/api/session/current-article", blob);
  }, []);

  const loadArticle = useCallback(
    async (overrideViewedIds?: number[], targetLanguage: AppLanguage = language) => {
      const viewedIds = overrideViewedIds ?? viewedIdsRef.current;

      setLoadingArticle(true);
      setMobileInfoOpen(false);
      setError(null);

      try {
        const params = new URLSearchParams();
        const exclude = viewedIds.slice(-HISTORY_LIMIT).join(",");
        if (exclude) {
          params.set("exclude", exclude);
        }
        params.set("lang", targetLanguage);

        const response = await fetch(`/api/article/random?${params.toString()}`, {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("ARTICLE_LOAD_FAILED");
        }

        const nextArticle = (await response.json()) as NormalizedArticle;

        setArticle(nextArticle);
        setArticleLanguage(targetLanguage);
        setReadingElapsedMs(0);

        const nextViewed = [...viewedIdsRef.current, nextArticle.pageId].slice(-HISTORY_LIMIT);
        viewedIdsRef.current = nextViewed;
        localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(nextViewed));
      } catch {
        setError("ARTICLE_LOAD_FAILED");
      } finally {
        setLoadingArticle(false);
      }
    },
    [language]
  );

  useEffect(() => {
    const updateFocus = () => {
      setIsPageFocused(document.visibilityState === "visible" && document.hasFocus());
    };

    updateFocus();

    window.addEventListener("focus", updateFocus);
    window.addEventListener("blur", updateFocus);
    document.addEventListener("visibilitychange", updateFocus);

    return () => {
      window.removeEventListener("focus", updateFocus);
      window.removeEventListener("blur", updateFocus);
      document.removeEventListener("visibilitychange", updateFocus);
    };
  }, []);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const bootstrap = async () => {
      const storedIds = parseStoredIds(localStorage.getItem(VIEWED_STORAGE_KEY));
      viewedIdsRef.current = storedIds;

      try {
        const sessionResponse = await fetch("/api/session/current-article", {
          method: "GET",
          cache: "no-store"
        });

        if (sessionResponse.ok) {
          const payload = (await sessionResponse.json()) as SessionStateResponse;
          if (payload.state?.pageId) {
            const restoredArticle = await fetchArticleByPageId(payload.state.pageId, language);

            setArticle(restoredArticle);
            setArticleLanguage(language);
            setReadingElapsedMs(payload.state.readingElapsedMs);
            setError(null);
            setLoadingArticle(false);

            const nextViewed = [...storedIds, payload.state.pageId].slice(-HISTORY_LIMIT);
            viewedIdsRef.current = nextViewed;
            localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(nextViewed));
            return;
          }
        }
      } catch {
        // fallback to random article
      }

      await loadArticle(storedIds, language);
    };

    void bootstrap();
  }, [fetchArticleByPageId, language, loadArticle]);

  useEffect(() => {
    if (!article || !articleLanguage) return;

    let cancelled = false;

    const postHeartbeat = async (active: boolean) => {
      const state = await syncSession({
        pageId: article.pageId,
        articleLanguage,
        active
      });

      if (cancelled || !state || state.pageId !== article.pageId) {
        return;
      }

      setReadingElapsedMs(state.readingElapsedMs);
    };

    void postHeartbeat(sessionActive);

    if (!sessionActive) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void postHeartbeat(true);
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      const wasSent = sendPauseBeacon(article.pageId, articleLanguage);
      if (!wasSent) {
        void syncSession({
          pageId: article.pageId,
          articleLanguage,
          active: false
        });
      }
    };
  }, [article, articleLanguage, sendPauseBeacon, sessionActive, syncSession]);

  useEffect(() => {
    if (!article || !articleLanguage) return;
    if (articleLanguage === language) return;

    let cancelled = false;

    const translateArticle = async () => {
      setLoadingArticle(true);
      setError(null);

      try {
        const translatedArticle = await fetchArticleByPageId(article.pageId, language);
        if (cancelled) return;

        setArticle(translatedArticle);
        setArticleLanguage(language);
      } catch {
        if (cancelled) return;
        setError("ARTICLE_TRANSLATE_FAILED");
      } finally {
        if (cancelled) return;
        setLoadingArticle(false);
      }
    };

    void translateArticle();

    return () => {
      cancelled = true;
    };
  }, [article, articleLanguage, fetchArticleByPageId, language]);

  const canVote =
    isComplete && !loadingArticle && !submittingVote && !pendingSwipe && Boolean(article);
  const isTranslatingCurrentArticle =
    loadingArticle && Boolean(article) && articleLanguage !== null && articleLanguage !== language;
  const preloaderLabel = isTranslatingCurrentArticle
    ? copy.articleTranslating
    : copy.articleLoading;
  const interactionHint = isComplete ? copy.voteUnlocked : copy.voteLocked;

  const submitVote = useCallback(
    async (direction: SwipeDirection) => {
      if (!article || !canVote) return;

      setSubmittingVote(true);
      setMobileInfoOpen(false);
      setPendingSwipe(direction);
      setError(null);

      const vote: VoteType = direction === "right" ? "like" : "dislike";

      try {
        if (articleLanguage) {
          const synced = await syncSession({
            pageId: article.pageId,
            articleLanguage,
            active: true
          });

          if (synced && synced.readingElapsedMs < TIMER_SECONDS * 1000) {
            throw new Error("READING_LOCK_ACTIVE");
          }
        }

        const votePromise = fetch("/api/vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            article,
            vote
          })
        });

        await new Promise((resolve) => setTimeout(resolve, 340));

        const voteResponse = await votePromise;

        if (!voteResponse.ok) {
          throw new Error("VOTE_SAVE_FAILED");
        }

        setArticle(null);
        setArticleLanguage(null);
        setReadingElapsedMs(0);
        setPendingSwipe(null);
        await loadArticle(undefined, language);
      } catch {
        setError("VOTE_SAVE_FAILED");
        setPendingSwipe(null);
      } finally {
        setSubmittingVote(false);
      }
    },
    [article, articleLanguage, canVote, language, loadArticle, syncSession]
  );

  const leaderboardHref = `/leaderboard?lang=${language}`;
  const toggleMobileInfo = () => {
    setMobileInfoOpen((current) => !current);
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.34 }
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-12">
      <SiteHeader
        title={copy.heroTitle}
        subtitle={copy.homeSubtitle}
        actionHref={leaderboardHref}
        actionLabel={copy.actionLeaderboard}
        language={language}
        languageLabel={copy.languageLabel}
        onLanguageChange={setLanguage}
      />

      <motion.main
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.02 }
          }
        }}
        className="space-y-5"
      >
        <motion.section
          variants={contentVariants}
          className="hidden rounded-3xl border border-white/15 bg-panel/75 p-4 shadow-soft backdrop-blur sm:p-5 md:block"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <TimerProgress
              secondsLeft={secondsLeft}
              totalSeconds={TIMER_SECONDS}
              progress={progress}
              ariaLabel={copy.timerAria}
              readingLockLabel={copy.readingLock}
              unlocksAfterText={copy.unlocksAfter(TIMER_SECONDS)}
            />

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-muted">
              <p className="uppercase tracking-[0.2em] text-[10px] text-ink/80">{copy.swipeStatus}</p>
              <p className="mt-1">{isComplete ? copy.swipeStatusUnlocked : copy.swipeStatusLocked}</p>
              <p className="mt-2 text-[11px] text-ink/75">{interactionHint}</p>
            </div>
          </div>
        </motion.section>

        <motion.section variants={contentVariants} className="min-h-[560px]">
          {loadingArticle && !article ? <LoadingSurface label={copy.articleLoading} /> : null}

          {article ? (
            <div className="grid gap-4 lg:grid-cols-[122px_minmax(0,1fr)_122px]">
              <div className="hidden lg:block">
                <SideVoteButton
                  direction="left"
                  locked={!isComplete}
                  busy={submittingVote || loadingArticle}
                  onClick={() => void submitVote("left")}
                  label={copy.voteNo}
                  hint={copy.swipeLeft}
                />
              </div>

              <div className="relative min-w-0">
                <ArticleCard
                  article={article}
                  canSwipe={canVote}
                  disabled={loadingArticle || submittingVote}
                  pendingSwipe={pendingSwipe}
                  onSwipeVote={submitVote}
                  labels={{
                    yes: copy.voteYes,
                    no: copy.voteNo,
                    openWikipedia: copy.openWikipedia,
                    noImage: copy.noImage,
                    articleAriaPrefix: copy.articleCardAriaPrefix
                  }}
                />
                {loadingArticle ? <ArticlePreloader label={preloaderLabel} /> : null}
              </div>

              <div className="hidden lg:block">
                <SideVoteButton
                  direction="right"
                  locked={!isComplete}
                  busy={submittingVote || loadingArticle}
                  onClick={() => void submitVote("right")}
                  label={copy.voteYes}
                  hint={copy.swipeRight}
                />
              </div>
            </div>
          ) : null}

          {!loadingArticle && !article ? (
            <div className="rounded-[28px] border border-white/15 bg-panel/80 p-8 text-center shadow-glow">
              <p className="font-serif text-2xl text-ink">{copy.noArticleTitle}</p>
              <p className="mt-2 text-sm text-muted">{copy.noArticleDescription}</p>
              <button
                type="button"
                onClick={() => void loadArticle(undefined, language)}
                className="mt-5 rounded-full border border-brand/50 bg-brand/15 px-5 py-2 text-sm font-medium text-ink transition hover:bg-brand/25"
              >
                {copy.retry}
              </button>
            </div>
          ) : null}
        </motion.section>

        {article ? (
          <motion.section
            variants={contentVariants}
            className="rounded-3xl border border-white/15 bg-panel/75 p-4 shadow-soft backdrop-blur sm:p-5 lg:hidden"
          >
            <VoteControls
              locked={!isComplete}
              busy={submittingVote || loadingArticle}
              onDislike={() => void submitVote("left")}
              onLike={() => void submitVote("right")}
              labels={{
                no: copy.voteNo,
                yes: copy.voteYes,
                swipeLeft: copy.swipeLeft,
                swipeRight: copy.swipeRight,
                locked: copy.voteLocked,
                saving: copy.voteSaving,
                unlocked: copy.voteUnlocked,
                sectionAria: copy.votingControlsAria
              }}
            />
          </motion.section>
        ) : null}

        {error ? (
          <motion.div
            variants={contentVariants}
            className="rounded-2xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-red-100"
          >
            {error === "VOTE_SAVE_FAILED"
              ? copy.voteError
              : error === "ARTICLE_TRANSLATE_FAILED"
                ? copy.articleTranslateError
                : copy.articleLoadError}
          </motion.div>
        ) : null}
      </motion.main>

      <AnimatePresence>
        {mobileInfoOpen ? (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 rounded-2xl border border-white/20 bg-[#09182f]/94 p-4 shadow-glow backdrop-blur-xl md:hidden"
          >
            <div className="space-y-3 text-xs text-muted">
              <div>
                <p className="uppercase tracking-[0.2em] text-[10px] text-ink/80">{copy.readingLock}</p>
                <p className="mt-1 text-sm text-ink">{secondsLeft}s</p>
                <p className="mt-1">{copy.unlocksAfter(TIMER_SECONDS)}</p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <p className="uppercase tracking-[0.2em] text-[10px] text-ink/80">{copy.swipeStatus}</p>
                <p className="mt-1">{isComplete ? copy.swipeStatusUnlocked : copy.swipeStatusLocked}</p>
                <p className="mt-2 text-ink/80">{interactionHint}</p>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <MobileBottomNav
        language={language}
        timer={{ secondsLeft, totalSeconds: TIMER_SECONDS }}
        timerExpanded={mobileInfoOpen}
        onTimerToggle={toggleMobileInfo}
        onNavigate={() => setMobileInfoOpen(false)}
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
