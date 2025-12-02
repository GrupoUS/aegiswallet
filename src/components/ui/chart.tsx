import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';
import type { ChartPayload } from '@/types/financial/chart.types';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { dark: '.dark', light: '' } as const;

export type ChartConfig = {
	[Key in string]: {
		label?: React.ReactNode;
		icon?: React.ComponentType;
	} & (
		| { color?: string; theme?: never }
		| { color?: never; theme: Record<keyof typeof THEMES, string> }
	);
};

interface ChartContextProps {
	config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
	const context = React.useContext(ChartContext);

	if (!context) {
		throw new Error('useChart must be used within a <ChartContainer />');
	}

	return context;
}

const ChartContainer = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> & {
		config: ChartConfig;
		children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
	}
>(({ id, className, children, config, ...props }, ref) => {
	const uniqueId = React.useId();
	const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				data-chart={chartId}
				ref={ref}
				className={cn(
					"flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
					className,
				)}
				{...props}
			>
				<ChartStyle id={chartId} config={config} />
				<RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
});
ChartContainer.displayName = 'Chart';

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
	const colorConfig = Object.entries(config).filter(([, entry]) => entry.theme || entry.color);

	// Create CSS styles safely without using dangerouslySetInnerHTML
	React.useEffect(() => {
		// Return early if no color config
		if (!colorConfig.length) {
			return;
		}

		// Create or update style element safely
		let styleElement = document.getElementById(`chart-styles-${id}`) as HTMLStyleElement;

		if (!styleElement) {
			styleElement = document.createElement('style');
			styleElement.id = `chart-styles-${id}`;
			styleElement.type = 'text/css';
			document.head.appendChild(styleElement);
		}

		// Build CSS string safely with proper escaping
		const cssRules = Object.entries(THEMES)
			.map(([theme, prefix]) => {
				const selector = `${prefix} [data-chart="${id.replace(/"/g, '\\"')}"]`;
				const colorRules = colorConfig
					.map(([key, itemConfig]) => {
						const color =
							itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
						return color ? `  --color-${key}: ${color};` : null;
					})
					.filter(Boolean)
					.join('\n');

				return colorRules ? `${selector} {\n${colorRules}\n}` : '';
			})
			.filter(Boolean)
			.join('\n\n');

		// Set CSS content safely
		styleElement.textContent = cssRules;

		// Cleanup function
		return () => {
			if (styleElement && styleElement.parentNode === document.head) {
				document.head.removeChild(styleElement);
			}
		};
	}, [id, colorConfig]);

	// Return empty fragment as the styles are applied via useEffect
	return React.createElement(React.Fragment);
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> & {
		hideLabel?: boolean;
		hideIndicator?: boolean;
		indicator?: 'line' | 'dot' | 'dashed';
		nameKey?: string;
		labelKey?: string;
		active?: boolean;
		payload?: ChartPayload[];
		label?: string;
		labelFormatter?: (label: React.ReactNode, payload?: ChartPayload[]) => React.ReactNode;
		labelClassName?: string;
		formatter?: (
			value: number,
			name: string,
			item: ChartPayload,
			index: number,
			payload: ChartPayload[],
		) => React.ReactNode;
		color?: string;
	}
