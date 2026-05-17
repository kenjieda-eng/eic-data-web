import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RATE_LIMITS,
  _internal,
  clientIpFrom,
  rateLimit,
  withRateLimitHeaders,
} from "./rate-limit";

describe("rateLimit (in-memory fallback)", () => {
  beforeEach(() => {
    _internal.memoryStore.clear();
  });

  it("allows requests up to the limit", async () => {
    const cfg = { bucket: "test", limit: 3, windowSec: 60 };
    const r1 = await rateLimit("1.1.1.1", cfg, {});
    const r2 = await rateLimit("1.1.1.1", cfg, {});
    const r3 = await rateLimit("1.1.1.1", cfg, {});
    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
    expect(r3.remaining).toBe(0);
    expect(r3.ok).toBe(true);
  });

  it("blocks the request that exceeds the limit and reports retryAfter", async () => {
    const cfg = { bucket: "test", limit: 2, windowSec: 60 };
    await rateLimit("2.2.2.2", cfg, {});
    await rateLimit("2.2.2.2", cfg, {});
    const blocked = await rateLimit("2.2.2.2", cfg, {});
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
    expect(blocked.fallback).toBe(true);
  });

  it("isolates buckets per identifier", async () => {
    const cfg = { bucket: "iso", limit: 1, windowSec: 60 };
    const a = await rateLimit("a", cfg, {});
    const b = await rateLimit("b", cfg, {});
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    const a2 = await rateLimit("a", cfg, {});
    expect(a2.ok).toBe(false);
  });

  it("resets after the window expires", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-05-17T00:00:00Z"));
      const cfg = { bucket: "win", limit: 1, windowSec: 60 };
      const r1 = await rateLimit("z", cfg, {});
      expect(r1.ok).toBe(true);
      const r2 = await rateLimit("z", cfg, {});
      expect(r2.ok).toBe(false);
      vi.setSystemTime(new Date("2026-05-17T00:02:00Z"));
      const r3 = await rateLimit("z", cfg, {});
      expect(r3.ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("rateLimit (Upstash REST path)", () => {
  const env = {
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "tkn",
  };
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("uses Upstash pipeline result when available", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ result: 1 }, { result: 1 }]), { status: 200 }),
    );
    const r = await rateLimit("ip", { bucket: "b", limit: 5, windowSec: 60 }, env);
    expect(r.ok).toBe(true);
    expect(r.limit).toBe(5);
    expect(r.remaining).toBe(4);
    expect(r.fallback).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.upstash.io/pipeline");
    expect(init.method).toBe("POST");
  });

  it("falls back to memory when Upstash fetch throws", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("network"));
    const r = await rateLimit("ip", { bucket: "b", limit: 5, windowSec: 60 }, env);
    expect(r.ok).toBe(true);
    expect(r.fallback).toBe(true);
  });

  it("blocks with retryAfter when Upstash count exceeds the limit", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ result: 6 }, { result: 1 }]), { status: 200 }),
    );
    const r = await rateLimit("ip", { bucket: "b", limit: 5, windowSec: 60 }, env);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBeGreaterThanOrEqual(1);
  });
});

describe("clientIpFrom", () => {
  it("prefers x-forwarded-for first entry", () => {
    const h = new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" });
    expect(clientIpFrom(h)).toBe("1.1.1.1");
  });
  it("falls back to x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "3.3.3.3" });
    expect(clientIpFrom(h)).toBe("3.3.3.3");
  });
  it("returns 'unknown' when no headers", () => {
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});

describe("withRateLimitHeaders", () => {
  it("adds Retry-After when blocked", () => {
    const h = withRateLimitHeaders(
      { "Content-Type": "application/json" },
      { ok: false, limit: 5, remaining: 0, reset: 12345, retryAfter: 30 },
    );
    expect(h["Retry-After"]).toBe("30");
    expect(h["X-RateLimit-Limit"]).toBe("5");
    expect(h["X-RateLimit-Remaining"]).toBe("0");
  });

  it("omits Retry-After when allowed", () => {
    const h = withRateLimitHeaders(
      {},
      { ok: true, limit: 5, remaining: 3, reset: 12345, retryAfter: 0 },
    );
    expect(h["Retry-After"]).toBeUndefined();
  });
});

describe("RATE_LIMITS presets", () => {
  it("has the 3 documented buckets", () => {
    expect(RATE_LIMITS.data).toEqual({ bucket: "data", limit: 60, windowSec: 60 });
    expect(RATE_LIMITS.newsletter).toEqual({ bucket: "newsletter", limit: 5, windowSec: 60 });
    expect(RATE_LIMITS.editorNotify).toEqual({
      bucket: "editor-notify",
      limit: 10,
      windowSec: 3600,
    });
  });
});
