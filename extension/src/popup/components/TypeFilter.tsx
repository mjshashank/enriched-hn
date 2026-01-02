import { ContentType, CONTENT_TYPES, CONTENT_TYPE_LABELS } from '../../types';

interface TypeFilterProps {
	mode: 'include' | 'exclude';
	selected: ContentType[];
	onModeChange: (mode: 'include' | 'exclude') => void;
	onSelectionChange: (types: ContentType[]) => void;
}

export function TypeFilter({
	mode,
	selected,
	onModeChange,
	onSelectionChange,
}: TypeFilterProps) {
	const toggleType = (type: ContentType) => {
		if (selected.includes(type)) {
			onSelectionChange(selected.filter((t) => t !== type));
		} else {
			onSelectionChange([...selected, type]);
		}
	};

	return (
		<div className="space-y-3" role="group" aria-labelledby="type-filter-heading">
			<div className="flex items-center justify-between">
				<h3 id="type-filter-heading" className="text-sm font-medium text-gray-700">Type Filter</h3>
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

			<p id="type-filter-description" className="text-xs text-gray-500">
				{mode === 'exclude'
					? 'Hide stories with selected types'
					: 'Only show stories with selected types'}
			</p>

			<div className="flex flex-wrap gap-1" role="listbox" aria-multiselectable="true" aria-describedby="type-filter-description">
				{CONTENT_TYPES.map((type) => {
					const isSelected = selected.includes(type);
					return (
						<button
							key={type}
							type="button"
							role="option"
							aria-selected={isSelected}
							onClick={() => toggleType(type)}
							className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
								isSelected
									? mode === 'exclude'
										? 'bg-red-100 border-red-300 text-red-700'
										: 'bg-green-100 border-green-300 text-green-700'
									: 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
							}`}
						>
							{CONTENT_TYPE_LABELS[type]}
						</button>
					);
				})}
			</div>

			{selected.length > 0 && (
				<div className="flex items-center justify-between pt-1 border-t border-gray-100">
					<span className="text-xs text-gray-500">
						{selected.length} type{selected.length !== 1 ? 's' : ''} selected
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
