// Per-service rate limiting, checked AFTER identity, RBAC, and context
// checks have all already passed — this is a final abuse-prevention
// checkpoint that applies even to a fully legitimate, authorized caller.
//
// Keyed by the verified service identity from the token (not IP — IP is
// meaningless in this mesh since all traffic originates from known
// containers/processes, not external clients). Uses a fixed-window
// counter: each service gets a bucket that resets every RATE_LIMIT_WINDOW_MS
// milliseconds; if it exceeds RATE_LIMIT_MAX requests within that window,
// further requests are rejected until the window resets.

const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 20;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 10000;

// serviceName -> { count, windowStart }
const buckets = new Map();

function checkRateLimit(serviceName) {
  const now = Date.now();
  let bucket = buckets.get(serviceName);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // No bucket yet, or the previous window has expired — start fresh.
    bucket = { count: 0, windowStart: now };
    buckets.set(serviceName, bucket);
  }

  bucket.count += 1;

  if (bucket.count > RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - bucket.windowStart);
    return {
      allowed: false,
      retryAfterMs: Math.max(retryAfterMs, 0),
      count: bucket.count,
      max: RATE_LIMIT_MAX,
    };
  }

  return { allowed: true, count: bucket.count, max: RATE_LIMIT_MAX };
}

module.exports = { checkRateLimit, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS };
