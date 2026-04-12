import { db } from "@/lib/db";
import {
  deserializeSessionState,
  getSessionCookieName,
  settleSessionState
} from "@/lib/session-state";
import { NormalizedArticle, VoteType } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

interface VoteRequestBody {
  article?: NormalizedArticle;
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

function isValidArticle(article: NormalizedArticle | undefined): article is NormalizedArticle {
  if (!article) return false;

  return Boolean(
    Number.isFinite(article.pageId) &&
      article.title?.trim() &&
      article.summary?.trim() &&
      article.wikipediaUrl?.trim()
  );
}

export async function POST(request: NextRequest) {
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

    const updatedArticle = await db.$transaction(async (tx) => {
      const existing = await tx.article.findUnique({
        where: { wikiPageId: article.pageId }
      });

      if (!existing) {
        const likes = vote === "like" ? 1 : 0;
        const dislikes = vote === "dislike" ? 1 : 0;

        return tx.article.create({
          data: {
            wikiPageId: article.pageId,
            title: article.title,
            summary: article.summary,
            imageUrl: article.imageUrl,
            wikipediaUrl: article.wikipediaUrl,
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
          title: article.title,
          summary: article.summary,
          imageUrl: article.imageUrl,
          wikipediaUrl: article.wikipediaUrl,
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
    console.error("/api/vote failed", error);
    return NextResponse.json({ error: "Vote could not be saved." }, { status: 500 });
  }
}
