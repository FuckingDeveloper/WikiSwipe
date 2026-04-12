"use client";

import { AppLanguage, DEFAULT_LANGUAGE, UI_COPY, isSupportedLanguage } from "@/lib/i18n";
import { useCallback, useEffect, useMemo, useState } from "react";

const LANGUAGE_STORAGE_KEY = "wikiswipe-language";

export function useLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    let nextLanguage: AppLanguage = DEFAULT_LANGUAGE;
    const langParam = new URLSearchParams(window.location.search).get("lang");

    if (isSupportedLanguage(langParam)) {
      nextLanguage = langParam;
    } else {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isSupportedLanguage(stored)) {
        nextLanguage = stored;
      }
    }

    setLanguageState((current) => (current === nextLanguage ? current : nextLanguage));
  }, []);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);

    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLanguage);
    const queryString = url.searchParams.toString();
    const nextUrl = queryString ? `${url.pathname}?${queryString}` : url.pathname;

    window.history.replaceState({}, "", nextUrl);
  }, []);

  const copy = useMemo(() => UI_COPY[language], [language]);

  return {
    language,
    setLanguage,
    copy
  };
}
