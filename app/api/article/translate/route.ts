import { isSupportedLanguage } from "@/lib/i18n";
import { fetchWikipediaArticleByPageId } from "@/lib/wikipedia";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const pageIdParam = request.nextUrl.searchParams.get("pageId");
  const langParam = request.nextUrl.searchParams.get("lang");

  const pageId = Number.parseInt(pageIdParam ?? "", 10);
  if (!Number.isFinite(pageId)) {
    return NextResponse.json({ error: "Invalid pageId." }, { status: 400 });
  }

  const language = isSupportedLanguage(langParam) ? langParam : "en";

  try {
    const article = await fetchWikipediaArticleByPageId(pageId, language);

    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("/api/article/translate failed", error);
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}
