import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("rateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports rateLimiter function", async () => {
    const { rateLimiter } = await import("@/lib/rate-limiter");
    expect(typeof rateLimiter).toBe("function");
  });

  it("allows request within limit", async () => {
    const { rateLimiter } = await import("@/lib/rate-limiter");
    const result = await rateLimiter("test-key", { limit: 5, window: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks request exceeding limit", async () => {
    const { rateLimiter } = await import("@/lib/rate-limiter");
    const key = "block-test";

    for (let i = 0; i < 3; i++) {
      await rateLimiter(key, { limit: 3, window: 60 });
    }

    const result = await rateLimiter(key, { limit: 3, window: 60 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const { rateLimiter } = await import("@/lib/rate-limiter");
    const key = "reset-test";

    await rateLimiter(key, { limit: 2, window: 60 });
    await rateLimiter(key, { limit: 2, window: 60 });

    vi.advanceTimersByTime(61000);

    const result = await rateLimiter(key, { limit: 2, window: 60 });
    expect(result.allowed).toBe(true);
  });

  it("returns correct reset timestamp", async () => {
    const { rateLimiter } = await import("@/lib/rate-limiter");
    const result = await rateLimiter("timestamp-test", { limit: 5, window: 60 });
    expect(result.reset).toBeInstanceOf(Date);
    expect(result.reset.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("apiRateLimit middleware", () => {
  it("exports apiRateLimit function", async () => {
    const { apiRateLimit } = await import("@/lib/rate-limiter");
    expect(typeof apiRateLimit).toBe("function");
  });
});
