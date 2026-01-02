/** KV key prefix for story data */
export const KV_PREFIX = 'story:';

/** TTL for KV entries: 1 year in seconds */
export const KV_TTL_SECONDS = 365 * 24 * 60 * 60; // 31536000

/** Number of top stories to fetch from HN */
export const TOP_STORIES_LIMIT = 50;

/** Max top-level comments to fetch per story for context */
export const MAX_COMMENTS_PER_STORY = 50;

/** Max child comments to fetch per parent comment */
export const MAX_CHILDREN_PER_COMMENT = 3;

/** Max depth for recursive comment fetching (1 = top-level only) */
export const MAX_COMMENT_DEPTH = 3;

/** Max stories to enqueue per cron run */
export const MAX_STORIES_TO_ENQUEUE = 20;

/** Delay between enqueued messages in seconds (for LLM rate limiting) */
export const QUEUE_DELIVERY_DELAY_SECONDS = 15;

/** Max concurrent fetch requests for basic story data */
export const FETCH_CONCURRENCY_STORIES = 10;

/** Max concurrent fetch requests for comments */
export const FETCH_CONCURRENCY_COMMENTS = 5;

/** Max stories per LLM call (to stay under token limits) */
export const LLM_BATCH_SIZE = 10;

/** Delay between LLM calls in ms (to respect RPM: 10 RPM = 6000ms) */
export const LLM_CALL_DELAY_MS = 6_000;

/** Max IDs allowed per API request */
export const MAX_IDS_PER_REQUEST = 50;

/** Cache-Control max-age for API responses (5 minutes) */
export const CACHE_MAX_AGE = 300;

/** Cache-Control stale-while-revalidate (1 minute) */
export const CACHE_SWR = 60;

/** HN Firebase API base URL */
export const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';
