// Content script for Hacker News pages
// This script runs on news.ycombinator.com

import browser from 'webextension-polyfill';
import {
	StoriesResponse,
	FetchStoriesMessage,
	FetchStoriesResponse,
	ExtensionSettings,
} from '../types';
import { getSettings, onSettingsChange } from '../utils/storage';
import {
	StoryElement,
	extractStories,
	hideStory,
	showStory,
	greyOutStory,
	hideCommentsLink,
	showCommentsLink,
	removeTags,
	injectTags,
	observeNewStories,
} from './dom';
import { shouldHideStory, shouldHideComments } from './filters';

// Cache enrichments for re-applying when settings change
let enrichmentsCache: StoriesResponse = {};
let storiesCache: StoryElement[] = [];

// Cleanup functions for memory leak prevention
const cleanupFns: (() => void)[] = [];

async function fetchEnrichments(ids: number[]): Promise<StoriesResponse> {
	if (ids.length === 0) return {};

	const message: FetchStoriesMessage = { type: 'FETCH_STORIES', ids };
	const response = await browser.runtime.sendMessage(message) as FetchStoriesResponse;

	if (!response.success) {
		return {};
	}

	return response.data || {};
}

function applyEnrichments(
	stories: StoryElement[],
	enrichments: StoriesResponse,
	settings: ExtensionSettings
): void {
	for (const story of stories) {
		const enrichment = enrichments[story.id];

		// Reset visibility first
		showStory(story);
		showCommentsLink(story);
		removeTags(story);

		if (!enrichment) continue;

		// Check if story should be hidden (topic filter)
		if (shouldHideStory(enrichment, settings)) {
			hideStory(story);
			continue;
		}

		// Check if story is below technical threshold
		if (shouldHideComments(enrichment, settings)) {
			const mode = settings.technicalFilter.mode;

			if (mode === 'hide-story') {
				hideStory(story);
				continue;
			} else if (mode === 'grey-out') {
				greyOutStory(story);
			} else {
				// hide-comments (default)
				hideCommentsLink(story);
			}
		}

		// Inject tags
		injectTags(story, enrichment, settings);
	}
}

async function processStories(stories: StoryElement[]): Promise<void> {
	const settings = await getSettings();
	if (!settings.enabled) {
		return;
	}

	const ids = stories.map((s) => s.id);
	const enrichments = await fetchEnrichments(ids);

	// Merge into cache
	Object.assign(enrichmentsCache, enrichments);

	applyEnrichments(stories, enrichments, settings);
}

async function init(): Promise<void> {
	const settings = await getSettings();
	if (!settings.enabled) {
		return;
	}

	// Extract stories from page
	storiesCache = extractStories();
	if (storiesCache.length === 0) {
		return;
	}

	// Fetch enrichments and apply
	await processStories(storiesCache);

	// Listen for settings changes and store cleanup
	const settingsCleanup = onSettingsChange(async (newSettings) => {
		if (!newSettings.enabled) {
			// Reset all stories to visible, remove tags
			for (const story of storiesCache) {
				showStory(story);
				showCommentsLink(story);
				removeTags(story);
			}
			return;
		}
		applyEnrichments(storiesCache, enrichmentsCache, newSettings);
	});
	cleanupFns.push(settingsCleanup);

	// Observe for new stories (pagination / "More" link) and store cleanup
	const observerCleanup = observeNewStories(async (newStories) => {
		storiesCache.push(...newStories);
		await processStories(newStories);
	});
	cleanupFns.push(observerCleanup);

	// Cleanup on page unload to prevent memory leaks
	window.addEventListener('beforeunload', cleanup);
}

function cleanup(): void {
	for (const fn of cleanupFns) {
		try {
			fn();
		} catch {
			// Ignore cleanup errors
		}
	}
	cleanupFns.length = 0;
}

// Start when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
