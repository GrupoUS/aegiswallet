/**
 * Drizzle Database Client - Read Replicas for LGPD Analytics
 *
 * Optimized read replica clients for Brazilian compliance and analytics
 * Supports LGPD reporting, audit trails, and business intelligence
 * Offloads read queries from primary NeonDB to maintain <150ms P95 for PIX
 */

import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';

import * as schema from './schema';

// ========================================
// CONFIGURATION
// ========================================

// Configure Neon for read replica operations
neonConfig.fetchConnectionCache = true;
neonConfig.wsProxy = (url) =>
	`${url}?sslmode=require&connect_timeout=15&application_name=aegis_lgpd_read`;

const getReplicaDatabaseUrl = (): string => {
	const url = process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_REPLICA_URL or DATABASE_URL environment variable is not set');
	}
	return url;
};

// ========================================
// LGPD ANALYTICS CLIENT
// ========================================

/**
 * Create an LGPD analytics client using read replica
 * Optimized for Brazilian compliance queries and reporting
 * Handles large dataset queries without affecting PIX performance
 */
export const createLgpdAnalyticsClient = () => {
	const sql = neon(getReplicaDatabaseUrl());
	return drizzleNeon(sql, {
		schema,
		// LGPD analytics optimization
		logger: false, // Disable logging for performance
		casing: 'snake_case',
	});
};

// Singleton LGPD analytics client
let lgpdAnalyticsClient: ReturnType<typeof createLgpdAnalyticsClient> | null = null;

export const getLgpdAnalyticsClient = () => {
	if (!lgpdAnalyticsClient) {
		lgpdAnalyticsClient = createLgpdAnalyticsClient();
	}
	return lgpdAnalyticsClient;
};

// ========================================
// BUSINESS INTELLIGENCE CLIENT
// ========================================

/**
 * Create a business intelligence client for Brazilian market analytics
 * Uses read replica for complex aggregations and reporting
 * Optimized for Brazilian business hours (9h-18h)
 */
export const createBusinessIntelligenceClient = () => {
	const pool = new Pool({
		connectionString: getReplicaDatabaseUrl(),
		// BI optimization for Brazilian reporting
		max: 10, // Dedicated connections for analytics
		min: 2, // Always ready for Brazilian business hours
		idleTimeoutMillis: 60000, // Longer timeout for complex queries
		connectionTimeoutMillis: 5000, // Allow more time for complex analytics
		// Brazilian timezone optimization
		keepAlive: true,
		keepAliveInitialDelayMillis: 15000,
		// Analytics-specific settings
		allowExitOnIdle: false,
		maxUses: 10000, // Higher usage for analytics workloads
	});

	return drizzlePool(pool, {
		schema,
		// Analytics optimization
		logger: false,
		casing: 'snake_case',
	});
};

// Singleton BI client
let biPool: Pool | null = null;
let biClient: ReturnType<typeof createBusinessIntelligenceClient> | null = null;

export const getBusinessIntelligenceClient = () => {
	if (!biClient) {
		biPool = new Pool({
			connectionString: getReplicaDatabaseUrl(),
			// BI optimization for Brazilian reporting
			max: 10, // Dedicated connections for analytics
			min: 2, // Always ready for Brazilian business hours
			idleTimeoutMillis: 60000, // Longer timeout for complex queries
			connectionTimeoutMillis: 5000, // Allow more time for complex analytics
			// Brazilian timezone optimization
			keepAlive: true,
			keepAliveInitialDelayMillis: 15000,
			// Analytics-specific settings
			allowExitOnIdle: false,
			maxUses: 10000, // Higher usage for analytics workloads
		});
		biClient = drizzlePool(biPool, {
			schema,
			// Analytics optimization
			logger: false,
			casing: 'snake_case',
		});
	}
	return biClient;
};

export const closeBiPool = async () => {
	if (biPool) {
		await biPool.end();
		biPool = null;
		biClient = null;
	}
};

// ========================================
// AUDIT & COMPLIANCE CLIENT
// ========================================

/**
 * Create an audit and compliance client for Brazilian regulatory requirements
 * Uses read replica to avoid impacting primary PIX transaction performance
 * Optimized for LGPD audit trails and compliance reporting
 */
