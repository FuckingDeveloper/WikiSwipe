import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function parsePage(param: string | null): number {
  const parsed = Number.parseInt(param ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const requestedPage = parsePage(request.nextUrl.searchParams.get("page"));

    const total = await db.article.count();
    const totalPages = total === 0 ? 1 : Math.ceil(total / PAGE_SIZE);
    const page = Math.min(requestedPage, totalPages);

    const articles = await db.article.findMany({
      orderBy: [{ score: "desc" }, { likes: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    });

    return NextResponse.json({
      articles,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages
    });
  } catch (error) {
    console.error("/api/leaderboard failed", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard." },
      { status: 500 }
    );
  }
}
