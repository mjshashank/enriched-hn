// Background service worker for the extension
// Handles events, API calls, and extension lifecycle

import {
	EnrichedStory,
	StoriesResponse,
	FetchStoriesResponse,
	ExtensionMessage,
} from '../types';
import { getSettings } from '../utils/storage';

const FETCH_TIMEOUT = 10000; // 10 seconds

// In-memory cache for the session
const cache = new Map<string, { data: EnrichedStory; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
	// Extension installed or updated
});

// Message handler for communication with content scripts and popup
chrome.runtime.onMessage.addListener(
	(message: ExtensionMessage, sender, sendResponse) => {
		// Security: Validate message sender origin
		if (!sender.url?.startsWith('https://news.ycombinator.com') &&
			sender.id !== chrome.runtime.id) {
			return false;
		}

		if (message.type === 'FETCH_STORIES') {
			// Runtime validation of message.ids
			if (!Array.isArray(message.ids) || !message.ids.every(id => typeof id === 'number' && Number.isFinite(id))) {
				sendResponse({ success: false, error: 'Invalid story IDs' });
				return true;
			}
			handleFetchStories(message.ids).then(sendResponse);
			return true; // Keep channel open for async response
		}
		return false;
	}
);

async function handleFetchStories(ids: number[]): Promise<FetchStoriesResponse> {
	try {
		const now = Date.now();
		const cached: StoriesResponse = {};
		const uncachedIds: number[] = [];

		// Check cache first
		for (const id of ids) {
			const entry = cache.get(String(id));
			if (entry && now - entry.timestamp < CACHE_TTL) {
				cached[id] = entry.data;
			} else {
				uncachedIds.push(id);
			}
		}

		if (uncachedIds.length === 0) {
			return { success: true, data: cached };
		}

		// Fetch uncached from API (batch in groups of 50)
		const settings = await getSettings();

		// Validate API endpoint URL
		try {
			new URL(settings.apiEndpoint);
		} catch {
			return { success: false, error: 'Invalid API endpoint URL' };
		}

		const batches = chunkArray(uncachedIds, 50);

		for (const batch of batches) {
			const url = `${settings.apiEndpoint}/stories?ids=${batch.join(',')}`;

			// Add timeout to fetch request
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

			try {
				const response = await fetch(url, { signal: controller.signal });
				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data: StoriesResponse = await response.json();

				// Update cache
				for (const [id, story] of Object.entries(data)) {
					cache.set(id, { data: story, timestamp: now });
					cached[id] = story;
				}
			} catch (error) {
				clearTimeout(timeoutId);
				throw error;
			}
		}

		return { success: true, data: cached };
	} catch (error) {
		const message = error instanceof Error && error.name === 'AbortError'
			? 'Request timeout'
			: String(error);
		return { success: false, error: message };
	}
}

function chunkArray<T>(arr: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		chunks.push(arr.slice(i, i + size));
	}
	return chunks;
}
