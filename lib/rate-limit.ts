import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

type Bucket = {
  timestamps: number[];
};

const store = new Map<string, Bucket>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const clientIp = getClientIp(request);
  const bucketKey = `${options.key}:${clientIp}`;

  const bucket = store.get(bucketKey) ?? { timestamps: [] };
  const cutoff = now - options.windowMs;

  bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp > cutoff);

  if (bucket.timestamps.length === 0 && store.has(bucketKey)) {
    store.delete(bucketKey);
  }

  if (bucket.timestamps.length >= options.limit) {
    const earliest = bucket.timestamps[0] ?? now;
    const retryAfterMs = Math.max(1000, options.windowMs - (now - earliest));

    store.set(bucketKey, bucket);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
    };
  }

  bucket.timestamps.push(now);
  store.set(bucketKey, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - bucket.timestamps.length),
    retryAfterSeconds: 0
  };
}

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds)
      }
    }
  );
}
