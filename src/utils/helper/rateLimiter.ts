/**
 * In-memory rate limiter for serverless environments.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxAttempts: 5, windowMs: 60_000 });
 *   if (!limiter.check(ipAddress)) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
 */

type RateLimitEntry = {
	count: number;
	resetTime: number;
};

type RateLimiterOptions = {
	/** Maximum number of attempts allowed within the window */
	maxAttempts: number;
	/** Time window in milliseconds */
	windowMs: number;
};

const store = new Map<string, RateLimitEntry>();

// Auto-clean stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup () {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) return;

	lastCleanup = now;
	for (const [key, entry] of store) {
		if (now > entry.resetTime) {
			store.delete(key);
		}
	}
}

export function createRateLimiter (options: RateLimiterOptions) {
	const { maxAttempts, windowMs } = options;

	return {
		/**
		 * Check if the given key (typically an IP address) is within the rate limit.
		 * @returns `true` if the request is allowed, `false` if rate-limited.
		 */
		check (key: string): boolean {
			cleanup();
			const now = Date.now();
			const entry = store.get(key);

			if (!entry || now > entry.resetTime) {
				store.set(key, { count: 1, resetTime: now + windowMs });
				return true;
			}

			entry.count++;
			if (entry.count > maxAttempts) {
				return false;
			}

			return true;
		},

		/**
		 * Get remaining attempts for a given key.
		 */
		remaining (key: string): number {
			const entry = store.get(key);
			if (!entry || Date.now() > entry.resetTime) return maxAttempts;
			return Math.max(0, maxAttempts - entry.count);
		},
	};
}

// Pre-configured limiters for common use cases
export const authLimiter = createRateLimiter({ maxAttempts: 5, windowMs: 60_000 });
export const orderLimiter = createRateLimiter({ maxAttempts: 10, windowMs: 60_000 });
