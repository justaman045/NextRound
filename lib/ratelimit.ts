// TODO: Re-integrate Upstash Redis for AI generation rate limiting
// Removed temporarily to prevent UPSTASH_REDIS_REST_URL warnings during local development.

/**
 * Helper to check rate limit for a specific identifier (e.g., user ID or IP)
 * @param identifier The unique string to track (uid or ip)
 * @returns { success: boolean, limit: number, remaining: number, reset: number }
 */
export async function checkRateLimit(identifier: string) {
    // Rate limits disabled intentionally.
    return { success: true, limit: 100, remaining: 100, reset: 0 };
}
