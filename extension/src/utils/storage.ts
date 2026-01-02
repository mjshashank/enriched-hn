import { ExtensionSettings, DEFAULT_SETTINGS, STORAGE_KEY } from '../types';

export async function getSettings(): Promise<ExtensionSettings> {
	const result = await chrome.storage.sync.get([STORAGE_KEY]);
	if (result[STORAGE_KEY]) {
		return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
	}
	return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
	await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

export async function updateSettings(
	partial: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
	const current = await getSettings();
	const updated = { ...current, ...partial };
	await saveSettings(updated);
	return updated;
}

export function onSettingsChange(
	callback: (settings: ExtensionSettings) => void
): () => void {
	const listener = (
		changes: { [key: string]: chrome.storage.StorageChange },
		areaName: string
	) => {
		if (areaName === 'sync' && changes[STORAGE_KEY]) {
			const newSettings = {
				...DEFAULT_SETTINGS,
				...changes[STORAGE_KEY].newValue,
			};
			callback(newSettings);
		}
	};

	chrome.storage.onChanged.addListener(listener);

	return () => {
		chrome.storage.onChanged.removeListener(listener);
	};
}
