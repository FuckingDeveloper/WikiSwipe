import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const COOKIE_NAME = "wikiswipe_history";
const rawSessionSecret = process.env.SESSION_SECRET;
const isProductionBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (!rawSessionSecret && process.env.NODE_ENV === "production" && !isProductionBuildPhase) {
  throw new Error("SESSION_SECRET is required in production.");
}

const SESSION_SECRET = rawSessionSecret ?? "dev-only-insecure-change-me-for-production";

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const MAX_VOTED_IDS = 500;

type VoteHistoryState = {
  votedPageIds: number[];
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

function normalizeIds(ids: unknown): number[] {
  if (!Array.isArray(ids)) return [];

  return ids
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(-MAX_VOTED_IDS);
}

export function getVoteHistoryCookieName(): string {
  return COOKIE_NAME;
}

export function serializeVoteHistory(state: VoteHistoryState): string {
  return encrypt(
    JSON.stringify({
      votedPageIds: normalizeIds(state.votedPageIds)
    })
  );
}

export function deserializeVoteHistory(cookieValue: string | undefined): VoteHistoryState {
  if (!cookieValue) return { votedPageIds: [] };

  const decrypted = decrypt(cookieValue);
  if (!decrypted) return { votedPageIds: [] };

  try {
    const parsed = JSON.parse(decrypted) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { votedPageIds: [] };
    }

    const candidate = parsed as Partial<VoteHistoryState>;
    return {
      votedPageIds: normalizeIds(candidate.votedPageIds)
    };
  } catch {
    return { votedPageIds: [] };
  }
}

export function appendVotedPageId(history: VoteHistoryState, pageId: number): VoteHistoryState {
  const current = new Set(normalizeIds(history.votedPageIds));
  current.add(pageId);

  return {
    votedPageIds: Array.from(current).slice(-MAX_VOTED_IDS)
  };
}