export const createAuditComplianceClient = () => {
	const sql = neon(getReplicaDatabaseUrl());
	return drizzleNeon(sql, {
		schema,
		// Compliance-specific optimization
		logger: false,
		casing: 'snake_case',
	});
};

// Singleton audit client
let auditComplianceClient: ReturnType<typeof createAuditComplianceClient> | null = null;

export const getAuditComplianceClient = () => {
	if (!auditComplianceClient) {
		auditComplianceClient = createAuditComplianceClient();
	}
	return auditComplianceClient;
};

// ========================================
// CLIENT HEALTH MONITORING
// ========================================

/**
 * Health check for read replica clients
 * Ensures Brazilian compliance and analytics operations remain available
 */
export const checkReadReplicaHealth = async () => {
	const healthChecks = await Promise.allSettled([
		// Test LGPD analytics client
		getLgpdAnalyticsClient()
			.select()
			.from(schema.users)
			.limit(1),
		// Test business intelligence client
		getBusinessIntelligenceClient()
			.select()
			.from(schema.transactions)
			.limit(1),
		// Test audit compliance client
		getAuditComplianceClient()
			.select()
			.from(schema.auditLogs)
			.limit(1),
	]);

	const results = {
		lgpdAnalytics: healthChecks[0].status === 'fulfilled',
		businessIntelligence: healthChecks[1].status === 'fulfilled',
		auditCompliance: healthChecks[2].status === 'fulfilled',
		overall: healthChecks.every((check) => check.status === 'fulfilled'),
	};

	if (!results.overall) {
	}

	return results;
};

// ========================================
// BRAZILIAN COMPLIANCE QUERY HELPERS
// ========================================

/**
 * Get LGPD data subject requests for Brazilian compliance
 * Optimized for Brazilian timezone and business hours
 */
export const getLgpdDataSubjectRequests = async (
	userId: string,
	timeframe: '30d' | '90d' | '1y' = '30d',
) => {
	const client = getLgpdAnalyticsClient();
	const intervalMap = {
		'30d': '30 days',
		'90d': '90 days',
		'1y': '1 year',
	};

	return client.query.lgpdExportRequests.findMany({
		where: (lgpdExportRequests, { eq, and, gte }) =>
			and(
				eq(lgpdExportRequests.userId, userId),
				gte(
					lgpdExportRequests.createdAt,
					new Date(Date.now() - parseInterval(intervalMap[timeframe])),
				),
			),
		orderBy: (lgpdExportRequests, { desc }) => [desc(lgpdExportRequests.createdAt)],
	});
};

/**
 * Get Brazilian PIX transaction analytics
 * Optimized for Brazilian business hours and compliance reporting
 */
export const getBrazilianPixAnalytics = async (
	userId: string,
	period: 'today' | 'week' | 'month' = 'week',
) => {
	const client = getBusinessIntelligenceClient();
	const now = new Date();

	let startDate: Date;
	switch (period) {
		case 'today':
			startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			break;
		case 'week':
			startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case 'month':
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
			break;
	}

	return client.query.pixTransactions.findMany({
		where: (pixTransactions, { eq, and, gte }) =>
			and(eq(pixTransactions.userId, userId), gte(pixTransactions.transactionDate, startDate)),
		orderBy: (pixTransactions, { desc }) => [desc(pixTransactions.transactionDate)],
	});
};

// Helper function to parse interval strings
const parseInterval = (interval: string): number => {
	const match = interval.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
	if (!match) return 0;

	const value = Number.parseInt(match[1], 10);
	const unit = match[2].toLowerCase();

	const multipliers: Record<string, number> = {
		day: 1,
		days: 1,
		week: 7,
		weeks: 7,
		month: 30,
		months: 30,
		year: 365,
		years: 365,
	};

	return value * (multipliers[unit] || 0) * 24 * 60 * 60 * 1000;
};

// ========================================
// TYPE EXPORTS
// ========================================

export type LgpdAnalyticsClient = ReturnType<typeof createLgpdAnalyticsClient>;
export type BusinessIntelligenceClient = ReturnType<typeof createBusinessIntelligenceClient>;
export type AuditComplianceClient = ReturnType<typeof createAuditComplianceClient>;

// Export for use in compliance modules
export { schema };
