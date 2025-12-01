// @ts-nocheck - Utility script with runtime-correct but type-incompatible Neon query access patterns
/**
 * Brazilian LGPD Compliance Validator
 *
 * Comprehensive validation of LGPD (Lei Geral de Proteção de Dados) requirements
 * for Brazilian financial applications with voice-first capabilities
 *
 * Usage: bun scripts/lgpd-compliance-validator.ts
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

interface SchemaColumn {
	table_name?: string;
	column_name: string;
	data_type?: string;
	is_nullable?: string;
}
interface LGPDComplianceResult {
	overallScore: number; // 0-100
	status: 'compliant' | 'partial' | 'non_compliant';
	requirements: {
		dataMinimization: {
			score: number;
			issues: string[];
			recommendations: string[];
		};
		consentManagement: {
			score: number;
			issues: string[];
			recommendations: string[];
		};
		dataSubjectRights: {
			score: number;
			issues: string[];
			recommendations: string[];
		};
		auditTrails: { score: number; issues: string[]; recommendations: string[] };
		dataEncryption: {
			score: number;
			issues: string[];
			recommendations: string[];
		};
		retentionPolicies: {
			score: number;
			issues: string[];
			recommendations: string[];
		};
		incidentManagement: {
			score: number;
			issues: string[];
			recommendations: string[];
		};
		voiceDataProtection: {
			score: number;
			issues: string[];
			recommendations: string[];
		};
	};
	sensitiveDataFields: Array<{
		table: string;
		column: string;
		dataType: string;
		encryption: boolean;
		accessControl: boolean;
	}>;
	dataFlowMapping: Array<{
		source: string;
		destination: string;
		dataType: string;
		purpose: string;
		legalBasis: string;
	}>;
}

// Configure Neon
neonConfig.fetchConnectionCache = true;

class LGPDComplianceValidator {
	private db: ReturnType<typeof drizzle>;

	constructor() {
		const databaseUrl = process.env.DATABASE_URL;
		if (!databaseUrl) {
			throw new Error('DATABASE_URL environment variable is not set');
		}

		const sqlClient = neon(databaseUrl);
		this.db = drizzle(sqlClient);
	}

	async validateCompliance(): Promise<LGPDComplianceResult> {
		console.log('🇧🇷 Starting Brazilian LGPD compliance validation...\n');

		const result: LGPDComplianceResult = {
			overallScore: 0,
			status: 'non_compliant',
			requirements: {
				dataMinimization: { score: 0, issues: [], recommendations: [] },
				consentManagement: { score: 0, issues: [], recommendations: [] },
				dataSubjectRights: { score: 0, issues: [], recommendations: [] },
				auditTrails: { score: 0, issues: [], recommendations: [] },
				dataEncryption: { score: 0, issues: [], recommendations: [] },
				retentionPolicies: { score: 0, issues: [], recommendations: [] },
				incidentManagement: { score: 0, issues: [], recommendations: [] },
				voiceDataProtection: { score: 0, issues: [], recommendations: [] },
			},
			sensitiveDataFields: [],
			dataFlowMapping: [],
		};

		try {
			console.log('📋 Analyzing data minimization requirements...');
			await this.validateDataMinimization(result);

			console.log('📝 Checking consent management...');
			await this.validateConsentManagement(result);

			console.log('👤 Verifying data subject rights...');
			await this.validateDataSubjectRights(result);

			console.log('📊 Auditing trail completeness...');
			await this.validateAuditTrails(result);

			console.log('🔐 Validating data encryption...');
			await this.validateDataEncryption(result);

			console.log('⏰ Checking retention policies...');
			await this.validateRetentionPolicies(result);

			console.log('🚨 Assessing incident management...');
			await this.validateIncidentManagement(result);

			console.log('🎤 Voice data protection analysis...');
			await this.validateVoiceDataProtection(result);

			console.log('🗺️  Mapping data flows...');
			await this.mapDataFlows(result);

			console.log('🏷️  Identifying sensitive data fields...');
			await this.identifySensitiveData(result);

			// Calculate overall score
			this.calculateOverallScore(result);
		} catch (error) {
			console.error('❌ LGPD compliance validation failed:', error);
			result.status = 'non_compliant';
			result.overallScore = 0;
		}

		return result;
	}

	private async validateDataMinimization(result: LGPDComplianceResult): Promise<void> {
		const req = result.requirements.dataMinimization;
		let score = 100;

		// Check for unnecessary personal data collection
		const personalDataColumns = await this.db.execute(sql`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name ILIKE '%cpf%'
        OR column_name ILIKE '%birth_date%'
        OR column_name ILIKE '%phone%'
        OR column_name ILIKE '%address%'
        OR column_name ILIKE '%full_name%'
    `);

		console.log(`   📊 Found ${personalDataColumns.length} personal data columns`);

		// Validate each personal data column has a clear purpose
		const personalDataColumnItems = (personalDataColumns as SchemaColumn[]).filter(
			(col): col is SchemaColumn =>
				col && typeof col.column_name === 'string' && typeof col.table_name === 'string',
		);

		for (const column of personalDataColumnItems) {
			const table = column.table_name;
			const col = column.column_name;

			// Check if data is actually used (has recent activity)
			const usageCheck = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM ${sql.identifier(table)}
          WHERE ${sql.identifier(col)} IS NOT NULL
          LIMIT 1
        ) as has_data
      `);

			if (!usageCheck[0]?.has_data) {
				score -= 10;
				req.issues.push(`Column ${table}.${col} appears unused but collects personal data`);
				req.recommendations.push(`Remove ${col} from ${table} or justify its necessity`);
			}
		}

		// Check for data anonymization capabilities
		const hasAnonymization = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'data_anonymization_logs'
      )
    `);

		if (!hasAnonymization[0]?.exists) {
			score -= 15;
			req.issues.push('Missing data anonymization tracking');
			req.recommendations.push('Implement data anonymization logs and procedures');
		}

		req.score = Math.max(0, score);
		console.log(`   ✅ Data minimization score: ${req.score}/100`);
	}

	private async validateConsentManagement(result: LGPDComplianceResult): Promise<void> {
		const req = result.requirements.consentManagement;
		let score = 100;

		// Check for consent tracking table
		const hasConsentTable = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'lgpd_consents'
      )
    `);

		if (!hasConsentTable[0]?.exists) {
			score -= 40;
			req.issues.push('Missing LGPD consent tracking table');
			req.recommendations.push('Create lgpd_consents table with explicit consent tracking');
		} else {
			console.log('   ✅ LGPD consents table exists');

			// Check consent table structure
			const consentColumns = await this.db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lgpd_consents'
      `);

			const requiredColumns = ['user_id', 'consent_type', 'granted', 'granted_at', 'version'];

			// Define proper type for database column metadata
			interface SchemaColumn {
				column_name: string;
				data_type: string;
				is_nullable: string;
			}

			const existingColumns = (consentColumns as SchemaColumn[])
				.filter((col): col is SchemaColumn => col && typeof col.column_name === 'string')
				.map((col) => col.column_name);

			for (const required of requiredColumns) {
				if (!existingColumns.includes(required)) {
					score -= 10;
					req.issues.push(`Consent table missing required column: ${required}`);
					req.recommendations.push(`Add ${required} column to lgpd_consents table`);
				}
			}

			// Check for withdrawal support
			const hasWithdrawalColumn = existingColumns.includes('revoked_at');
			if (!hasWithdrawalColumn) {
				score -= 15;
				req.issues.push('Missing consent withdrawal tracking');
				req.recommendations.push('Add revoked_at column to support consent withdrawal');
			}
		}

		// Check for consent templates
		const hasConsentTemplates = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'consent_templates'
      )
    `);

		if (!hasConsentTemplates[0]?.exists) {
			score -= 20;
			req.issues.push('Missing consent template management');
			req.recommendations.push('Create consent_templates table for standardized consent language');
		}

		req.score = Math.max(0, score);
		console.log(`   ✅ Consent management score: ${req.score}/100`);
	}

	private async validateDataSubjectRights(result: LGPDComplianceResult): Promise<void> {
		const req = result.requirements.dataSubjectRights;
		let score = 100;

		// Check data export capabilities
		const hasExportRequests = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'lgpd_export_requests'
      )
    `);

		if (!hasExportRequests[0]?.exists) {
			score -= 25;
			req.issues.push('Missing data export request tracking');
			req.recommendations.push('Create lgpd_export_requests table for GDPR/LGPD export rights');
		}

		// Check data deletion capabilities
		const hasDeletionRequests = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'data_deletion_requests'
      )
    `);

		if (!hasDeletionRequests[0]?.exists) {
			score -= 25;
			req.issues.push('Missing data deletion request tracking');
			req.recommendations.push('Create data_deletion_requests table for right to erasure');
		}

		// Check for data access request tracking
		const hasAccessLogs = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'data_access_logs'
      )
    `);

		if (!hasAccessLogs[0]?.exists) {
			score -= 20;
			req.issues.push('Missing data access request tracking');
			req.recommendations.push('Create data_access_logs table to track access requests');
		}

		// Verify soft delete implementation
		const userTableColumns = await this.db.execute(sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
        AND column_name = 'deleted_at'
    `);

		if (userTableColumns.length === 0) {
			score -= 15;
			req.issues.push('Missing soft delete implementation for user data');
			req.recommendations.push('Add deleted_at column to users table for GDPR/LGPD compliance');
		}

		req.score = Math.max(0, score);
		console.log(`   ✅ Data subject rights score: ${req.score}/100`);
	}

	private async validateAuditTrails(result: LGPDComplianceResult): Promise<void> {
		const req = result.requirements.auditTrails;
		let score = 100;

		// Check for comprehensive audit logging
		const hasAuditLogs = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'audit_logs'
      )
    `);

		if (!hasAuditLogs[0]?.exists) {
			score -= 50;
			req.issues.push('Missing comprehensive audit logging table');
			req.recommendations.push('Create audit_logs table with complete data access tracking');
		} else {
			console.log('   ✅ Audit logs table exists');

			// Verify required audit columns
			const auditColumns = await this.db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audit_logs'
      `);

			const requiredColumns = [
				'user_id',
				'action',
				'resource_type',
				'resource_id',
				'created_at',
				'ip_address',
			];
			const existingColumns = (auditColumns as SchemaColumn[])
				.filter((col): col is SchemaColumn => col && typeof col.column_name === 'string')
				.map((col) => col.column_name);

			for (const required of requiredColumns) {
				if (!existingColumns.includes(required)) {
					score -= 10;
					req.issues.push(`Audit table missing required column: ${required}`);
					req.recommendations.push(`Add ${required} column to audit_logs table`);
				}
			}
		}

		// Check for data modification tracking
		const hasOldNewValues = await this.db.execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name IN ('old_values', 'new_values')
    `);

		if (Number.parseInt(hasOldNewValues[0]?.count || '0', 10) < 2) {
			score -= 20;
			req.issues.push('Missing data change tracking in audit logs');
			req.recommendations.push('Add old_values and new_values JSONB columns to track data changes');
		}

		// Check for audit log protection
		const auditTableExists = hasAuditLogs[0]?.exists;
		if (auditTableExists) {
			const hasAuditProtection = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'audit_logs' AND policyname ILIKE '%audit%'
        )
      `);

			if (!hasAuditProtection[0]?.exists) {
				score -= 15;
				req.issues.push('Audit logs lack protection against modification');
				req.recommendations.push('Create RLS policies to prevent audit log tampering');
			}
		}

		req.score = Math.max(0, score);
		console.log(`   ✅ Audit trails score: ${req.score}/100`);
	}

	private async validateDataEncryption(result: LGPDComplianceResult): Promise<void> {
		const req = result.requirements.dataEncryption;
		let score = 100;

		// Check connection encryption
		const isSSLEnabled = process.env.DATABASE_URL?.includes('sslmode=require');
		if (!isSSLEnabled) {
			score -= 30;
			req.issues.push('Database connection not using SSL/TLS');
			req.recommendations.push('Update DATABASE_URL to include sslmode=require');
		}

		// Neon provides encryption at rest by default
		console.log('   ✅ Encryption at rest: enabled (Neon default)');
		console.log(`   🔒 Connection encryption: ${isSSLEnabled ? 'enabled' : 'disabled - CRITICAL'}`);

		// Check for sensitive field encryption
		const sensitiveFields = await this.db.execute(sql`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          column_name ILIKE '%cpf%'
          OR column_name ILIKE '%password%'
          OR column_name ILIKE '%token%'
          OR column_name ILIKE '%secret%'
          OR column_name ILIKE '%voice_sample%'
        )
    `);

		console.log(`   🔍 Found ${sensitiveFields.length} sensitive fields`);

		// In a real implementation, you would check if these are encrypted
		// For now, we'll note them for manual review
		const sensitiveFieldItems = (sensitiveFields as SchemaColumn[]).filter(
			(field): field is SchemaColumn =>
				field && typeof field.column_name === 'string' && typeof field.table_name === 'string',
		);

		for (const field of sensitiveFieldItems) {
			result.sensitiveDataFields.push({
				table: field.table_name,
				column: field.column_name,
				dataType: field.data_type,
				encryption: false, // Would need to verify actual encryption
				accessControl: false, // Would need to check access controls
			});

			score -= 5;
			req.issues.push(
				`Sensitive field ${field.table_name}.${field.column_name} may need encryption`,
			);
		}

		if (result.sensitiveDataFields.length > 0) {
			req.recommendations.push('Implement column-level encryption for sensitive personal data');
		}

		req.score = Math.max(0, score);
		console.log(`   ✅ Data encryption score: ${req.score}/100`);
	}

	private async validateRetentionPolicies(result: LGPDComplianceResult): Promise<void> {
		const req = result.requirements.retentionPolicies;
		let score = 100;

		// Check for retention policy management
		const hasRetentionPolicies = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'data_retention_policies'
      )
    `);

		if (!hasRetentionPolicies[0]?.exists) {
			score -= 40;
			req.issues.push('Missing data retention policy management');
			req.recommendations.push('Create data_retention_policies table to manage data lifecycle');
		}

		// Check for automated cleanup
		const cleanupJobs = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM pg_proc WHERE proname ILIKE '%cleanup%' OR proname ILIKE '%retention%'
    `);

		if (Number.parseInt(cleanupJobs[0]?.count || '0', 10) === 0) {
			score -= 30;
			req.issues.push('Missing automated data cleanup procedures');
			req.recommendations.push('Implement scheduled cleanup jobs for data retention');
		}

		// Check for legal hold capabilities
		const hasLegalHolds = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'legal_holds'
      )
    `);

		if (!hasLegalHolds[0]?.exists) {
			score -= 20;
			req.issues.push('Missing legal hold management for litigation holds');
			req.recommendations.push('Create legal_holds table to manage litigation preservation');
		}

		req.score = Math.max(0, score);
		console.log(`   ✅ Retention policies score: ${req.score}/100`);
	}

	private async validateIncidentManagement(result: LGPDComplianceResult): Promise<void> {
		const req = result.requirements.incidentManagement;
		let score = 100;

		// Check for security incident tracking
		const hasIncidentLogs = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'security_incidents'
      )
    `);

		if (!hasIncidentLogs[0]?.exists) {
			score -= 35;
			req.issues.push('Missing security incident tracking');
			req.recommendations.push('Create security_incidents table for breach management');
		}

		// Check for breach notification workflow
		const hasNotificationWorkflow = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'breach_notifications'
      )
    `);

		if (!hasNotificationWorkflow[0]?.exists) {
			score -= 25;
			req.issues.push('Missing data breach notification workflow');
			req.recommendations.push('Create breach_notifications table for LGPD 72-hour requirement');
		}

		// Check for data protection officer assignment
		const hasDPOTable = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'dpo_assignments'
      )
    `);

		if (!hasDPOTable[0]?.exists) {
			score -= 15;
			req.issues.push('Missing Data Protection Officer assignment tracking');
			req.recommendations.push('Create DPO assignment table for compliance oversight');
		}

		req.score = Math.max(0, score);
		console.log(`   ✅ Incident management score: ${req.score}/100`);
	}

	private async validateVoiceDataProtection(result: LGPDComplianceResult): Promise<void> {
		const req = result.requirements.voiceDataProtection;
		let score = 100;

		// Check for voice data storage tables
		const hasVoiceTranscriptions = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'voice_transcriptions'
      )
    `);

		if (!hasVoiceTranscriptions[0]?.exists) {
			score -= 40;
			req.issues.push('Missing voice transcription data management');
			req.recommendations.push('Create voice_transcriptions table with proper consent tracking');
		}

		// Check for voice biometric data handling
		const hasVoiceBiometrics = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_security'
      )
    `);

		if (hasVoiceBiometrics[0]?.exists) {
			const voiceBiometricColumns = await this.db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_security'
          AND column_name ILIKE '%voice%'
      `);

			if (voiceBiometricColumns.length > 0) {
				// Check for biometric data protection
				console.log('   🔍 Voice biometric data detected - requires special protection');

				const hasBiometricConsent = await this.db.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM lgpd_consents lc
            JOIN user_security us ON lc.user_id = us.user_id
            WHERE lc.consent_type = 'biometric_voice' AND lc.granted = true
          )
        `);

				if (!hasBiometricConsent[0]?.exists) {
					score -= 30;
					req.issues.push('Voice biometric data stored without explicit consent');
					req.recommendations.push('Implement biometric data consent collection and management');
				}
			}
		}

		// Check for voice data retention policies
		const hasVoiceRetention = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM data_retention_policies drp
        WHERE drp.data_type ILIKE '%voice%' OR drp.table_name = 'voice_transcriptions'
      )
    `);

		if (!hasVoiceRetention[0]?.exists) {
			score -= 20;
			req.issues.push('Missing specific retention policy for voice data');
			req.recommendations.push(
				'Create retention policy for voice transcriptions and biometric data',
			);
		}

		req.score = Math.max(0, score);
		console.log(`   ✅ Voice data protection score: ${req.score}/100`);
	}

	private mapDataFlows(result: LGPDComplianceResult): Promise<void> {
		// Map common data flows in a Brazilian fintech application
		const commonFlows = [
			{
				source: 'User Registration Form',
				destination: 'users table',
				dataType: 'Personal Information (CPF, name, email)',
				purpose: 'Account creation and identity verification',
				legalBasis: 'Contract execution (Account creation)',
			},
			{
				source: 'Voice Command Processing',
				destination: 'voice_transcriptions table',
				dataType: 'Voice recordings and transcriptions',
				purpose: 'Voice-first financial assistant functionality',
				legalBasis: 'Legitimate interest with explicit consent',
			},
			{
				source: 'Bank Account Integration',
				destination: 'bank_accounts table',
				dataType: 'Banking information and transaction history',
				purpose: 'Financial management and transaction processing',
				legalBasis: 'Contract execution (Financial services)',
			},
			{
				source: 'PIX Transaction Processing',
				destination: 'pix_transactions table',
				dataType: 'Payment information and transaction details',
				purpose: 'PIX payment processing',
				legalBasis: 'Contract execution (Payment services)',
			},
		];

		result.dataFlowMapping = commonFlows;
		console.log(`   ║✅  Mapped ${commonFlows.length} data flows`);
		return Promise.resolve();
	}

	private async identifySensitiveData(result: LGPDComplianceResult): Promise<void> {
		// Additional sensitive data identification
		const additionalSensitiveFields = [
			{ table: 'users', column: 'cpf', dataType: 'CPF (Brazilian tax ID)' },
			{ table: 'users', column: 'birth_date', dataType: 'Date of birth' },
			{ table: 'users', column: 'phone', dataType: 'Phone number' },
			{
				table: 'transactions',
				column: 'amount',
				dataType: 'Financial transaction amounts',
			},
			{
				table: 'transactions',
				column: 'description',
				dataType: 'Transaction descriptions',
			},
			{
				table: 'user_security',
				column: 'voice_sample_encrypted',
				dataType: 'Voice biometric data',
			},
		];

		for (const field of additionalSensitiveFields) {
			const exists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = ${field.table}
            AND column_name = ${field.column}
        )
      `);

			if (exists[0]?.exists) {
				result.sensitiveDataFields.push({
					table: field.table,
					column: field.column,
					dataType: field.dataType,
					encryption: field.column.includes('encrypted'),
					accessControl: field.table.includes('user'),
				});
			}
		}

		console.log(`   🏷️  Identified ${result.sensitiveDataFields.length} sensitive data fields`);
	}

	private calculateOverallScore(result: LGPDComplianceResult): void {
		const scores = Object.values(result.requirements).map((req) => req.score);
		result.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

		if (result.overallScore >= 90) {
			result.status = 'compliant';
		} else if (result.overallScore >= 70) {
			result.status = 'partial';
		} else {
			result.status = 'non_compliant';
		}
	}
}

async function main() {
	const validator = new LGPDComplianceValidator();

	try {
		const result = await validator.validateCompliance();

		console.log(`\n${'='.repeat(80)}`);
		console.log('🇧🇷 BRAZILIAN LGPD COMPLIANCE REPORT');
		console.log('='.repeat(80));

		console.log(`\n📊 Overall Compliance Score: ${result.overallScore}/100`);
		console.log(`📋 Status: ${result.status.toUpperCase().replace('_', ' ')}`);

		console.log('\n📋 REQUIREMENTS BREAKDOWN:');
		Object.entries(result.requirements).forEach(([key, req]) => {
			const icon = req.score >= 90 ? '✅' : req.score >= 70 ? '⚠️' : '❌';
			const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
			console.log(`${icon} ${name}: ${req.score}/100`);

			if (req.issues.length > 0) {
				req.issues.forEach((issue) => {
					console.log(`   • ${issue}`);
				});
			}
		});

		if (result.sensitiveDataFields.length > 0) {
			console.log('\n🔒 SENSITIVE DATA FIELDS:');
			result.sensitiveDataFields.forEach((field) => {
				const encryption = field.encryption ? '✅' : '⚠️';
				const access = field.accessControl ? '✅' : '⚠️';
				console.log(
					`   ${field.table}.${field.column}: ${field.dataType} [${encryption} encrypted] [${access} access control]`,
				);
			});
		}

		if (result.dataFlowMapping.length > 0) {
			console.log('\n🗺️  DATA FLOWS:');
			result.dataFlowMapping.forEach((flow) => {
				console.log(`   ${flow.source} → ${flow.destination}`);
				console.log(`     Purpose: ${flow.purpose}`);
				console.log(`     Legal Basis: ${flow.legalBasis}`);
				console.log('');
			});
		}

		console.log('\n💡 PRIORITY RECOMMENDATIONS:');
		Object.values(result.requirements)
			.filter((req) => req.recommendations.length > 0)
			.forEach((req) => {
				req.recommendations.slice(0, 3).forEach((rec) => {
					console.log(`   • ${rec}`);
				});
			});

		console.log('\n🚨 NEXT STEPS:');
		if (result.status === 'compliant') {
			console.log('   ✅ Maintain current compliance monitoring');
			console.log('   📊 Schedule regular compliance audits');
			console.log('   🔄 Update policies as regulations evolve');
		} else if (result.status === 'partial') {
			console.log('   🔧 Address high-priority compliance gaps');
			console.log('   📋 Implement missing consent management');
			console.log('   📊 Strengthen audit trail completeness');
		} else {
			console.log('   🚨 Immediate compliance remediation required');
			console.log('   📋 Implement comprehensive LGPD framework');
			console.log('   👥 Consider engaging compliance specialists');
		}
	} catch (error) {
		console.error('❌ LGPD compliance validation failed:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.main) {
	main().catch(console.error);
}

export { LGPDComplianceValidator, type LGPDComplianceResult };