>(
	(
		{
			active,
			payload,
			className,
			indicator = 'dot',
			hideLabel = false,
			hideIndicator = false,
			label,
			labelFormatter,
			labelClassName,
			formatter,
			color,
			nameKey,
			labelKey,
		},
		ref,
	) => {
		const { config } = useChart();

		const tooltipLabel = React.useMemo(() => {
			if (hideLabel || !payload?.length) {
				return null;
			}

			const [item] = payload || [];
			const key = `${labelKey || item?.dataKey || item?.name || 'value'}`;
			const itemConfig = getPayloadConfigFromPayload(config, item, key);
			const value =
				!labelKey && typeof label === 'string'
					? config[label as keyof typeof config]?.label || label
					: itemConfig?.label;

			if (labelFormatter) {
				return (
					<div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>
				);
			}

			if (!value) {
				return null;
			}

			return <div className={cn('font-medium', labelClassName)}>{value}</div>;
		}, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

		if (!(active && payload?.length)) {
			return null;
		}

		const nestLabel = payload.length === 1 && indicator !== 'dot';

		return (
			<div
				ref={ref}
				className={cn(
					'border/50 grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl',
					className,
				)}
			>
				{!nestLabel ? tooltipLabel : null}
				<div className="grid gap-1.5">
					{payload
						.filter((item: unknown) => {
							const chartItem = item as { type?: string };
							return chartItem.type !== 'none';
						})
						.map((item: ChartPayload, index: number) => {
							const chartItem = item;
							const key = `${nameKey || chartItem.name || chartItem.dataKey || 'value'}`;
							const itemConfig = getPayloadConfigFromPayload(config, chartItem, key);
							const indicatorColor = color || chartItem.payload?.fill || chartItem.color;

							return (
								<div
									key={chartItem.dataKey}
									className={cn(
										'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
										indicator === 'dot' && 'items-center',
									)}
								>
									{formatter && chartItem?.value !== undefined && chartItem.name ? (
										formatter(chartItem.value, chartItem.name, chartItem, index, payload || [])
									) : (
										<>
											{itemConfig?.icon ? (
												<itemConfig.icon />
											) : (
												!hideIndicator && (
													<div
														className={cn(
															'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
															{
																'h-2.5 w-2.5': indicator === 'dot',
																'my-0.5': nestLabel && indicator === 'dashed',
																'w-0 border-[1.5px] border-dashed bg-transparent':
																	indicator === 'dashed',
																'w-1': indicator === 'line',
															},
														)}
														style={
															{
																'--color-bg': indicatorColor,
																'--color-border': indicatorColor,
															} as React.CSSProperties
														}
													/>
												)
											)}
											<div
												className={cn(
													'flex flex-1 justify-between leading-none',
													nestLabel ? 'items-end' : 'items-center',
												)}
											>
												<div className="grid gap-1.5">
													{nestLabel ? tooltipLabel : null}
													<span className="text-muted-foreground">
														{itemConfig?.label || chartItem.name}
													</span>
												</div>
												{chartItem.value && (
													<span className="font-medium font-mono text-foreground tabular-nums">
														{chartItem.value.toLocaleString()}
													</span>
												)}
											</div>
										</>
									)}
								</div>
							);
						})}
				</div>
			</div>
		);
	},
);
ChartTooltipContent.displayName = 'ChartTooltip';

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'> & {
		hideIcon?: boolean;
		nameKey?: string;
		payload?: unknown[];
		verticalAlign?: 'top' | 'bottom' | 'middle';
	}
>(({ className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey }, ref) => {
	const { config } = useChart();

	if (!payload?.length) {
		return null;
	}

	return (
		<div
			ref={ref}
			className={cn(
				'flex items-center justify-center gap-4',
				verticalAlign === 'top' ? 'pb-3' : 'pt-3',
				className,
			)}
		>
			{payload
				.filter((item: unknown) => {
					const chartItem = item as { type?: string };
					return chartItem.type !== 'none';
				})
				.map((item: unknown, _index: number) => {
					const chartItem = item as ChartPayload;
					const key = `${nameKey || chartItem.dataKey || 'value'}`;
					const itemConfig = getPayloadConfigFromPayload(config, item, key);
					const indicatorColor = chartItem.color || 'var(--color-primary)';

					return (
						<div
							key={chartItem.name || chartItem.dataKey || 'value'}
							className={cn(
								'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground',
							)}
						>
							{itemConfig?.icon && !hideIcon ? (
								<itemConfig.icon />
							) : (
								<div
									className="h-2 w-2 shrink-0 rounded-[2px]"
									style={{
										backgroundColor: indicatorColor,
									}}
								/>
							)}
							{itemConfig?.label}
						</div>
					);
				})}
		</div>
	);
});
ChartLegendContent.displayName = 'ChartLegend';

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
	if (typeof payload !== 'object' || payload === null) {
		return undefined;
	}

	const payloadPayload =
		'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null
			? payload.payload
			: undefined;

	let configLabelKey: string = key;

	if (key in payload && typeof payload[key as keyof typeof payload] === 'string') {
		configLabelKey = payload[key as keyof typeof payload] as string;
	} else if (
		payloadPayload &&
		key in payloadPayload &&
		typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
	) {
		configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
	}

	return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}

export {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	ChartStyle,
};
