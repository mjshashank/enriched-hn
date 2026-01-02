// Type definitions for the Enriched HN extension

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

// Topic enum values with groupings for UI
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

// Topic groups for UI organization
export const TOPIC_GROUPS: Record<string, Topic[]> = {
	'Core Engineering': [
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
	],
	'Data & Science': ['data-science', 'math', 'science'],
	'Industry & Career': ['startups', 'big-tech', 'career', 'open-source'],
	'Meta & Culture': ['culture', 'productivity', 'finance', 'policy', 'media'],
	Other: ['other'],
};

// Human-readable labels for topics
export const TOPIC_LABELS: Record<Topic, string> = {
	'ai-ml': 'AI/ML',
	'web-dev': 'Web Dev',
	'mobile-dev': 'Mobile Dev',
	'design-ux': 'Design/UX',
	systems: 'Systems',
	databases: 'Databases',
	devops: 'DevOps',
	security: 'Security',
	networking: 'Networking',
	languages: 'Languages',
	gaming: 'Gaming',
	hardware: 'Hardware',
	robotics: 'Robotics',
	'data-science': 'Data Science',
	math: 'Math',
	science: 'Science',
	startups: 'Startups',
	'big-tech': 'Big Tech',
	career: 'Career',
	'open-source': 'Open Source',
	culture: 'Culture',
	productivity: 'Productivity',
	finance: 'Finance',
	policy: 'Policy',
	media: 'Media',
	other: 'Other',
};

// Human-readable labels for content types
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
	'show-hn': 'Show HN',
	'ask-hn': 'Ask HN',
	launch: 'Launch',
	tutorial: 'Tutorial',
	article: 'Article',
	paper: 'Paper',
	news: 'News',
	discussion: 'Discussion',
	job: 'Job',
	repository: 'Repository',
	media: 'Media',
	other: 'Other',
};

export interface EnrichedStory {
	id: number;
	hn_title: string;
	content_type: ContentType;
	topic: Topic;
	technologies: string[];
	tags: string[];
	is_technical: number;
	analyzed_at: string;
	comment_count_at_analysis: number;
}

export interface StoriesResponse {
	[storyId: string]: EnrichedStory;
}

// Extension settings stored in chrome.storage.sync
export type TechnicalFilterMode = 'hide-comments' | 'hide-story' | 'grey-out';

export interface ExtensionSettings {
	enabled: boolean;
	topicFilterMode: 'include' | 'exclude';
	filteredTopics: Topic[];
	typeFilterMode: 'include' | 'exclude';
	filteredTypes: ContentType[];
	technicalFilter: {
		enabled: boolean;
		threshold: number; // 0.0 to 1.0
		mode: TechnicalFilterMode;
	};
	// Tag visibility settings
	showTopicTag: boolean;
	showTypeTag: boolean;
	showOtherTags: boolean; // technologies and general tags
	apiEndpoint: string;
}

// Default API endpoint - can be overridden at build time with VITE_API_ENDPOINT env var
const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://your-api.workers.dev';

export const DEFAULT_SETTINGS: ExtensionSettings = {
	enabled: true,
	topicFilterMode: 'exclude',
	filteredTopics: [],
	typeFilterMode: 'exclude',
	filteredTypes: [],
	technicalFilter: {
		enabled: false,
		threshold: 0.5,
		mode: 'hide-comments',
	},
	showTopicTag: true,
	showTypeTag: true,
	showOtherTags: true,
	apiEndpoint: DEFAULT_API_ENDPOINT,
};

export const STORAGE_KEY = 'hn-enricher-settings';

// Message types for content script <-> service worker communication
export interface FetchStoriesMessage {
	type: 'FETCH_STORIES';
	ids: number[];
}

export interface FetchStoriesResponse {
	success: boolean;
	data?: StoriesResponse;
	error?: string;
}

export type ExtensionMessage = FetchStoriesMessage;
