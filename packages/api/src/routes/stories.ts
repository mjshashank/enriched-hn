import { Hono } from 'hono';
import type { Env, Variables } from '../types.js';
import type { StoriesResponse, APIError, EnrichedStory } from '@enriched-hn/shared';
import {
  MAX_IDS_PER_REQUEST,
  CACHE_MAX_AGE,
  CACHE_SWR,
  KV_PREFIX,
} from '@enriched-hn/shared';

const stories = new Hono<{ Bindings: Env; Variables: Variables }>();

// Max reasonable HN story ID (for bounds checking)
const MAX_STORY_ID = 100_000_000;
// Max query string length to prevent abuse
const MAX_QUERY_LENGTH = 1000;

/**
 * GET /stories?ids=123,456,789
 * Batch fetch enriched stories by IDs
 */
stories.get('/', async (c) => {
  const idsParam = c.req.query('ids');

  // Validate ids parameter exists and isn't too long
  if (!idsParam) {
    const error: APIError = { error: 'Missing required parameter: ids' };
    return c.json(error, 400);
  }

  if (idsParam.length > MAX_QUERY_LENGTH) {
    const error: APIError = { error: 'Query too long' };
    return c.json(error, 400);
  }

  // Parse and validate IDs
  const idStrings = idsParam.split(',').filter((s) => s.trim() !== '');
  const ids: number[] = [];

  for (const s of idStrings) {
    const id = parseInt(s.trim(), 10);
    if (isNaN(id) || id <= 0 || id > MAX_STORY_ID) {
      const error: APIError = { error: 'Invalid ID format' };
      return c.json(error, 400);
    }
    ids.push(id);
  }

  // Check limit
  if (ids.length > MAX_IDS_PER_REQUEST) {
    const error: APIError = {
      error: `Too many IDs. Maximum is ${MAX_IDS_PER_REQUEST}`,
    };
    return c.json(error, 400);
  }

  if (ids.length === 0) {
    const error: APIError = { error: 'No valid IDs provided' };
    return c.json(error, 400);
  }

  // Fetch stories from KV in parallel
  const results = await Promise.all(
    ids.map(async (id) => {
      const key = `${KV_PREFIX}${id}`;
      const story = await c.env.HN_ENRICHED_DATA.get<EnrichedStory>(key, 'json');
      return { id, story };
    })
  );

  // Build response map (only include found stories)
  const response: StoriesResponse = {};
  for (const { id, story } of results) {
    if (story) {
      response[id.toString()] = story;
    }
  }

  // Set cache headers
  c.header(
    'Cache-Control',
    `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_SWR}`
  );

  return c.json(response);
});

export { stories };
