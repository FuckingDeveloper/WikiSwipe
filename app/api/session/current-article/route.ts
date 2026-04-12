import { isSupportedLanguage } from "@/lib/i18n";
import {
  getSessionCookieName,
  READING_LOCK_MS,
  deserializeSessionState,
  serializeSessionState,
  settleSessionState,
  SessionState
} from "@/lib/session-state";
import { NextRequest, NextResponse } from "next/server";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

function validateBody(
  body: unknown
): {
  pageId: number;
  articleLanguage: SessionState["articleLanguage"];
  active: boolean;
  requiredReadingMs: number | null;
} | null {
  if (!body || typeof body !== "object") return null;

  const candidate = body as Partial<{
    pageId: number;
    articleLanguage: string;
    active: boolean;
    requiredReadingMs: number;
  }>;
  const pageId = Number(candidate.pageId);

  if (!Number.isFinite(pageId)) return null;
  if (!isSupportedLanguage(candidate.articleLanguage)) return null;

  const requiredReadingRaw = Number(candidate.requiredReadingMs);
  const requiredReadingMs = Number.isFinite(requiredReadingRaw)
    ? Math.max(1000, Math.min(180000, Math.floor(requiredReadingRaw)))
    : null;

  return {
    pageId,
    articleLanguage: candidate.articleLanguage,
    active: candidate.active !== false,
    requiredReadingMs
  };
}

function toResponseState(state: SessionState) {
  return {
    ...state,
    readingElapsedMs: Math.max(0, Math.floor(state.readingElapsedMs)),
    requiredReadingMs: Math.max(1000, Math.floor(state.requiredReadingMs)),
    unlocked: state.readingElapsedMs >= state.requiredReadingMs
  };
}

export async function GET(request: NextRequest) {
  const cookieName = getSessionCookieName();
  const encryptedState = request.cookies.get(cookieName)?.value;
  const state = deserializeSessionState(encryptedState);

  if (!state) {
    return NextResponse.json({ state: null });
  }

  const nextState = settleSessionState(state, { keepHeartbeat: false });
  const response = NextResponse.json({ state: toResponseState(nextState) });
  response.cookies.set(cookieName, serializeSessionState(nextState), cookieOptions());

  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  const validBody = validateBody(body);

  if (!validBody) {
    return NextResponse.json({ error: "Invalid session state payload." }, { status: 400 });
  }

  const now = Date.now();
  const cookieName = getSessionCookieName();
  const currentEncryptedState = request.cookies.get(cookieName)?.value;
  const currentState = deserializeSessionState(currentEncryptedState);

  let nextState: SessionState;

  if (currentState && currentState.pageId === validBody.pageId) {
    const settled = settleSessionState(currentState, { now, keepHeartbeat: false });
    nextState = {
      ...settled,
      articleLanguage: validBody.articleLanguage,
      lastHeartbeatAt: validBody.active ? now : null
    };
  } else {
    nextState = {
      pageId: validBody.pageId,
      articleLanguage: validBody.articleLanguage,
      readingElapsedMs: 0,
      requiredReadingMs: READING_LOCK_MS,
      lastHeartbeatAt: validBody.active ? now : null
    };
  }

  const response = NextResponse.json({ state: toResponseState(nextState) });
  response.cookies.set(cookieName, serializeSessionState(nextState), cookieOptions());

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    ...cookieOptions(),
    maxAge: 0
  });

  return response;
}
