import { db } from "@/lib/db";
import { isSupportedLanguage } from "@/lib/i18n";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  deserializeSessionState,
  generateVoteNonce,
  getSessionCookieName,
  serializeSessionState,
  SessionState,
  VOTE_NONCE_TTL_MS
} from "@/lib/session-state";
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

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, {
    key: "article-random",
    limit: 90,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

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

    const response = NextResponse.json(article);

    await db.voteNonce.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            consumedAt: { not: null },
            createdAt: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24) }
          }
        ]
      }
    });

    const voteNonce = generateVoteNonce();
    const expiresAt = new Date(Date.now() + VOTE_NONCE_TTL_MS);
    await db.voteNonce.create({
      data: {
        nonce: voteNonce,
        pageId: article.pageId,
        expiresAt
      }
    });

    const currentState = deserializeSessionState(
      request.cookies.get(getSessionCookieName())?.value
    );

    const nextState: SessionState =
      currentState && currentState.pageId === article.pageId
        ? {
            ...currentState,
            articleLanguage: language,
            readingElapsedMs: 0,
            requiredReadingMs: article.readingLockSeconds * 1000,
            voteNonce,
            lastHeartbeatAt: null
          }
        : {
            pageId: article.pageId,
            articleLanguage: language,
            readingElapsedMs: 0,
            requiredReadingMs: article.readingLockSeconds * 1000,
            voteNonce,
            lastHeartbeatAt: null
          };

    response.cookies.set(
      getSessionCookieName(),
      serializeSessionState(nextState),
      cookieOptions()
    );

    return response;
  } catch (error) {
    console.error("/api/article/random failed", error);
    return NextResponse.json({ error: "Failed to fetch article." }, { status: 500 });
  }
}
