import { EnrichedStory, ExtensionSettings } from '../types';

export function shouldHideStory(
	enrichment: EnrichedStory,
	settings: ExtensionSettings
): boolean {
	if (!settings.enabled) return false;

	// Check topic filter
	const { topicFilterMode, filteredTopics } = settings;
	if (filteredTopics.length > 0) {
		const topicInList = filteredTopics.includes(enrichment.topic);
		if (topicFilterMode === 'exclude' && topicInList) {
			return true;
		}
		if (topicFilterMode === 'include' && !topicInList) {
			return true;
		}
	} else if (topicFilterMode === 'include') {
		// No topics selected in include mode - hide all
		return true;
	}

	// Check type filter
	const { typeFilterMode, filteredTypes } = settings;
	if (filteredTypes.length > 0) {
		const typeInList = filteredTypes.includes(enrichment.content_type);
		if (typeFilterMode === 'exclude' && typeInList) {
			return true;
		}
		if (typeFilterMode === 'include' && !typeInList) {
			return true;
		}
	} else if (typeFilterMode === 'include') {
		// No types selected in include mode - hide all
		return true;
	}

	return false;
}

export function shouldHideComments(
	enrichment: EnrichedStory,
	settings: ExtensionSettings
): boolean {
	if (!settings.enabled) return false;
	if (!settings.technicalFilter.enabled) return false;

	// Hide comments if is_technical score is below threshold
	return enrichment.is_technical < settings.technicalFilter.threshold;
}
