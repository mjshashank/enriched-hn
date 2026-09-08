import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { StoryWithComments, EnrichedStory, HNComment } from '@enriched-hn/shared';
import { batchEnrichmentSchema } from '@enriched-hn/shared';

/**
 * Format a comment and its children recursively
 * Uses hyphens to show threading depth: -, --, ---, etc.
 */
function formatComment(comment: HNComment, depth: number = 0): string {
	const prefix = '-'.repeat(depth + 1);
	const text = comment.text?.replace(/<[^>]*>/g, ' ').slice(0, 300) || '';
	let result = `${prefix} ${text}\n`;

	if (comment.children && comment.children.length > 0) {
		for (const child of comment.children) {
			result += formatComment(child, depth + 1);
		}
	}

	return result;
}

/**
 * Build context string for a single story
 */
function buildStoryContext(data: StoryWithComments): string {
	const { story, comments } = data;

	let context = `[Story ID: ${story.id}]\n`;
	context += `Title: ${story.title}\n`;

	if (story.url) {
		context += `URL: ${story.url}\n`;
	}

	if (story.text) {
		context += `Text: ${story.text}\n`;
	}

	context += `Score: ${story.score}, Comments: ${story.descendants || 0}\n`;

	if (comments.length > 0) {
		context += `\nTop Comments (with replies):\n`;
		for (const comment of comments) {
			if (comment.text) {
				context += formatComment(comment, 0);
			}
		}
	}

	return context;
}

/**
 * Build prompt for batch enrichment
 */
function buildPrompt(stories: StoryWithComments[]): string {
	const storyContexts = stories.map(buildStoryContext).join('\n---\n');

	return `You are an expert analyst classifying Hacker News stories. For each story provided, generate the appropriate classification object based on the schema.

Analyze the following Hacker News stories and provide a classification for each one.
---
${storyContexts}`;
}

/**
 * One OpenRouter call, with failover handled inside it rather than here.
 * Tried in order; three is the maximum OpenRouter accepts.
 *
 * Gemini first, served through BYOK against the account's own free quota, which
 * allows 20 requests a day. When that is spent the two free models take over,
 * and neither ever bills.
 */
const MODEL_LADDER = [
	'google/gemini-3.8-flash',
	'nvidia/nemotron-3-ultra-550b-a55b:free',
	'nvidia/nemotron-3-super-120b-a12b:free',
] as const;

/**
 * Google sells Gemini through two OpenRouter providers. The BYOK key covers
 * `google-ai-studio` and costs nothing; `google-vertex` is a separate paid
 * endpoint that OpenRouter silently crosses to once the free quota is spent.
 * Excluding Vertex means an exhausted quota falls to the free models instead of
 * quietly running up a bill. Pinning with `only` cannot be used here: it would
 * make the non-Google models unroutable and break the failover.
 */
const IGNORED_PROVIDERS = ['google-vertex'];

/**
 * `models` and `provider` are OpenRouter extensions the AI SDK has no settings
 * for, so inject them into the request body on the way out.
 */
const fetchWithFailover: typeof fetch = (input, init) => {
	if (typeof init?.body === 'string') {
		try {
			const body = JSON.parse(init.body);
			body.models = [...MODEL_LADDER];
			body.provider = { ignore: [...IGNORED_PROVIDERS] };
			init = { ...init, body: JSON.stringify(body) };
		} catch {
			// Leave the body alone if it is not the JSON we expect.
		}
	}
	return fetch(input, init);
};

/**
 * Enrich a single story with LLM-generated classification
 * Used by queue consumer for per-story processing
 */
export async function enrichSingleStory(storyData: StoryWithComments, apiKey: string): Promise<EnrichedStory> {
	const openai = createOpenAI({
		apiKey,
		baseURL: 'https://openrouter.ai/api/v1',
		fetch: fetchWithFailover,
	});

	const prompt = buildPrompt([storyData]);

	const { object } = await generateObject({
		model: openai(MODEL_LADDER[0], { structuredOutputs: true }),
		schema: batchEnrichmentSchema,
		prompt,
	});

	const result = object.stories[0];
	if (!result) {
		throw new Error(`LLM returned no result for story ${storyData.story.id}`);
	}

	return {
		id: result.id,
		hn_title: storyData.story.title,
		content_type: result.content_type,
		topic: result.topic,
		technologies: result.technologies,
		tags: result.tags,
		is_technical: result.is_technical,
		analyzed_at: new Date().toISOString(),
		comment_count_at_analysis: storyData.story.descendants || 0,
	};
}
