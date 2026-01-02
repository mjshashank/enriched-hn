import type { Env, EnrichmentQueueMessage } from '@enriched-hn/shared';
import {
  MAX_STORIES_TO_ENQUEUE,
  QUEUE_DELIVERY_DELAY_SECONDS,
} from '@enriched-hn/shared';
import { fetchTopStoryIds, fetchBasicStories, fetchStoryWithComments } from './hn-client.js';
import { filterStoriesNeedingEnrichment, saveStory } from './kv-store.js';
import { enrichSingleStory } from './enricher.js';

export default {
  /**
   * Scheduled handler - runs every hour
   * Identifies stories needing enrichment and enqueues them for processing
   */
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    if (!env.ENRICHMENT_QUEUE) {
      throw new Error('ENRICHMENT_QUEUE binding not configured');
    }

    // 1. Fetch top story IDs
    const topIds = await fetchTopStoryIds();

    // 2. Fetch basic story data (without comments) for filtering
    const basicStories = await fetchBasicStories(topIds);

    // 3. Filter stories needing enrichment (new or significant comment growth)
    const storiesNeeding = await filterStoriesNeedingEnrichment(
      env.HN_ENRICHED_DATA,
      basicStories
    );

    if (storiesNeeding.length === 0) {
      return;
    }

    // 4. Limit and enqueue stories for processing
    const toEnqueue = storiesNeeding.slice(0, MAX_STORIES_TO_ENQUEUE);

    const now = new Date().toISOString();
    const messages = toEnqueue.map((s, index) => ({
      body: {
        storyId: s.id,
        reason: s.reason,
        enqueuedAt: now,
      } as EnrichmentQueueMessage,
      // Stagger delivery to help with LLM rate limiting (10 RPM)
      delaySeconds: index * QUEUE_DELIVERY_DELAY_SECONDS,
    }));

    await env.ENRICHMENT_QUEUE.sendBatch(messages);
  },

  /**
   * Queue handler - processes one story at a time
   */
  async queue(
    batch: MessageBatch<EnrichmentQueueMessage>,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    // With max_batch_size=1, we process exactly one message per invocation
    for (const message of batch.messages) {
      const { storyId } = message.body;

      try {
        // 1. Fetch story with comments
        const storyWithComments = await fetchStoryWithComments(storyId);
        if (!storyWithComments) {
          message.ack();
          continue;
        }

        // 2. Check API key
        const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
          throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
        }

        // 3. Enrich with LLM
        const enriched = await enrichSingleStory(storyWithComments, apiKey);

        // 4. Save to KV
        await saveStory(env.HN_ENRICHED_DATA, enriched);

        message.ack();
      } catch (error) {
        // Check if it's a rate limit error (429)
        const isRateLimit = error instanceof Error && error.message.includes('429');
        // Retry with longer delay for rate limits (60s), shorter for other errors (30s)
        const delaySeconds = isRateLimit ? 60 : 30;
        message.retry({ delaySeconds });
      }
    }
  },

  /**
   * Fetch handler - no public endpoints, cron/queue-only worker
   */
  async fetch(): Promise<Response> {
    return new Response('Not found', { status: 404 });
  },
};
