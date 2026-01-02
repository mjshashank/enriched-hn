import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { ExtensionSettings, DEFAULT_SETTINGS, STORAGE_KEY } from '../../types';

export function useSettings() {
	const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const result = await browser.storage.sync.get([STORAGE_KEY]);
				if (result[STORAGE_KEY]) {
					setSettings({ ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] });
				}
				setIsLoading(false);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Failed to load settings');
				setIsLoading(false);
			}
		};

		loadSettings();

		// Listen for external changes
		const listener = (
			changes: { [key: string]: browser.Storage.StorageChange },
			areaName: string
		) => {
			if (areaName === 'sync' && changes[STORAGE_KEY]) {
				const newValue = changes[STORAGE_KEY].newValue as Partial<ExtensionSettings>;
				setSettings({ ...DEFAULT_SETTINGS, ...newValue });
			}
		};

		browser.storage.onChanged.addListener(listener);
		return () => browser.storage.onChanged.removeListener(listener);
	}, []);

	const updateSettings = useCallback((partial: Partial<ExtensionSettings>) => {
		setSettings((prev) => {
			const newSettings = { ...prev, ...partial };
			browser.storage.sync.set({ [STORAGE_KEY]: newSettings }).catch((e) => {
				setError(e instanceof Error ? e.message : 'Failed to save settings');
			});
			return newSettings;
		});
	}, []);

	const clearError = useCallback(() => setError(null), []);

	return { settings, updateSettings, isLoading, error, clearError };
}
