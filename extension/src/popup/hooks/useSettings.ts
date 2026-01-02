import { useState, useEffect, useCallback } from 'react';
import { ExtensionSettings, DEFAULT_SETTINGS, STORAGE_KEY } from '../../types';

export function useSettings() {
	const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		try {
			chrome.storage.sync.get([STORAGE_KEY], (result) => {
				// Check for Chrome runtime errors
				if (chrome.runtime.lastError) {
					setError(chrome.runtime.lastError.message || 'Failed to load settings');
					setIsLoading(false);
					return;
				}
				if (result[STORAGE_KEY]) {
					setSettings({ ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] });
				}
				setIsLoading(false);
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to load settings');
			setIsLoading(false);
		}

		// Listen for external changes
		const listener = (
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string
		) => {
			if (areaName === 'sync' && changes[STORAGE_KEY]) {
				setSettings({ ...DEFAULT_SETTINGS, ...changes[STORAGE_KEY].newValue });
			}
		};

		chrome.storage.onChanged.addListener(listener);
		return () => chrome.storage.onChanged.removeListener(listener);
	}, []);

	const updateSettings = useCallback((partial: Partial<ExtensionSettings>) => {
		setSettings((prev) => {
			const newSettings = { ...prev, ...partial };
			chrome.storage.sync.set({ [STORAGE_KEY]: newSettings }, () => {
				if (chrome.runtime.lastError) {
					setError(chrome.runtime.lastError.message || 'Failed to save settings');
				}
			});
			return newSettings;
		});
	}, []);

	const clearError = useCallback(() => setError(null), []);

	return { settings, updateSettings, isLoading, error, clearError };
}
