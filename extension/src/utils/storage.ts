import browser from 'webextension-polyfill';
import { ExtensionSettings, DEFAULT_SETTINGS, STORAGE_KEY } from '../types';

export async function getSettings(): Promise<ExtensionSettings> {
	const result = await browser.storage.sync.get([STORAGE_KEY]);
	if (result[STORAGE_KEY]) {
		return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
	}
	return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
	await browser.storage.sync.set({ [STORAGE_KEY]: settings });
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
		changes: { [key: string]: browser.Storage.StorageChange },
		areaName: string
	) => {
		if (areaName === 'sync' && changes[STORAGE_KEY]) {
			const newValue = changes[STORAGE_KEY].newValue as Partial<ExtensionSettings>;
			const newSettings = {
				...DEFAULT_SETTINGS,
				...newValue,
			};
			callback(newSettings);
		}
	};

	browser.storage.onChanged.addListener(listener);

	return () => {
		browser.storage.onChanged.removeListener(listener);
	};
}
