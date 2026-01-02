import { TechnicalFilterMode } from '../../types';

interface TechnicalFilterProps {
	enabled: boolean;
	threshold: number;
	mode: TechnicalFilterMode;
	onEnabledChange: (enabled: boolean) => void;
	onThresholdChange: (threshold: number) => void;
	onModeChange: (mode: TechnicalFilterMode) => void;
}

export function TechnicalFilter({
	enabled,
	threshold,
	mode,
	onEnabledChange,
	onThresholdChange,
	onModeChange,
}: TechnicalFilterProps) {
	const thresholdPercent = Math.round(threshold * 100);

	return (
		<div className="space-y-2" role="group" aria-labelledby="technical-filter-heading">
			<div className="flex items-center justify-between">
				<h3 id="technical-filter-heading" className="text-sm font-medium text-gray-700">Technical Filter</h3>
				<label className="relative inline-flex items-center cursor-pointer" aria-label="Enable technical filter">
					<input
						type="checkbox"
						checked={enabled}
						onChange={(e) => onEnabledChange(e.target.checked)}
						className="sr-only peer"
						aria-describedby="technical-filter-description"
					/>
					<div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
				</label>
			</div>

			<p id="technical-filter-description" className="text-xs text-gray-500">
				Filter non-technical stories below threshold
			</p>

			<div className={`space-y-3 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`} aria-disabled={!enabled}>
				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<label htmlFor="threshold-slider" className="text-xs text-gray-500">Threshold</label>
						<span id="threshold-value" className="text-xs font-medium text-gray-700">{thresholdPercent}%</span>
					</div>
					<input
						id="threshold-slider"
						type="range"
						min="0"
						max="100"
						value={thresholdPercent}
						onChange={(e) => onThresholdChange(parseInt(e.target.value, 10) / 100)}
						className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={thresholdPercent}
						aria-valuetext={`${thresholdPercent}% technical threshold`}
					/>
					<div className="flex justify-between text-[10px] text-gray-400" aria-hidden="true">
						<span>Non-technical</span>
						<span>Technical</span>
					</div>
				</div>

				<fieldset className="space-y-1">
					<legend className="text-xs text-gray-500">Action for non-technical stories</legend>
					<div className="flex flex-col gap-1" role="radiogroup" aria-label="Filter action mode">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="techMode"
								checked={mode === 'hide-comments'}
								onChange={() => onModeChange('hide-comments')}
								className="w-3 h-3 text-blue-600"
							/>
							<span className="text-xs text-gray-600">Hide comments link</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="techMode"
								checked={mode === 'hide-story'}
								onChange={() => onModeChange('hide-story')}
								className="w-3 h-3 text-blue-600"
							/>
							<span className="text-xs text-gray-600">Hide entire story</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="techMode"
								checked={mode === 'grey-out'}
								onChange={() => onModeChange('grey-out')}
								className="w-3 h-3 text-blue-600"
							/>
							<span className="text-xs text-gray-600">Grey out story</span>
						</label>
					</div>
				</fieldset>
			</div>
		</div>
	);
}
