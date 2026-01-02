import type { EnrichedStory, HNStory } from '@enriched-hn/shared';
import { KV_PREFIX, KV_TTL_SECONDS } from '@enriched-hn/shared';

/**
 * Get a story from KV by ID
 */
export async function getStory(
  kv: KVNamespace,
  id: number
): Promise<EnrichedStory | null> {
  const key = `${KV_PREFIX}${id}`;
  return kv.get<EnrichedStory>(key, 'json');
}

/**
 * Enrichment filter result
 */
export interface StoryNeedingEnrichment {
  id: number;
  reason: 'new' | 're-enrich';
  currentComments: number;
  previousComments?: number;
}

/**
 * Filter stories that need enrichment (new or significant comment growth)
 * Re-enriches if:
 * - Comments grew by >50% relative to previous count
 * - OR comments grew by >20 absolute comments
 */
export async function filterStoriesNeedingEnrichment(
  kv: KVNamespace,
  stories: HNStory[]
): Promise<StoryNeedingEnrichment[]> {
  const checks = await Promise.all(
    stories.map(async (story): Promise<StoryNeedingEnrichment | null> => {
      const existing = await getStory(kv, story.id);
      const currentComments = story.descendants || 0;

      if (!existing) {
        return { id: story.id, reason: 'new', currentComments };
      }

      const previousComments = existing.comment_count_at_analysis;
      const growth = currentComments - previousComments;
      const growthPercent =
        previousComments > 0
          ? growth / previousComments
          : currentComments > 0
            ? 1
            : 0;

      // Re-enrich if >50% growth OR >20 new comments
      if (growthPercent > 0.5 || growth > 20) {
        return {
          id: story.id,
          reason: 're-enrich',
          currentComments,
          previousComments,
        };
      }

      return null; // No enrichment needed
    })
  );

  return checks.filter((c): c is StoryNeedingEnrichment => c !== null);
}

/**
 * Save an enriched story to KV
 */
export async function saveStory(
  kv: KVNamespace,
  story: EnrichedStory
): Promise<void> {
  const key = `${KV_PREFIX}${story.id}`;
  await kv.put(key, JSON.stringify(story), {
    expirationTtl: KV_TTL_SECONDS,
  });
}

/**
 * Save multiple stories to KV
 */
export async function saveStories(
  kv: KVNamespace,
  stories: EnrichedStory[]
): Promise<void> {
  await Promise.all(stories.map((story) => saveStory(kv, story)));
}

/**
 * Get multiple stories from KV by IDs
 * Returns a map of id -> story (excludes missing)
 */
export async function getStories(
  kv: KVNamespace,
  ids: number[]
): Promise<Map<number, EnrichedStory>> {
  const results = await Promise.all(
    ids.map(async (id) => {
      const story = await getStory(kv, id);
      return { id, story };
    })
  );

  const map = new Map<number, EnrichedStory>();
  for (const { id, story } of results) {
    if (story) {
      map.set(id, story);
    }
  }
  return map;
}
