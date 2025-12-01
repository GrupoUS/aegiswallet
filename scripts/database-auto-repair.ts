/**
 * Database Auto-Repair - Automated Issue Resolution
 *
 * Automatically detects and fixes common database issues for Neon + Drizzle
 * Includes performance optimization, security fixes, and schema corrections
 *
 * Usage: bun scripts/database-auto-repair.ts
 */

import { writeFileSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';

import { neon, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

import { DatabaseHealthChecker, type HealthCheckResult } from './database-health-check';

interface RepairOperation {
	name: string;
	description: string;
	severity: 'critical' | 'high' | 'medium';
	autoFixable: boolean;
	execute: () => Promise<boolean>;
	rollback?: () => Promise<boolean>;
}

class DatabaseAutoRepair {
	private db: ReturnType<typeof drizzle>;
	private healthChecker: DatabaseHealthChecker;
	private repairLog: Array<{
		timestamp: Date;
		operation: string;
		status: 'success' | 'failed' | 'skipped';
		details: string;
	}> = [];

	constructor() {
		const databaseUrl = process.env.DATABASE_URL;
		if (!databaseUrl) {
			throw new Error('DATABASE_URL environment variable is not set');
		}

		neonConfig.fetchConnectionCache = true;
		const sqlClient = neon(databaseUrl);
		this.db = drizzle(sqlClient);
		this.healthChecker = new DatabaseHealthChecker();
	}

	async runAutoRepair(
		options: {
			dryRun?: boolean;
			fixPerformance?: boolean;
			fixSecurity?: boolean;
			fixSchema?: boolean;
			interactive?: boolean;
		} = {},
	): Promise<void> {
		console.log('🔧 Starting database auto-repair process...\n');

		const {
			dryRun = false,
			fixPerformance = true,
			fixSecurity = true,
			fixSchema = true,
			interactive = true,
		} = options;

		try {
			// Step 1: Run health check
			console.log('📊 Running comprehensive health check...');
			const healthResult = await this.healthChecker.runComprehensiveHealthCheck();

			console.log(`Health Status: ${healthResult.status} (${healthResult.score}/100)`);
			console.log(`Issues Found: ${healthResult.issues.length}\n`);

			if (healthResult.issues.length === 0) {
				console.log('✅ No issues detected - Database is healthy!');
				return;
			}

			// Step 2: Analyze and prepare repair operations
			const repairOperations = await this.prepareRepairOperations(healthResult, {
				fixPerformance,
				fixSecurity,
				fixSchema,
			});

			console.log(`🔧 Identified ${repairOperations.length} repairable issues\n`);

			// Step 3: Execute repairs
			for (const operation of repairOperations) {
				if (interactive && !dryRun) {
					const shouldProceed = await this.promptForRepair(operation);
					if (!shouldProceed) {
						this.logOperation(operation.name, 'skipped', 'User declined');
						continue;
					}
				}

				if (dryRun) {
					console.log(`🔍 [DRY RUN] Would execute: ${operation.name}`);
					console.log(`   ${operation.description}`);
					this.logOperation(operation.name, 'skipped', 'Dry run mode');
					continue;
				}

				try {
					console.log(`🔧 Executing: ${operation.name}`);
					const success = await operation.execute();

					if (success) {
						this.logOperation(operation.name, 'success', 'Operation completed successfully');
						console.log(`   ✅ Fixed: ${operation.description}`);
					} else {
						this.logOperation(operation.name, 'failed', 'Operation failed');
						console.log(`   ❌ Failed to fix: ${operation.description}`);
					}
				} catch (error) {
					this.logOperation(
						operation.name,
						'failed',
						`Error: ${error instanceof Error ? error.message : String(error)}`,
					);
					console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
				}

				console.log('');
			}

			// Step 4: Final verification
			if (!dryRun) {
				console.log('🔄 Running post-repair health check...');
				const postRepairHealth = await this.healthChecker.runComprehensiveHealthCheck();

				console.log(`\n📊 Pre-Repair Score: ${healthResult.score}/100`);
				console.log(`📊 Post-Repair Score: ${postRepairHealth.score}/100`);
				console.log(`📈 Improvement: ${postRepairHealth.score - healthResult.score} points`);

				if (postRepairHealth.score > healthResult.score) {
					console.log('✅ Auto-repair successful - Database health improved!');
				} else {
					console.log('⚠️  No significant improvement detected');
				}
			}

			// Step 5: Generate repair report
			this.generateRepairReport();
		} catch (error) {
			console.error('❌ Auto-repair process failed:', error);
			throw error;
		}
	}

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex logic required for repair operations
	private prepareRepairOperations(
		healthResult: HealthCheckResult,
		options: {
			fixPerformance: boolean;
			fixSecurity: boolean;
			fixSchema: boolean;
		},
	): Promise<RepairOperation[]> {
		const operations: RepairOperation[] = [];

		for (const issue of healthResult.issues) {
			switch (issue.category) {
				case 'schema':
					if (options.fixSchema) {
						const schemaOp = this.prepareSchemaRepair(issue);
						if (schemaOp) operations.push(schemaOp);
					}
					break;

				case 'performance':
					if (options.fixPerformance) {
						const perfOp = this.preparePerformanceRepair(issue);
						if (perfOp) operations.push(perfOp);
					}
					break;

				case 'security':
					if (options.fixSecurity) {
						const securityOp = this.prepareSecurityRepair(issue);
						if (securityOp) operations.push(securityOp);
					}
					break;

				case 'compliance':
					if (options.fixSecurity) {
						const complianceOp = this.prepareComplianceRepair(issue);
						if (complianceOp) operations.push(complianceOp);
					}
					break;
			}
		}

		return Promise.resolve(
			operations.sort((a, b) => {
				const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
				return severityOrder[a.severity] - severityOrder[b.severity];
			}),
		);
	}

	private prepareSchemaRepair(issue: any): RepairOperation | null {
		if (issue.description.includes('Schema mismatch')) {
			return {
				name: 'Sync Database Schema',
				description: 'Generate and apply Drizzle migrations to sync database with code',
				severity: issue.severity,
				autoFixable: true,
				execute: async () => {
					try {
						console.log('   🔄 Generating migrations...');
						const { exec } = await import('node:child_process');
						await new Promise((resolve, reject) => {
							exec('bun db:generate', (error, stdout, _stderr) => {
								if (error) reject(error);
								else resolve(stdout);
							});
						});

						console.log('   🔄 Applying migrations...');
						await new Promise((resolve, reject) => {
							exec('bun db:migrate', (error, stdout, _stderr) => {
								if (error) reject(error);
								else resolve(stdout);
							});
						});

						return true;
					} catch (error) {
						console.error('Schema sync failed:', error);
						return false;
					}
				},
			};
		}

		return null;
	}

	private preparePerformanceRepair(issue: any): RepairOperation | null {
		if (issue.description.includes('Index usage rate')) {
			return {
				name: 'Optimize Index Usage',
				description: 'Analyze and remove unused indexes to improve performance',
				severity: issue.severity,
				autoFixable: true,
				execute: async () => {
					try {
						// Find unused indexes
						const unusedIndexes = await this.db.execute(sql`
              SELECT schemaname, tablename, indexname
              FROM pg_stat_user_indexes
              WHERE idx_scan = 0
                AND indexrelid NOT IN (
                  SELECT indexrelid FROM pg_constraint WHERE contype IN ('p', 'u')
                )
            `);

						const unusedIndexesList = unusedIndexes.rows ?? [];
						console.log(`   🗑️  Found ${unusedIndexesList.length} unused indexes`);

						for (const index of unusedIndexesList) {
							const indexname = index.indexname as string;
							await this.db.execute(sql`
                DROP INDEX IF EXISTS ${sql.identifier(indexname)}
              `);
							console.log(`   🗑️  Dropped unused index: ${indexname}`);
						}

						return true;
					} catch (error) {
						console.error('Index optimization failed:', error);
						return false;
					}
				},
			};
		}

		if (issue.description.includes('slow queries')) {
			return {
				name: 'Create Performance Indexes',
				description: 'Add indexes for commonly queried columns',
				severity: issue.severity,
				autoFixable: true,
				execute: async () => {
					try {
						// Analyze query patterns and suggest indexes
						const commonQueries = [
							{
								table: 'users',
								columns: ['email', 'clerk_user_id'],
								name: 'idx_users_email_clerk',
							},
							{
								table: 'transactions',
								columns: ['user_id', 'transaction_date'],
								name: 'idx_transactions_user_date',
							},
							{
								table: 'pix_transactions',
								columns: ['user_id', 'created_at'],
								name: 'idx_pix_user_created',
							},
							{
								table: 'audit_logs',
								columns: ['user_id', 'created_at'],
								name: 'idx_audit_user_created',
							},
							{
								table: 'notifications',
								columns: ['user_id', 'is_read'],
								name: 'idx_notifications_user_read',
							},
						];

						for (const query of commonQueries) {
							try {
								await this.db.execute(sql`
                  CREATE INDEX IF NOT EXISTS ${sql.identifier(query.name)}
                  ON ${sql.identifier(query.table)} (${query.columns.map((col) => sql.identifier(col)).join(', ')})
                `);
								console.log(`   ✅ Created index: ${query.name}`);
							} catch {
								console.log(`   ⚠️  Index ${query.name} already exists or failed to create`);
							}
						}

						return true;
					} catch (error) {
						console.error('Index creation failed:', error);
						return false;
					}
				},
			};
		}

		return null;
	}

	private prepareSecurityRepair(issue: any): RepairOperation | null {
		if (issue.description.includes('SSL disabled')) {
			return {
				name: 'Enable SSL Connection',
				description: 'Update database connection to use SSL/TLS encryption',
				severity: issue.severity,
				autoFixable: false, // Requires environment variable update
				execute: () => {
					console.log(
						'   ⚠️  Manual action required: Update DATABASE_URL to include sslmode=require',
					);
					console.log('   📝 Current URL lacks SSL encryption - security risk');
					return Promise.resolve(false);
				},
			};
		}

		if (issue.description.includes('missing RLS policies')) {
			return {
				name: 'Generate RLS Policies',
				description: 'Create Row-Level Security policies for user data isolation',
				severity: issue.severity,
				autoFixable: true,
				execute: async () => {
					try {
						// Enable RLS on user tables
						const userTables = [
							'users',
							'transactions',
							'pix_transactions',
							'notifications',
							'audit_logs',
						];

						for (const table of userTables) {
							try {
								await this.db.execute(
									sql`ALTER TABLE ${sql.identifier(table)} ENABLE ROW LEVEL SECURITY`,
								);
								console.log(`   ✅ Enabled RLS on ${table}`);
							} catch {
								console.log(`   ⚠️  RLS already enabled or failed on ${table}`);
							}
						}

						// Create basic user isolation policies
						const policies = [
							{
								table: 'users',
								name: 'users_user_isolation',
								check: "id = current_setting('app.current_user_id')",
							},
							{
								table: 'transactions',
								name: 'transactions_user_isolation',
								check: "user_id = current_setting('app.current_user_id')",
							},
							{
								table: 'pix_transactions',
								name: 'pix_transactions_user_isolation',
								check: "user_id = current_setting('app.current_user_id')",
							},
						];

						for (const policy of policies) {
							try {
								await this.db.execute(sql`
                  CREATE POLICY ${sql.identifier(policy.name)} ON ${sql.identifier(policy.table)}
                  FOR ALL TO authenticated_user
                  USING (${sql.raw(policy.check)})
                `);
								console.log(`   ✅ Created policy: ${policy.name}`);
							} catch (_policyError) {
								console.log(`   ⚠️  Policy ${policy.name} already exists or failed to create`);
							}
						}

						return true;
					} catch (error) {
						console.error('RLS policy creation failed:', error);
						return false;
					}
				},
			};
		}

		return null;
	}

	private prepareComplianceRepair(issue: any): RepairOperation | null {
		if (issue.description.includes('Audit logs table missing')) {
			return {
				name: 'Create LGPD Audit Tables',
				description: 'Create required tables for Brazilian LGPD compliance',
				severity: issue.severity,
				autoFixable: true,
				execute: async () => {
					try {
						// Create audit_logs table if it doesn't exist
						await this.db.execute(sql`
              CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                resource_id TEXT,
                old_values JSONB,
                new_values JSONB,
                ip_address INET,
                user_agent TEXT,
                success BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              )
            `);
						console.log('   ✅ Created audit_logs table');

						// Create indexes for audit performance
						await this.db.execute(
							sql`CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_logs(user_id, created_at)`,
						);
						console.log('   ✅ Created audit_logs index');

						return true;
					} catch (error) {
						console.error('LGPD table creation failed:', error);
						return false;
					}
				},
			};
		}

		return null;
	}

	private async promptForRepair(operation: RepairOperation): Promise<boolean> {
		if (!operation.autoFixable) {
			console.log(`⚠️  ${operation.name} requires manual intervention`);
			console.log(`   ${operation.description}`);
			return false;
		}

		try {
			// Simple yes/no prompt
			process.stdout.write(`🔧 ${operation.name} (${operation.severity})? [y/N]: `);
			const answer = await new Promise<string>((resolve) => {
				process.stdin.once('data', (data) => {
					resolve(data.toString().trim().toLowerCase());
				});
			});

			return answer === 'y' || answer === 'yes';
		} catch {
			return false; // Default to no if prompting fails
		}
	}

	private logOperation(
		operation: string,
		status: 'success' | 'failed' | 'skipped',
		details: string,
	): void {
		this.repairLog.push({
			timestamp: new Date(),
			operation,
			status,
			details,
		});
	}

	private generateRepairReport(): void {
		const report = {
			timestamp: new Date().toISOString(),
			operations: this.repairLog,
			summary: {
				total: this.repairLog.length,
				successful: this.repairLog.filter((op) => op.status === 'success').length,
				failed: this.repairLog.filter((op) => op.status === 'failed').length,
				skipped: this.repairLog.filter((op) => op.status === 'skipped').length,
			},
		};

		const reportPath = pathResolve(process.cwd(), 'database-repair-report.json');
		writeFileSync(reportPath, JSON.stringify(report, null, 2));

		console.log(`\n📄 Repair report saved to: ${reportPath}`);
	}
}

async function main() {
	const autoRepair = new DatabaseAutoRepair();

	const args = process.argv.slice(2);
	const options = {
		dryRun: args.includes('--dry-run'),
		fixPerformance: !args.includes('--no-performance'),
		fixSecurity: !args.includes('--no-security'),
		fixSchema: !args.includes('--no-schema'),
		interactive: !args.includes('--auto'),
	};

	if (options.dryRun) {
		console.log('🔍 DRY RUN MODE - No changes will be made\n');
	}

	if (!options.interactive) {
		console.log('🤖 AUTO MODE - All applicable fixes will be applied\n');
	}

	try {
		await autoRepair.runAutoRepair(options);
		console.log('\n✅ Auto-repair process completed');
	} catch (error) {
		console.error('\n❌ Auto-repair process failed:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.main) {
	main().catch(console.error);
}

export { DatabaseAutoRepair };
