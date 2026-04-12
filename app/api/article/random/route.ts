import { isSupportedLanguage } from "@/lib/i18n";
import { fetchRandomWikipediaArticle } from "@/lib/wikipedia";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseExcludedIds(param: string | null): number[] {
  if (!param) return [];

  return param
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value));
}

export async function GET(request: NextRequest) {
  const exclude = request.nextUrl.searchParams.get("exclude");
  const langParam = request.nextUrl.searchParams.get("lang");
  const language = isSupportedLanguage(langParam) ? langParam : "en";
  const excludedIds = parseExcludedIds(exclude);

  try {
    const article = await fetchRandomWikipediaArticle(excludedIds, language);

    if (!article) {
      return NextResponse.json(
        { error: "Could not find a high-quality Wikipedia article right now." },
        { status: 502 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("/api/article/random failed", error);
    return NextResponse.json({ error: "Failed to fetch article." }, { status: 500 });
  }
}
