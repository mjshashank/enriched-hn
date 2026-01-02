// Content Type enum values
export const CONTENT_TYPES = [
  'show-hn',
  'ask-hn',
  'launch',
  'tutorial',
  'article',
  'paper',
  'news',
  'discussion',
  'job',
  'repository',
  'media',
  'other',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

// Topic enum values
export const TOPICS = [
  // Core Software Engineering
  'ai-ml',
  'web-dev',
  'mobile-dev',
  'design-ux',
  'systems',
  'databases',
  'devops',
  'security',
  'networking',
  'languages',
  'gaming',
  'hardware',
  'robotics',
  // Data & Science
  'data-science',
  'math',
  'science',
  // Industry & Career
  'startups',
  'big-tech',
  'career',
  'open-source',
  // Meta & Culture
  'culture',
  'productivity',
  'finance',
  'policy',
  'media',
  // Fallback
  'other',
] as const;

export type Topic = (typeof TOPICS)[number];

/**
 * Enriched story data stored in KV
 */
export interface EnrichedStory {
  /** HN story ID */
  id: number;
  /** Original HN title */
  hn_title: string;
  /** Content type - what kind of post is this */
  content_type: ContentType;
  /** Primary topic - the main subject */
  topic: Topic;
  /** Specific technologies mentioned (0-10) */
  technologies: string[];
  /** Free-form descriptive tags (0-10) */
  tags: string[];
  /** Technical score 0-1: 1 = purely technical, 0 = non-technical */
  is_technical: number;
  /** ISO timestamp when analysis was performed */
  analyzed_at: string;
  /** Number of comments at time of analysis */
  comment_count_at_analysis: number;
}

/**
 * Raw HN story from Firebase API
 */
export interface HNStory {
  id: number;
  title: string;
  url?: string;
  text?: string;
  by: string;
  time: number;
  score: number;
  descendants: number;
  kids?: number[];
  type: 'story' | 'job' | 'poll' | 'pollopt';
}

/**
 * Raw HN comment from Firebase API
 */
export interface HNComment {
  id: number;
  by?: string;
  text?: string;
  time: number;
  parent: number;
  kids?: number[];
  type: 'comment';
  deleted?: boolean;
  dead?: boolean;
  /** Nested child comments (populated by fetchCommentWithChildren) */
  children?: HNComment[];
}

/**
 * Story with fetched comments for LLM context
 */
export interface StoryWithComments {
  story: HNStory;
  comments: HNComment[];
}

/**
 * API response map: { "12345": EnrichedStory, ... }
 */
export type StoriesResponse = Record<string, EnrichedStory>;

/**
 * API error response
 */
export interface APIError {
  error: string;
}

/**
 * Queue message for story enrichment
 */
export interface EnrichmentQueueMessage {
  /** HN story ID to enrich */
  storyId: number;
  /** Reason for enrichment */
  reason: 'new' | 're-enrich';
  /** ISO timestamp when enqueued */
  enqueuedAt: string;
}

/**
 * Cloudflare KV and Queue bindings for workers
 */
export interface Env {
  HN_ENRICHED_DATA: KVNamespace;
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  /** Queue for story enrichment jobs */
  ENRICHMENT_QUEUE?: Queue<EnrichmentQueueMessage>;
}
