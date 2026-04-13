import { db } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  deserializeSessionState,
  getSessionCookieName,
  settleSessionState
} from "@/lib/session-state";
import { fetchWikipediaArticleByPageId } from "@/lib/wikipedia";
import { NormalizedArticle, VoteType } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

interface VoteRequestBody {
  article?: Pick<NormalizedArticle, "pageId">;
  vote?: VoteType;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

function isValidVote(vote: string | undefined): vote is VoteType {
  return vote === "like" || vote === "dislike";
}

function isValidArticle(
  article: VoteRequestBody["article"]
): article is Pick<NormalizedArticle, "pageId"> {
  return Boolean(article && Number.isFinite(article.pageId));
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, {
    key: "vote",
    limit: 60,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = (await request.json()) as VoteRequestBody;

    if (!isValidArticle(body.article) || !isValidVote(body.vote)) {
      return NextResponse.json({ error: "Invalid vote payload." }, { status: 400 });
    }

    const { article, vote } = body;

    const encryptedState = request.cookies.get(getSessionCookieName())?.value;
    const sessionState = deserializeSessionState(encryptedState);

    if (!sessionState || sessionState.pageId !== article.pageId) {
      return NextResponse.json(
        { error: "Voting state mismatch. Reload article first." },
        { status: 403 }
      );
    }

    const settledState = settleSessionState(sessionState, { keepHeartbeat: false });
    if (settledState.readingElapsedMs < settledState.requiredReadingMs) {
      return NextResponse.json({ error: "Reading lock is still active." }, { status: 403 });
    }

    const canonicalArticle = await fetchWikipediaArticleByPageId(
      article.pageId,
      sessionState.articleLanguage
    );

    if (!canonicalArticle) {
      return NextResponse.json({ error: "Article is no longer available." }, { status: 404 });
    }

    const now = new Date();
    const updatedArticle = await db.$transaction(async (tx) => {
      const consumeNonce = await tx.voteNonce.updateMany({
        where: {
          nonce: settledState.voteNonce,
          pageId: article.pageId,
          consumedAt: null,
          expiresAt: {
            gt: now
          }
        },
        data: {
          consumedAt: now
        }
      });

      if (consumeNonce.count !== 1) {
        throw new Error("VOTE_NONCE_INVALID");
      }

      const existing = await tx.article.findUnique({
        where: { wikiPageId: article.pageId }
      });

      if (!existing) {
        const likes = vote === "like" ? 1 : 0;
        const dislikes = vote === "dislike" ? 1 : 0;

        return tx.article.create({
          data: {
            wikiPageId: article.pageId,
            title: canonicalArticle.title,
            summary: canonicalArticle.summary,
            imageUrl: canonicalArticle.imageUrl,
            wikipediaUrl: canonicalArticle.wikipediaUrl,
            likes,
            dislikes,
            score: likes - dislikes
          }
        });
      }

      const nextLikes = existing.likes + (vote === "like" ? 1 : 0);
      const nextDislikes = existing.dislikes + (vote === "dislike" ? 1 : 0);

      return tx.article.update({
        where: { wikiPageId: article.pageId },
        data: {
          title: canonicalArticle.title,
          summary: canonicalArticle.summary,
          imageUrl: canonicalArticle.imageUrl,
          wikipediaUrl: canonicalArticle.wikipediaUrl,
          likes: nextLikes,
          dislikes: nextDislikes,
          score: nextLikes - nextDislikes
        }
      });
    });

    const response = NextResponse.json({ ok: true, article: updatedArticle });
    response.cookies.set(getSessionCookieName(), "", {
      ...cookieOptions(),
      maxAge: 0
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "VOTE_NONCE_INVALID") {
      return NextResponse.json(
        { error: "Vote is already used or expired for this article session." },
        { status: 409 }
      );
    }

    console.error("/api/vote failed", error);
    return NextResponse.json({ error: "Vote could not be saved." }, { status: 500 });
  }
}
