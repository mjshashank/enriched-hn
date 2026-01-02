interface TagVisibilityProps {
	showTopic: boolean;
	showType: boolean;
	showOther: boolean;
	onShowTopicChange: (show: boolean) => void;
	onShowTypeChange: (show: boolean) => void;
	onShowOtherChange: (show: boolean) => void;
}

export function TagVisibility({
	showTopic,
	showType,
	showOther,
	onShowTopicChange,
	onShowTypeChange,
	onShowOtherChange,
}: TagVisibilityProps) {
	return (
		<fieldset className="space-y-2">
			<legend className="text-sm font-medium text-gray-700">Tag Visibility</legend>
			<div className="space-y-2">
				<label className="flex items-center justify-between cursor-pointer">
					<span className="text-xs text-gray-600">Show Type</span>
					<input
						type="checkbox"
						checked={showType}
						onChange={(e) => onShowTypeChange(e.target.checked)}
						className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
						aria-label="Show content type tags"
					/>
				</label>
				<label className="flex items-center justify-between cursor-pointer">
					<span className="text-xs text-gray-600">Show Topic</span>
					<input
						type="checkbox"
						checked={showTopic}
						onChange={(e) => onShowTopicChange(e.target.checked)}
						className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
						aria-label="Show topic tags"
					/>
				</label>
				<label className="flex items-center justify-between cursor-pointer">
					<span className="text-xs text-gray-600">Show Tags</span>
					<input
						type="checkbox"
						checked={showOther}
						onChange={(e) => onShowOtherChange(e.target.checked)}
						className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
						aria-label="Show other tags like technologies"
					/>
				</label>
			</div>
		</fieldset>
	);
}
