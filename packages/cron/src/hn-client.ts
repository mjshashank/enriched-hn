import type { HNStory, HNComment, StoryWithComments } from '@enriched-hn/shared';
import {
  HN_API_BASE,
  TOP_STORIES_LIMIT,
  MAX_COMMENTS_PER_STORY,
  MAX_CHILDREN_PER_COMMENT,
  MAX_COMMENT_DEPTH,
  FETCH_CONCURRENCY_STORIES,
  FETCH_CONCURRENCY_COMMENTS,
} from '@enriched-hn/shared';

// Default timeout for HN API requests (10 seconds)
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Fetch with timeout to prevent hanging requests
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Process items in batches with limited concurrency
 */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Fetch top story IDs from HN
 */
export async function fetchTopStoryIds(): Promise<number[]> {
  const response = await fetchWithTimeout(`${HN_API_BASE}/topstories.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch top stories: ${response.status}`);
  }
  const ids: number[] = await response.json();
  return ids.slice(0, TOP_STORIES_LIMIT);
}

/**
 * Fetch a single story by ID
 */
export async function fetchStory(id: number): Promise<HNStory | null> {
  try {
    const response = await fetchWithTimeout(`${HN_API_BASE}/item/${id}.json`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch a single comment by ID (without children)
 */
async function fetchCommentBasic(id: number): Promise<HNComment | null> {
  try {
    const response = await fetchWithTimeout(`${HN_API_BASE}/item/${id}.json`);
    if (!response.ok) {
      return null;
    }
    const comment: HNComment | null = await response.json();
    // Skip deleted or dead comments
    if (!comment || comment.deleted || comment.dead) {
      return null;
    }
    return comment;
  } catch {
    return null;
  }
}

/**
 * Recursively fetch a comment and its children up to max depth
 * Children are fetched sequentially to limit subrequests
 */
async function fetchCommentWithChildren(
  id: number,
  depth: number = 1
): Promise<HNComment | null> {
  // Don't fetch beyond max depth
  if (depth > MAX_COMMENT_DEPTH) {
    return null;
  }

  const comment = await fetchCommentBasic(id);
  if (!comment) {
    return null;
  }

  // Fetch children sequentially if they exist and we haven't hit max depth
  if (comment.kids && comment.kids.length > 0 && depth < MAX_COMMENT_DEPTH) {
    const childIds = comment.kids.slice(0, MAX_CHILDREN_PER_COMMENT);
    const children: (HNComment | null)[] = [];
    for (const kidId of childIds) {
      children.push(await fetchCommentWithChildren(kidId, depth + 1));
    }
    comment.children = children.filter((c): c is HNComment => c !== null);
  }

  return comment;
}

/**
 * Fetch top-level comments with their children for a story
 * Uses batched processing to limit concurrent requests
 */
export async function fetchComments(
  commentIds: number[],
  limit = MAX_COMMENTS_PER_STORY
): Promise<HNComment[]> {
  const ids = commentIds.slice(0, limit);
  const results = await processInBatches(
    ids,
    FETCH_CONCURRENCY_COMMENTS,
    (id) => fetchCommentWithChildren(id, 1)
  );
  return results.filter((c): c is HNComment => c !== null);
}

/**
 * Fetch story with its top comments
 */
export async function fetchStoryWithComments(
  id: number
): Promise<StoryWithComments | null> {
  const story = await fetchStory(id);
  if (!story) {
    return null;
  }

  const comments = story.kids
    ? await fetchComments(story.kids)
    : [];

  return { story, comments };
}

/**
 * Fetch multiple stories without comments (lightweight, for filtering)
 * Uses batched processing to limit concurrent requests
 */
export async function fetchBasicStories(ids: number[]): Promise<HNStory[]> {
  const results = await processInBatches(
    ids,
    FETCH_CONCURRENCY_STORIES,
    fetchStory
  );
  return results.filter((s): s is HNStory => s !== null);
}

/**
 * Fetch multiple stories with their comments sequentially
 * Sequential processing prevents exceeding Cloudflare subrequest limits
 */
export async function fetchStoriesWithComments(
  ids: number[]
): Promise<StoryWithComments[]> {
  const results: (StoryWithComments | null)[] = [];
  for (const id of ids) {
    results.push(await fetchStoryWithComments(id));
  }
  return results.filter((r): r is StoryWithComments => r !== null);
}
