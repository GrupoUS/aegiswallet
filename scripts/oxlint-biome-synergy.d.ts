#!/usr/bin/env bun
/**
 * OXLint + Biome Synergy Script for AegisWallet
 * Optimized for 50-100x faster linting with healthcare compliance
 *
 * Features:
 * - Parallel execution of OXLint and Biome
 * - Healthcare compliance validation (LGPD)
 * - Brazilian market specific rules
 * - Performance benchmarking
 * - CI/CD integration ready
 */
interface PerformanceMetrics {
  oxlint: number;
  biome: number;
  total: number;
  improvement: number;
}
interface HealthCheckResult {
  oxlintConfig: boolean;
  biomeConfig: boolean;
  healthcareConfig: boolean;
  typeSupport: boolean;
}
/**
 * Perform health check on configuration files
 */
declare function healthCheck(): HealthCheckResult;
/**
 * Performance benchmark against Biome
 */
declare function performanceBenchmark(): PerformanceMetrics;
/**
 * Healthcare compliance validation
 */
declare function validateHealthcareCompliance(): boolean;
/**
 * Main execution function
 */
declare function main(): void;
export { main, healthCheck, performanceBenchmark, validateHealthcareCompliance };
