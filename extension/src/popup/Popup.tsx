import { useSettings } from './hooks/useSettings';
import { TopicFilter } from './components/TopicFilter';
import { TypeFilter } from './components/TypeFilter';
import { TechnicalFilter } from './components/TechnicalFilter';
import { TagVisibility } from './components/TagVisibility';

export function Popup() {
	const { settings, updateSettings, isLoading, error, clearError } = useSettings();

	if (isLoading) {
		return (
			<div className="w-80 p-4 bg-white flex items-center justify-center" role="status" aria-label="Loading settings">
				<div className="animate-pulse text-gray-400">Loading...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-80 p-4 bg-white" role="alert">
				<div className="text-red-600 text-sm mb-2">Error: {error}</div>
				<button
					onClick={clearError}
					className="text-xs text-blue-600 hover:text-blue-800 underline"
				>
					Try again
				</button>
			</div>
		);
	}

	return (
		<div className="w-80 bg-white" role="main">
			{/* Header */}
			<div className="p-4 border-b border-gray-100">
				<div className="flex items-center justify-between">
					<h1 className="text-lg font-bold text-gray-900">Enriched HN</h1>
					<label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle extension">
						<input
							type="checkbox"
							checked={settings.enabled}
							onChange={(e) => updateSettings({ enabled: e.target.checked })}
							className="sr-only peer"
							aria-describedby="toggle-status"
						/>
						<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
					</label>
				</div>
				<p id="toggle-status" className="mt-1 text-xs text-gray-500">{settings.enabled ? 'Extension is active' : 'Extension is disabled'}</p>
			</div>

			{/* Filters */}
			<div className={`p-4 space-y-4 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
				<TagVisibility
					showTopic={settings.showTopicTag}
					showType={settings.showTypeTag}
					showOther={settings.showOtherTags}
					onShowTopicChange={(show) => updateSettings({ showTopicTag: show })}
					onShowTypeChange={(show) => updateSettings({ showTypeTag: show })}
					onShowOtherChange={(show) => updateSettings({ showOtherTags: show })}
				/>

				<div className="border-t border-gray-100 pt-4">
					<TypeFilter
						mode={settings.typeFilterMode}
						selected={settings.filteredTypes}
						onModeChange={(mode) => updateSettings({ typeFilterMode: mode })}
						onSelectionChange={(types) => updateSettings({ filteredTypes: types })}
					/>
				</div>

				<div className="border-t border-gray-100 pt-4">
					<TopicFilter
						mode={settings.topicFilterMode}
						selected={settings.filteredTopics}
						onModeChange={(mode) => updateSettings({ topicFilterMode: mode })}
						onSelectionChange={(topics) => updateSettings({ filteredTopics: topics })}
					/>
				</div>

				<div className="border-t border-gray-100 pt-4">
					<TechnicalFilter
						enabled={settings.technicalFilter.enabled}
						threshold={settings.technicalFilter.threshold}
						mode={settings.technicalFilter.mode}
						onEnabledChange={(enabled) =>
							updateSettings({
								technicalFilter: { ...settings.technicalFilter, enabled },
							})
						}
						onThresholdChange={(threshold) =>
							updateSettings({
								technicalFilter: { ...settings.technicalFilter, threshold },
							})
						}
						onModeChange={(mode) =>
							updateSettings({
								technicalFilter: { ...settings.technicalFilter, mode },
							})
						}
					/>
				</div>
			</div>
		</div>
	);
}
