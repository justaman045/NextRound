import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 5 requests per 1 minute
export const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});

/**
 * Helper to check rate limit for a specific identifier (e.g., user ID or IP)
 * @param identifier The unique string to track (uid or ip)
 * @returns { success: boolean, limit: number, remaining: number, reset: number }
 */
export async function checkRateLimit(identifier: string) {
    // If env vars are missing, pass to avoid breaking development
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn("Upstash Redis env vars missing. Rate limiting is disabled.");
        return { success: true, limit: 100, remaining: 100, reset: 0 };
    }

    return await ratelimit.limit(identifier);
}
