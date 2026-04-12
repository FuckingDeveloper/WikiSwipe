"use client";

import { AppLanguage, LANGUAGE_OPTIONS } from "@/lib/i18n";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface SiteHeaderProps {
  title: string;
  subtitle: string;
  actionHref: string;
  actionLabel: string;
  language: AppLanguage;
  languageLabel: string;
  onLanguageChange: (language: AppLanguage) => void;
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 2.8A9.2 9.2 0 1 0 12 21.2A9.2 9.2 0 1 0 12 2.8Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.8 12h18.4M12 2.8c2.4 2.6 3.8 5.7 3.8 9.2S14.4 18.6 12 21.2M12 2.8c-2.4 2.6-3.8 5.7-3.8 9.2s1.4 6.6 3.8 9.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader({
  title,
  subtitle,
  actionHref,
  actionLabel,
  language,
  languageLabel,
  onLanguageChange
}: SiteHeaderProps) {
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const activeLanguageLabel = useMemo(() => {
    return LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? language.toUpperCase();
  }, [language]);

  const openLanguageModal = () => {
    setIsLanguageModalOpen(true);
  };

  const closeLanguageModal = () => {
    setIsLanguageModalOpen(false);
  };

  const handleLanguageSelect = (nextLanguage: AppLanguage) => {
    onLanguageChange(nextLanguage);
    setIsLanguageModalOpen(false);
  };

  useEffect(() => {
    if (!isLanguageModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLanguageModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isLanguageModalOpen]);

  return (
    <>
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/" className="group inline-flex items-center gap-2">
              <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.25em] text-brand">
                WikiSwipe
              </span>
            </Link>
            <h1 className="mt-3 max-w-xl font-serif text-3xl leading-[1.05] text-ink sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">{subtitle}</p>
          </div>

          <button
            type="button"
            aria-label={languageLabel}
            title={`${languageLabel}: ${activeLanguageLabel}`}
            onClick={openLanguageModal}
            className="rounded-2xl border border-white/20 bg-white/5 p-3 text-ink transition hover:bg-white/10 sm:hidden"
          >
            <GlobeIcon />
          </button>

          <div className="hidden items-center gap-2 self-start rounded-2xl border border-white/15 bg-white/5 p-2 backdrop-blur sm:flex sm:self-auto">
            <button
              type="button"
              onClick={openLanguageModal}
              className="rounded-xl border border-white/20 bg-panelSoft px-3 py-2 text-xs text-ink transition hover:border-brand"
            >
              {activeLanguageLabel}
            </button>

            <Link
              href={actionHref}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-ink transition hover:bg-white/10"
            >
              {actionLabel}
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isLanguageModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
            aria-label={languageLabel}
          >
            <button
              type="button"
              aria-label="Close language modal"
              className="absolute inset-0 bg-black/45 backdrop-blur-md"
              onClick={closeLanguageModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 26 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ type: "spring", stiffness: 180, damping: 24, mass: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-white/20 bg-[#08172d]/95 p-4 shadow-glow"
            >
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">{languageLabel}</p>
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.07,
                      delayChildren: 0.08
                    }
                  }
                }}
                className="space-y-2"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleLanguageSelect(option.value)}
                    variants={{
                      hidden: { opacity: 0, y: 14, scale: 0.985 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { type: "spring", stiffness: 230, damping: 23 }
                      }
                    }}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      option.value === language
                        ? "border-brand/45 bg-brand/15 text-ink"
                        : "border-white/15 bg-white/5 text-muted hover:bg-white/10 hover:text-ink"
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
