/**
 * Financial Chart Type Definitions for AegisWallet
 *
 * LGPD Compliance: These types ensure type safety for financial data visualization
 * and prevent accidental exposure of sensitive financial information.
 *
 * @version 1.0.0
 * @since 2025-11-19
 */

export interface ChartPayload {
	/** Financial value (amount, balance, etc.) */
	value: number;

	/** Chart label or category name */
	name: string;

	/** Additional data key for chart identification */
	dataKey: string;

	/** Optional color for chart element */
	color?: string;

	/** Optional metadata for chart interactions */
	metadata?: Record<string, unknown>;

	/** Optional timestamp for time-series data */
	timestamp?: Date;

	/** Chart item type for filtering */
	type?: string;

	/** Optional payload data for nested chart structures */
	payload?: {
		fill?: string;
		[key: string]: unknown;
	};
}

export interface ChartData {
	/** Array of chart data points */
	payload: ChartPayload[];

	/** Optional chart label */
	label?: string;

	/** Optional formatter function for display values */
	formatter?: (
		value: number,
		name: string,
		item: ChartPayload,
		index: number,
		payload: ChartPayload[],
	) => React.ReactNode;

	/** Optional tooltip formatter */
	tooltipFormatter?: (value: number, name: string, item: ChartPayload) => string;

	/** Optional color scheme */
	colors?: string[];
}

export interface ChartConfig {
	/** Chart type (bar, line, pie, etc.) */
	type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';

	/** Data source for the chart */
	data: ChartData[];

	/** Chart dimensions */
	width?: number;
	height?: number;

	/** Accessibility labels */
	title?: string;
	description?: string;

	/** Financial data compliance flag */
	containsSensitiveData: boolean;

	/** LGPD consent requirement for data display */
	requiresConsent?: boolean;
}

/**
 * Type guard for chart item with type property
 * Used to filter out 'none' type items in chart rendering
 */
export function isValidChartItem(item: unknown): item is ChartPayload & { type?: string } {
	return isValidChartPayload(item) && (!('type' in item) || typeof item.type === 'string');
}

/**
 * Type guard for ChartPayload validation
 * Ensures financial data integrity before chart rendering
 */
export function isValidChartPayload(payload: unknown): payload is ChartPayload {
	return (
		typeof payload === 'object' &&
		payload !== null &&
		typeof (payload as ChartPayload).value === 'number' &&
		!Number.isNaN((payload as ChartPayload).value) &&
		typeof (payload as ChartPayload).name === 'string' &&
		typeof (payload as ChartPayload).dataKey === 'string'
	);
}

/**
 * Type guard for ChartData validation
 * Prevents rendering with invalid financial data
 */
export function isValidChartData(data: unknown): data is ChartData {
	return (
		typeof data === 'object' &&
		data !== null &&
		Array.isArray((data as ChartData).payload) &&
		(data as ChartData).payload.every(isValidChartPayload)
	);
}
