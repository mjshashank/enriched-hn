import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
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
 * Enrich a single story with LLM-generated classification
 * Used by queue consumer for per-story processing
 */
export async function enrichSingleStory(storyData: StoryWithComments, apiKey: string): Promise<EnrichedStory> {
	const google = createGoogleGenerativeAI({ apiKey });

	const prompt = buildPrompt([storyData]);

	const { object } = await generateObject({
		model: google('gemini-3-flash-preview'),
		schema: batchEnrichmentSchema,
		prompt,
		providerOptions: {
			google: {
				thinkingConfig: {
					thinkingLevel: 'low',
					includeThoughts: false,
				},
			},
		},
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
