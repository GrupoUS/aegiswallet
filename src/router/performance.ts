/**
 * Router Performance Utilities for AegisWallet Brazilian Financial Application
 *
 * Optimized preloading strategies and performance monitoring for financial dashboards
 * with real-time data requirements and Brazilian market compliance.
 */

// Define a location type for route performance monitoring
interface Location {
	pathname: string;
	search?: string;
	hash?: string;
}

// Performance thresholds for financial operations (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
	// Maximum acceptable time for route transitions
	ROUTE_TRANSITION_CRITICAL: 200, // Critical financial routes
	ROUTE_TRANSITION_NORMAL: 500, // Normal routes

	// Maximum acceptable time for data loading
	FINANCIAL_DATA_CRITICAL: 1000, // Financial data for dashboards
	FINANCIAL_DATA_NORMAL: 2000, // General financial data

	// Maximum acceptable time for authentication
	AUTH_CHECK: 500, // Authentication verification

	// Memory usage thresholds (in MB)
	MEMORY_CRITICAL: 100, // Critical memory usage
	MEMORY_WARNING: 75, // Warning level memory usage
} as const;

// Brazilian financial route priorities for preloading
export const ROUTE_PRIORITIES = {
	// Highest priority - core financial dashboards
	CRITICAL: 10,

	// High priority - frequently accessed financial pages
	HIGH: 8,

	// Medium priority - settings and configuration
	MEDIUM: 6,

	// Low priority - rarely accessed pages
	LOW: 4,

	// Lowest priority - static pages
	STATIC: 2,
} as const;

// Route priority mapping for Brazilian financial application
export const ROUTE_PRIORITY_MAP: Record<string, number> = {
	'/dashboard': ROUTE_PRIORITIES.CRITICAL,
	'/saldo': ROUTE_PRIORITIES.CRITICAL,
	'/contas': ROUTE_PRIORITIES.HIGH,
	'/contas-bancarias': ROUTE_PRIORITIES.HIGH,
	'/calendario': ROUTE_PRIORITIES.MEDIUM,
	'/configuracoes': ROUTE_PRIORITIES.MEDIUM,
	'/ai-chat': ROUTE_PRIORITIES.MEDIUM,
	'/settings': ROUTE_PRIORITIES.LOW,
	'/privacidade': ROUTE_PRIORITIES.STATIC,
	'/login': ROUTE_PRIORITIES.STATIC,
	'/signup': ROUTE_PRIORITIES.STATIC,
} as const;

// Real-time data requirements for different routes
export const REALTIME_REQUIREMENTS: Record<
	string,
	{
		interval: number; // Update interval in milliseconds
		enabled: boolean; // Whether real-time updates are enabled
		critical: boolean; // Whether updates are critical for user experience
	}
> = {
	'/dashboard': {
		interval: 30000, // 30 seconds for dashboard updates
		enabled: true,
		critical: true,
	},
	'/saldo': {
		interval: 15000, // 15 seconds for balance updates
		enabled: true,
		critical: true,
	},
	'/contas': {
		interval: 30000, // 30 seconds for transactions
		enabled: true,
		critical: false,
	},
	'/contas-bancarias': {
		interval: 60000, // 1 minute for bank account syncs
		enabled: true,
		critical: false,
	},
} as const;

/**
 * Performance monitoring class for financial routes
 */
export class FinancialRoutePerformanceMonitor {
	private static instance: FinancialRoutePerformanceMonitor;
	private metrics: Map<string, PerformanceMetric[]> = new Map();
	private observers: PerformanceObserver[] = [];

	private constructor() {
		this.initializeObservers();
	}

	public static getInstance(): FinancialRoutePerformanceMonitor {
		if (!FinancialRoutePerformanceMonitor.instance) {
			FinancialRoutePerformanceMonitor.instance =
				new FinancialRoutePerformanceMonitor();
		}
		return FinancialRoutePerformanceMonitor.instance;
	}

