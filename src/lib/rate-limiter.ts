interface RateLimitConfig {
  limit: number;
  window: number; // seconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: Date;
  limit: number;
}

const store = new Map<string, { count: number; resetTime: number }>();

export async function rateLimiter(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = config.window * 1000;
  const resetTime = now + windowMs;

  const existing = store.get(key);

  if (!existing || now > existing.resetTime) {
    store.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.limit - 1,
      reset: new Date(resetTime),
      limit: config.limit,
    };
  }

  if (existing.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      reset: new Date(existing.resetTime),
      limit: config.limit,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: config.limit - existing.count,
    reset: new Date(existing.resetTime),
    limit: config.limit,
  };
}

export function apiRateLimit(key: string, limit = 100, window = 60) {
  return rateLimiter(key, { limit, window });
}

export function resetRateLimiter(key?: string) {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}
