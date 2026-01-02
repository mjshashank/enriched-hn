import { Topic, TOPIC_GROUPS, TOPIC_LABELS } from '../../types';

interface TopicFilterProps {
	mode: 'include' | 'exclude';
	selected: Topic[];
	onModeChange: (mode: 'include' | 'exclude') => void;
	onSelectionChange: (topics: Topic[]) => void;
}

export function TopicFilter({
	mode,
	selected,
	onModeChange,
	onSelectionChange,
}: TopicFilterProps) {
	const toggleTopic = (topic: Topic) => {
		if (selected.includes(topic)) {
			onSelectionChange(selected.filter((t) => t !== topic));
		} else {
			onSelectionChange([...selected, topic]);
		}
	};

	const selectAllInGroup = (topics: Topic[]) => {
		const newSelection = new Set(selected);
		topics.forEach((t) => newSelection.add(t));
		onSelectionChange(Array.from(newSelection));
	};

	const clearAllInGroup = (topics: Topic[]) => {
		onSelectionChange(selected.filter((t) => !topics.includes(t)));
	};

	return (
		<div className="space-y-3" role="group" aria-labelledby="topic-filter-heading">
			<div className="flex items-center justify-between">
				<h3 id="topic-filter-heading" className="text-sm font-medium text-gray-700">Topic Filter</h3>
				<div className="flex rounded-md shadow-sm" role="tablist" aria-label="Filter mode">
					<button
						type="button"
						role="tab"
						aria-selected={mode === 'exclude'}
						onClick={() => onModeChange('exclude')}
						className={`px-2 py-1 text-xs rounded-l-md border ${
							mode === 'exclude'
								? 'bg-red-100 border-red-300 text-red-700'
								: 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
						}`}
					>
						Exclude
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={mode === 'include'}
						onClick={() => onModeChange('include')}
						className={`px-2 py-1 text-xs rounded-r-md border-t border-r border-b ${
							mode === 'include'
								? 'bg-green-100 border-green-300 text-green-700'
								: 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
						}`}
					>
						Include
					</button>
				</div>
			</div>

			<p id="topic-filter-description" className="text-xs text-gray-500">
				{mode === 'exclude'
					? 'Hide stories with selected topics'
					: 'Only show stories with selected topics'}
			</p>

			<div className="space-y-3" aria-describedby="topic-filter-description">
				{Object.entries(TOPIC_GROUPS).map(([groupName, topics]) => (
					<div key={groupName} className="space-y-1" role="group" aria-label={`${groupName} topics`}>
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-gray-500">{groupName}</span>
							<div className="flex gap-1">
								<button
									type="button"
									onClick={() => selectAllInGroup(topics)}
									className="text-[10px] text-blue-600 hover:text-blue-800"
									aria-label={`Select all ${groupName} topics`}
								>
									All
								</button>
								<span className="text-gray-300" aria-hidden="true">|</span>
								<button
									type="button"
									onClick={() => clearAllInGroup(topics)}
									className="text-[10px] text-gray-500 hover:text-gray-700"
									aria-label={`Clear all ${groupName} topics`}
								>
									None
								</button>
							</div>
						</div>
						<div className="flex flex-wrap gap-1" role="listbox" aria-multiselectable="true">
							{topics.map((topic) => {
								const isSelected = selected.includes(topic);
								return (
									<button
										key={topic}
										type="button"
										role="option"
										aria-selected={isSelected}
										onClick={() => toggleTopic(topic)}
										className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
											isSelected
												? mode === 'exclude'
													? 'bg-red-100 border-red-300 text-red-700'
													: 'bg-green-100 border-green-300 text-green-700'
												: 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
										}`}
									>
										{TOPIC_LABELS[topic]}
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>

			{selected.length > 0 && (
				<div className="flex items-center justify-between pt-1 border-t border-gray-100">
					<span className="text-xs text-gray-500">
						{selected.length} topic{selected.length !== 1 ? 's' : ''} selected
					</span>
					<button
						type="button"
						onClick={() => onSelectionChange([])}
						className="text-xs text-gray-500 hover:text-gray-700"
					>
						Clear all
					</button>
				</div>
			)}
		</div>
	);
}