	/**
	 * Initialize performance observers
	 */
	private initializeObservers() {
		// Observer for navigation timing
		if ('PerformanceObserver' in window) {
			const navObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.entryType === 'navigation') {
						this.recordNavigationMetric(entry as PerformanceNavigationTiming);
					}
				}
			});
			navObserver.observe({ entryTypes: ['navigation'] });
			this.observers.push(navObserver);
		}
	}

	/**
	 * Record navigation performance metrics
	 */
	private recordNavigationMetric(entry: PerformanceNavigationTiming) {
		const pathname = window.location.pathname;
		const metric: PerformanceMetric = {
			timestamp: Date.now(),
			pathname,
			duration: entry.loadEventEnd - entry.loadEventStart,
			domContentLoaded:
				entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
			firstPaint: this.getFirstPaint(),
			firstContentfulPaint: this.getFirstContentfulPaint(),
		};

		this.addMetric(pathname, metric);
		this.checkPerformanceThresholds(pathname, metric);
	}

	/**
	 * Get First Paint time
	 */
	private getFirstPaint(): number | undefined {
		const paintEntries = performance.getEntriesByType('paint');
		const firstPaint = paintEntries.find(
			(entry) => entry.name === 'first-paint',
		);
		return firstPaint?.startTime;
	}

	/**
	 * Get First Contentful Paint time
	 */
	private getFirstContentfulPaint(): number | undefined {
		const paintEntries = performance.getEntriesByType('paint');
		const fcp = paintEntries.find(
			(entry) => entry.name === 'first-contentful-paint',
		);
		return fcp?.startTime;
	}

	/**
	 * Add performance metric
	 */
	public addMetric(pathname: string, metric: PerformanceMetric) {
		if (!this.metrics.has(pathname)) {
			this.metrics.set(pathname, []);
		}

		const routeMetrics = this.metrics.get(pathname) ?? [];
		routeMetrics.push(metric);
		this.metrics.set(pathname, routeMetrics);

		// Keep only last 100 metrics per route
		if (routeMetrics.length > 100) {
			routeMetrics.shift();
		}
	}

	/**
	 * Check performance against thresholds and log warnings
	 */
	private checkPerformanceThresholds(
		pathname: string,
		metric: PerformanceMetric,
	) {
		const priority = ROUTE_PRIORITY_MAP[pathname] || ROUTE_PRIORITIES.MEDIUM;
		const isCriticalRoute = priority >= ROUTE_PRIORITIES.HIGH;
		const threshold = isCriticalRoute
			? PERFORMANCE_THRESHOLDS.ROUTE_TRANSITION_CRITICAL
			: PERFORMANCE_THRESHOLDS.ROUTE_TRANSITION_NORMAL;

		if (metric.duration > threshold) {
		}
	}

	/**
	 * Get performance metrics for a specific route
	 */
	public getMetrics(pathname: string): PerformanceMetric[] {
		return this.metrics.get(pathname) || [];
	}

	/**
	 * Get average performance for a route
	 */
	public getAveragePerformance(pathname: string): PerformanceAverage | null {
		const metrics = this.getMetrics(pathname);
		if (metrics.length === 0) return null;

		const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
		const avgDuration = totalDuration / metrics.length;

		const totalDomContentLoaded = metrics.reduce(
			(sum, m) => sum + (m.domContentLoaded || 0),
			0,
		);
		const avgDomContentLoaded = totalDomContentLoaded / metrics.length;

		return {
			pathname,
			averageDuration: Math.round(avgDuration),
			averageDomContentLoaded: Math.round(avgDomContentLoaded || 0),
			sampleCount: metrics.length,
			priority: ROUTE_PRIORITY_MAP[pathname] || ROUTE_PRIORITIES.MEDIUM,
		};
	}

	/**
	 * Get preload suggestions based on performance data
	 */
	public getPreloadSuggestions(currentPath: string): string[] {
		const suggestions: string[] = [];
		const currentMetrics = this.getAveragePerformance(currentPath);

		// If current route is slow, suggest preloading related routes
		if (
			currentMetrics &&
			currentMetrics.averageDuration >
				PERFORMANCE_THRESHOLDS.ROUTE_TRANSITION_NORMAL
		) {
			switch (currentPath) {
				case '/dashboard':
					suggestions.push('/saldo', '/contas');
					break;
				case '/saldo':
					suggestions.push('/dashboard', '/contas');
					break;
				case '/contas':
					suggestions.push('/dashboard', '/saldo');
					break;
			}
		}

		return suggestions;
	}

	/**
	 * Check if route should be preloaded based on user behavior
	 */
	public shouldPreload(targetPath: string, currentPath: string): boolean {
		const targetPriority =
			ROUTE_PRIORITY_MAP[targetPath] || ROUTE_PRIORITIES.MEDIUM;
		const currentPriority =
			ROUTE_PRIORITY_MAP[currentPath] || ROUTE_PRIORITIES.MEDIUM;

		// Always preload critical routes
		if (targetPriority >= ROUTE_PRIORITIES.CRITICAL) {
			return true;
		}

		// Preload if coming from high-priority route
		if (
			currentPriority >= ROUTE_PRIORITIES.HIGH &&
			targetPriority >= ROUTE_PRIORITIES.MEDIUM
		) {
			return true;
		}

		// Check if target route has poor performance
		const targetMetrics = this.getAveragePerformance(targetPath);
		if (
			targetMetrics &&
			targetMetrics.averageDuration >
				PERFORMANCE_THRESHOLDS.ROUTE_TRANSITION_NORMAL
		) {
			return true;
		}

		return false;
	}

	/**
	 * Cleanup observers
	 */
	public destroy() {
		for (const observer of this.observers) {
			observer.disconnect();
		}
		this.observers = [];
		this.metrics.clear();
	}
}

// Type definitions
export interface PerformanceMetric {
	timestamp: number;
	pathname: string;
	duration: number;
	domContentLoaded?: number;
	firstPaint?: number;
	firstContentfulPaint?: number;
}

export interface PerformanceAverage {
	pathname: string;
	averageDuration: number;
	averageDomContentLoaded: number;
	sampleCount: number;
	priority: number;
}

/**
 * Get preload strategy for financial routes
 */
export function getPreloadStrategy(
	currentLocation: Location,
	targetLocation: Location,
) {
	const monitor = FinancialRoutePerformanceMonitor.getInstance();
	const currentPath = currentLocation.pathname;
	const targetPath = targetLocation.pathname;

	return {
		shouldPreload: monitor.shouldPreload(targetPath, currentPath),
		priority: ROUTE_PRIORITY_MAP[targetPath] || ROUTE_PRIORITIES.MEDIUM,
		realtimeRequirements: REALTIME_REQUIREMENTS[targetPath] || {
			interval: 60000,
			enabled: false,
			critical: false,
		},
	};
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring() {
	const monitor = FinancialRoutePerformanceMonitor.getInstance();

	return monitor;
}

// Export singleton instance
export const performanceMonitor =
	FinancialRoutePerformanceMonitor.getInstance();
