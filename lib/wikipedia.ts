import { AppLanguage } from "@/lib/i18n";
import { estimateReadingLockSeconds } from "@/lib/reading-lock";
import { NormalizedArticle } from "@/lib/types";

const MIN_SUMMARY_LENGTH = 280;
const MAX_ATTEMPTS = 12;
const USER_AGENT = "WikiSwipe/1.0";
const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

type SupportedWikiLanguage = "en" | "ru" | "de" | "fr" | "zh" | "es";

const GOOGLE_TRANSLATE_LANG: Record<SupportedWikiLanguage, string> = {
  en: "en",
  ru: "ru",
  de: "de",
  fr: "fr",
  zh: "zh-CN",
  es: "es"
};

interface WikiPageResponse {
  pageid: number;
  title: string;
  extract?: string;
  fullurl?: string;
  thumbnail?: { source?: string };
  original?: { source?: string };
}

interface WikiQueryResponse {
  query?: {
    pages?: Record<string, WikiPageResponse>;
  };
}

interface WikiLangLink {
  lang: string;
  "*": string;
}

interface WikiLangLinksResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid: number;
        langlinks?: WikiLangLink[];
      }
    >;
  };
}

function cleanSummary(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function hasUsefulContent(page: WikiPageResponse): boolean {
  if (!page.title || !page.extract) return false;

  const title = page.title.toLowerCase();
  const summary = cleanSummary(page.extract.toLowerCase());

  if (title.includes("disambiguation") || summary.includes("may refer to")) return false;
  if (summary.length < MIN_SUMMARY_LENGTH) return false;

  return true;
}

function normalizeArticle(page: WikiPageResponse): NormalizedArticle {
  const summary = cleanSummary(page.extract ?? "");

  return {
    pageId: page.pageid,
    title: page.title,
    summary,
    imageUrl: page.original?.source ?? page.thumbnail?.source ?? null,
    wikipediaUrl: page.fullurl ?? `https://en.wikipedia.org/?curid=${page.pageid}`,
    readingLockSeconds: estimateReadingLockSeconds(summary),
    contentLanguage: "en",
    isMachineTranslated: false,
    alreadyVoted: false
  };
}

function wikiApiUrl(language: SupportedWikiLanguage): string {
  return `https://${language}.wikipedia.org/w/api.php`;
}

async function fetchWikiQuery<T>(
  language: SupportedWikiLanguage,
  params: Record<string, string>
): Promise<T | null> {
  const query = new URLSearchParams({
    action: "query",
    format: "json",
    ...params
  });

  const response = await fetch(`${wikiApiUrl(language)}?${query.toString()}`, {
    cache: "no-store",
    headers: {
      "User-Agent": USER_AGENT
    }
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function fetchRandomPage(): Promise<WikiPageResponse | null> {
  const data = await fetchWikiQuery<WikiQueryResponse>("en", {
    generator: "random",
    grnnamespace: "0",
    grnlimit: "1",
    prop: "extracts|pageimages|info",
    exintro: "1",
    explaintext: "1",
    inprop: "url",
    piprop: "thumbnail|original",
    pithumbsize: "1200"
  });

  const pages = data?.query?.pages;
  if (!pages) return null;

  const firstPage = Object.values(pages)[0];
  return firstPage ?? null;
}

async function fetchPageByPageId(pageId: number): Promise<WikiPageResponse | null> {
  const data = await fetchWikiQuery<WikiQueryResponse>("en", {
    pageids: String(pageId),
    prop: "extracts|pageimages|info",
    exintro: "1",
    explaintext: "1",
    inprop: "url",
    piprop: "thumbnail|original",
    pithumbsize: "1200"
  });

  const pages = data?.query?.pages;
  if (!pages) return null;

  const firstPage = Object.values(pages)[0];
  return firstPage ?? null;
}

async function fetchLocalizedTitle(
  englishPageId: number,
  language: SupportedWikiLanguage
): Promise<string | null> {
  const data = await fetchWikiQuery<WikiLangLinksResponse>("en", {
    pageids: String(englishPageId),
    prop: "langlinks",
    lllimit: "1",
    lllang: language
  });

  const pages = data?.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0];
  const langLink = page?.langlinks?.[0];

  return langLink?.["*"] ?? null;
}

async function fetchPageByTitle(
  title: string,
  language: SupportedWikiLanguage
): Promise<WikiPageResponse | null> {
  const data = await fetchWikiQuery<WikiQueryResponse>(language, {
    titles: title,
    redirects: "1",
    prop: "extracts|pageimages|info",
    exintro: "1",
    explaintext: "1",
    inprop: "url",
    piprop: "thumbnail|original",
    pithumbsize: "1200"
  });

  const pages = data?.query?.pages;
  if (!pages) return null;

  const firstPage = Object.values(pages)[0];
  return firstPage ?? null;
}

async function localizeArticle(
  baseArticle: NormalizedArticle,
  language: SupportedWikiLanguage
): Promise<NormalizedArticle | null> {
  const localizedTitle = await fetchLocalizedTitle(baseArticle.pageId, language);
  if (!localizedTitle) return null;

  const localizedPage = await fetchPageByTitle(localizedTitle, language);
  if (!localizedPage?.title || !localizedPage.extract) return null;

  const localizedSummary = cleanSummary(localizedPage.extract);
  if (!localizedSummary) return null;

  return {
    pageId: baseArticle.pageId,
    title: localizedPage.title,
    summary: localizedSummary,
    imageUrl:
      localizedPage.original?.source ??
      localizedPage.thumbnail?.source ??
      baseArticle.imageUrl,
    wikipediaUrl:
      localizedPage.fullurl ?? baseArticle.wikipediaUrl,
    readingLockSeconds: baseArticle.readingLockSeconds,
    contentLanguage: language,
    isMachineTranslated: false,
    alreadyVoted: baseArticle.alreadyVoted
  };
}

type GoogleTranslateChunk = [string, string?];
type GoogleTranslateResponse = [GoogleTranslateChunk[]?];

async function translateText(
  text: string,
  targetLanguage: SupportedWikiLanguage
): Promise<string | null> {
  const cleaned = cleanSummary(text);
  if (!cleaned) return null;
  if (targetLanguage === "en") return cleaned;

  const params = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: GOOGLE_TRANSLATE_LANG[targetLanguage],
    dt: "t",
    q: cleaned
  });

  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`, {
    cache: "no-store",
    headers: {
      "User-Agent": USER_AGENT
    }
  });

  if (!response.ok) return null;

  const data = (await response.json()) as GoogleTranslateResponse;
  const chunks = data?.[0];
  if (!Array.isArray(chunks)) return null;

  const translated = chunks
    .map((chunk) => (Array.isArray(chunk) ? chunk[0] : ""))
    .filter(Boolean)
    .join("");

  return cleanSummary(translated) || null;
}

async function machineTranslateArticle(
  baseArticle: NormalizedArticle,
  language: SupportedWikiLanguage
): Promise<NormalizedArticle | null> {
  const [translatedTitle, translatedSummary] = await Promise.all([
    translateText(baseArticle.title, language),
    translateText(baseArticle.summary, language)
  ]);

  if (!translatedSummary) return null;

  return {
    ...baseArticle,
    title: translatedTitle ?? baseArticle.title,
    summary: translatedSummary,
    readingLockSeconds: baseArticle.readingLockSeconds,
    contentLanguage: language,
    isMachineTranslated: true,
    alreadyVoted: baseArticle.alreadyVoted
  };
}

async function localizeOrTranslateArticle(
  baseArticle: NormalizedArticle,
  language: SupportedWikiLanguage
): Promise<NormalizedArticle> {
  if (language === "en") {
    return baseArticle;
  }

  const localized = await localizeArticle(baseArticle, language);
  if (localized) {
    return localized;
  }

  const translated = await machineTranslateArticle(baseArticle, language);
  return translated ?? baseArticle;
}

function normalizeLanguage(language: AppLanguage | null | undefined): SupportedWikiLanguage {
  if (
    language === "ru" ||
    language === "de" ||
    language === "fr" ||
    language === "zh" ||
    language === "es"
  ) {
    return language;
  }

  return "en";
}

export async function fetchRandomWikipediaArticle(
  excludedPageIds: number[] = [],
  language: AppLanguage = "en"
): Promise<NormalizedArticle | null> {
  const excludedSet = new Set(excludedPageIds);
  const resolvedLanguage = normalizeLanguage(language);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const page = await fetchRandomPage();
    if (!page) continue;

    if (excludedSet.has(page.pageid)) {
      continue;
    }

    if (!hasUsefulContent(page)) {
      continue;
    }

    const baseArticle = normalizeArticle(page);
    return localizeOrTranslateArticle(baseArticle, resolvedLanguage);
  }

  return null;
}

export async function fetchWikipediaArticleByPageId(
  pageId: number,
  language: AppLanguage = "en"
): Promise<NormalizedArticle | null> {
  const resolvedLanguage = normalizeLanguage(language);
  const page = await fetchPageByPageId(pageId);

  if (!page?.title || !page.extract) {
    return null;
  }

  const baseArticle = normalizeArticle(page);
  return localizeOrTranslateArticle(baseArticle, resolvedLanguage);
}
