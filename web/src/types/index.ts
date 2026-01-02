// Type definitions for the Enriched HN web app

export interface EnrichedStory {
	id: number;
	title: string;
	content_type: ContentType;
	topic: Topic;
	technologies: string[];
	tags: string[];
	is_technical: number;
	analyzed_at: string;
	comment_count_at_analysis: number;
}

export type ContentType =
	| "show-hn"
	| "ask-hn"
	| "launch"
	| "tutorial"
	| "article"
	| "paper"
	| "news"
	| "discussion"
	| "job"
	| "repository"
	| "media"
	| "other";

export type Topic =
	| "ai-ml"
	| "web-dev"
	| "mobile-dev"
	| "design-ux"
	| "systems"
	| "databases"
	| "devops"
	| "security"
	| "networking"
	| "languages"
	| "gaming"
	| "hardware"
	| "robotics"
	| "data-science"
	| "math"
	| "science"
	| "startups"
	| "big-tech"
	| "career"
	| "open-source"
	| "culture"
	| "productivity"
	| "finance"
	| "policy"
	| "media"
	| "other";

export interface StoriesResponse {
	[storyId: string]: EnrichedStory;
}
