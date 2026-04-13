import { AppLanguage, isSupportedLanguage } from "@/lib/i18n";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const COOKIE_NAME = "wikiswipe_state";
const rawSessionSecret = process.env.SESSION_SECRET;

if (!rawSessionSecret && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET is required in production.");
}

const SESSION_SECRET =
  rawSessionSecret ?? "dev-only-insecure-change-me-for-production";

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export const READING_LOCK_SECONDS = 30;
export const READING_LOCK_MS = READING_LOCK_SECONDS * 1000;
export const HEARTBEAT_MAX_STEP_MS = 3200;

type SessionState = {
  pageId: number;
  articleLanguage: AppLanguage;
  readingElapsedMs: number;
  requiredReadingMs: number;
  lastHeartbeatAt: number | null;
};

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64");
}

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function encrypt(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(SESSION_SECRET);
  const cipher = createCipheriv(AES_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [toBase64Url(iv), toBase64Url(tag), toBase64Url(encrypted)].join(".");
}

function decrypt(cipherText: string): string | null {
  try {
    const [ivRaw, tagRaw, encryptedRaw] = cipherText.split(".");
    if (!ivRaw || !tagRaw || !encryptedRaw) return null;

    const iv = fromBase64Url(ivRaw);
    const tag = fromBase64Url(tagRaw);
    const encrypted = fromBase64Url(encryptedRaw);

    const key = deriveKey(SESSION_SECRET);
    const decipher = createDecipheriv(AES_ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

function isValidState(value: unknown): value is SessionState {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<SessionState>;
  return Boolean(
    Number.isFinite(candidate.pageId) &&
      isSupportedLanguage(candidate.articleLanguage) &&
      Number.isFinite(candidate.readingElapsedMs) &&
      Number.isFinite(candidate.requiredReadingMs) &&
      (candidate.lastHeartbeatAt === null || Number.isFinite(candidate.lastHeartbeatAt))
  );
}

export function advanceReadingElapsedMs(
  state: SessionState,
  now: number = Date.now()
): number {
  if (!Number.isFinite(now) || !state.lastHeartbeatAt) {
    return state.readingElapsedMs;
  }

  const delta = now - state.lastHeartbeatAt;
  if (!Number.isFinite(delta) || delta <= 0) {
    return state.readingElapsedMs;
  }

  if (delta > HEARTBEAT_MAX_STEP_MS) {
    return state.readingElapsedMs;
  }

  return state.readingElapsedMs + delta;
}

export function settleSessionState(
  state: SessionState,
  options?: { now?: number; keepHeartbeat?: boolean }
): SessionState {
  const now = options?.now ?? Date.now();
  const keepHeartbeat = options?.keepHeartbeat ?? false;

  const readingElapsedMs = Math.max(0, Math.floor(advanceReadingElapsedMs(state, now)));

  return {
    pageId: state.pageId,
    articleLanguage: state.articleLanguage,
    readingElapsedMs,
    requiredReadingMs: Math.max(1000, Math.floor(state.requiredReadingMs)),
    lastHeartbeatAt: keepHeartbeat ? now : null
  };
}

export function serializeSessionState(state: SessionState): string {
  return encrypt(JSON.stringify(state));
}

export function deserializeSessionState(cookieValue: string | undefined): SessionState | null {
  if (!cookieValue) return null;

  const decrypted = decrypt(cookieValue);
  if (!decrypted) return null;

  try {
    const parsed = JSON.parse(decrypted) as unknown;
    if (!isValidState(parsed)) return null;

    return {
      pageId: parsed.pageId,
      articleLanguage: parsed.articleLanguage,
      readingElapsedMs: Math.max(0, Math.floor(parsed.readingElapsedMs)),
      requiredReadingMs: Math.max(1000, Math.floor(parsed.requiredReadingMs)),
      lastHeartbeatAt: parsed.lastHeartbeatAt === null ? null : Math.floor(parsed.lastHeartbeatAt)
    };
  } catch {
    return null;
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export type { SessionState };
