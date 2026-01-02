import { EnrichedStory, ExtensionSettings, TOPIC_LABELS, CONTENT_TYPE_LABELS } from '../types';

export interface StoryElement {
	id: number;
	row: HTMLTableRowElement;
	subtextRow: HTMLTableRowElement | null;
	spacerRow: HTMLTableRowElement | null;
	titleCell: HTMLTableCellElement | null;
	commentsLink: HTMLAnchorElement | null;
}

export function extractStories(): StoryElement[] {
	const storyRows = document.querySelectorAll<HTMLTableRowElement>('tr.athing');

	return Array.from(storyRows)
		.map((row) => {
			const id = parseInt(row.id, 10);
			const subtextRow = row.nextElementSibling as HTMLTableRowElement | null;
			const spacerRow = subtextRow?.nextElementSibling as HTMLTableRowElement | null;
			const titleCell = row.querySelector(
				'td.title:last-child'
			) as HTMLTableCellElement | null;

			// Find comments link - it's the last anchor with href starting with "item?id="
			let commentsLink: HTMLAnchorElement | null = null;
			if (subtextRow) {
				const links = subtextRow.querySelectorAll<HTMLAnchorElement>(
					'a[href^="item?id="]'
				);
				if (links.length > 0) {
					commentsLink = links[links.length - 1];
				}
			}

			return { id, row, subtextRow, spacerRow, titleCell, commentsLink };
		})
		.filter((s) => !isNaN(s.id));
}

export function hideStory(story: StoryElement): void {
	story.row.style.display = 'none';
	if (story.subtextRow) story.subtextRow.style.display = 'none';
	if (story.spacerRow) story.spacerRow.style.display = 'none';
}

export function showStory(story: StoryElement): void {
	story.row.style.display = '';
	story.row.style.opacity = '';
	if (story.subtextRow) {
		story.subtextRow.style.display = '';
		story.subtextRow.style.opacity = '';
	}
	if (story.spacerRow) story.spacerRow.style.display = '';
}

export function greyOutStory(story: StoryElement): void {
	story.row.style.opacity = '0.4';
	if (story.subtextRow) story.subtextRow.style.opacity = '0.4';
}

export function hideCommentsLink(story: StoryElement): void {
	if (!story.commentsLink) return;

	story.commentsLink.style.display = 'none';

	// Also hide the preceding pipe separator
	const prevSibling = story.commentsLink.previousSibling;
	if (prevSibling && prevSibling.nodeType === Node.TEXT_NODE) {
		const text = prevSibling.textContent || '';
		if (text.includes('|')) {
			(prevSibling as Text).textContent = text.replace(/\s*\|\s*$/, '');
		}
	}
}

export function showCommentsLink(story: StoryElement): void {
	if (!story.commentsLink) return;

	story.commentsLink.style.display = '';

	// Restore pipe separator if needed
	const prevSibling = story.commentsLink.previousSibling;
	if (prevSibling && prevSibling.nodeType === Node.TEXT_NODE) {
		const text = prevSibling.textContent || '';
		if (!text.includes('|')) {
			(prevSibling as Text).textContent = text + ' | ';
		}
	}
}

export function removeTags(story: StoryElement): void {
	// Remove other tags from title
	if (story.titleCell) {
		const existingTags = story.titleCell.querySelector('.hn-enricher-tags');
		if (existingTags) existingTags.remove();
	}
	// Remove inline tags from subtext
	if (story.subtextRow) {
		const inlineTags = story.subtextRow.querySelector('.hn-enricher-inline-tags');
		if (inlineTags) inlineTags.remove();
	}
}

export function injectTags(story: StoryElement, enrichment: EnrichedStory, settings: ExtensionSettings): void {
	// Remove existing tags first
	removeTags(story);

	// Check if any tags should be shown
	if (!settings.showTopicTag && !settings.showTypeTag && !settings.showOtherTags) {
		return;
	}

	// Inject type and topic at the beginning of subtext row (before points)
	if (story.subtextRow && (settings.showTopicTag || settings.showTypeTag)) {
		const subtext = story.subtextRow.querySelector('.subtext');
		if (subtext && subtext.firstChild) {
			const inlineContainer = document.createElement('span');
			inlineContainer.className = 'hn-enricher-inline-tags';

			// Type first
			if (settings.showTypeTag) {
				const typeSpan = document.createElement('span');
				typeSpan.className = 'hn-enricher-inline-tag';
				typeSpan.style.cssText = 'color: #ff6600;';
				typeSpan.textContent = CONTENT_TYPE_LABELS[enrichment.content_type];
				inlineContainer.appendChild(typeSpan);
				inlineContainer.appendChild(document.createTextNode(' | '));
			}

			// Then topic
			if (settings.showTopicTag) {
				const topicSpan = document.createElement('span');
				topicSpan.className = 'hn-enricher-inline-tag';
				topicSpan.style.cssText = 'color: #ff6600;';
				topicSpan.textContent = TOPIC_LABELS[enrichment.topic];
				inlineContainer.appendChild(topicSpan);
				inlineContainer.appendChild(document.createTextNode(' | '));
			}

			subtext.insertBefore(inlineContainer, subtext.firstChild);
		}
	}

	// Inject other tags (technologies, general) after title
	if (settings.showOtherTags && story.titleCell) {
		const titleLine = story.titleCell.querySelector('.titleline');
		if (titleLine) {
			const hasOtherTags = enrichment.technologies.length > 0 || enrichment.tags.length > 0;
			if (hasOtherTags) {
				const tagContainer = document.createElement('span');
				tagContainer.className = 'hn-enricher-tags';
				tagContainer.style.cssText = 'margin-left: 8px; font-size: 10px; white-space: nowrap;';

				// Add technology tags (limit to first 3)
				enrichment.technologies.slice(0, 3).forEach((tech) => {
					const techTag = createSecondaryTag(tech);
					tagContainer.appendChild(techTag);
				});

				// Add general tags (limit to first 2)
				enrichment.tags.slice(0, 2).forEach((tag) => {
					const tagEl = createSecondaryTag(tag);
					tagContainer.appendChild(tagEl);
				});

				titleLine.appendChild(tagContainer);
			}
		}
	}
}

// Secondary tags (technologies, general tags) - subtle
function createSecondaryTag(text: string): HTMLSpanElement {
	const tag = document.createElement('span');
	tag.className = 'hn-enricher-tag hn-enricher-tag-secondary';
	tag.style.cssText = `
		display: inline-block;
		padding: 0 4px;
		margin-left: 4px;
		border-radius: 2px;
		background-color: #f0f0ed;
		border: 1px solid #d0d0c8;
		color: #828282;
		font-size: 9px;
		font-weight: normal;
		vertical-align: middle;
	`;
	tag.textContent = text;
	return tag;
}

export function observeNewStories(callback: (stories: StoryElement[]) => void): () => void {
	const mainTable = document.querySelector('table.itemlist');
	if (!mainTable) {
		// This is expected on non-list pages (item pages, user pages, etc.)
		return () => {};
	}

	const processedIds = new Set<number>();

	// Mark existing stories as processed
	extractStories().forEach((s) => processedIds.add(s.id));

	const observer = new MutationObserver(() => {
		const allStories = extractStories();
		const newStories = allStories.filter((s) => !processedIds.has(s.id));

		if (newStories.length > 0) {
			newStories.forEach((s) => processedIds.add(s.id));
			callback(newStories);
		}
	});

	observer.observe(mainTable, { childList: true, subtree: true });

	return () => observer.disconnect();
}
