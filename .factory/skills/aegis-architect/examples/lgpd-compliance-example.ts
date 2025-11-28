/**
 * LGPD Compliance Implementation Example for AegisWallet
 *
 * Complete implementation of Brazilian General Data Protection Law (Lei Geral de Proteção de Dados)
 * compliance patterns for financial applications.
 *
 * Features:
 * - Explicit user consent management
 * - Data minimization and purpose limitation
 * - Right to access, rectification, deletion, and portability
 * - Data retention policies
 * - Audit trails for compliance
 * - Data masking and anonymization
 * - Brazilian Portuguese interface
 * - Automated compliance reporting
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';

import { supabase } from '@/integrations/supabase/client';

// LGPD consent purposes (Article 7)
export const ConsentPurposes = z.enum([
	'ACCOUNT_MANAGEMENT', // Gestão de conta
	'FINANCIAL_TRANSACTIONS', // Transações financeiras
	'FRAUD_PREVENTION', // Prevenção de fraude
	'PERSONALIZATION', // Personalização de serviços
	'MARKETING', // Comunicação marketing
	'ANALYTICS', // Análise e melhorias
	'LEGAL_COMPLIANCE', // Cumprimento de obrigações legais
	'CREDIT_ANALYSIS', // Análise de crédito
]);

// Data retention periods according to LGPD and Brazilian regulations
const LGPD_RETENTION_PERIODS = {
	FINANCIAL_TRANSACTIONS: 5 * 365, // 5 years (Central Bank requirement)
	FRAUD_PREVENTION: 7 * 365, // 7 years (anti-fraud requirement)
	LEGAL_COMPLIANCE: 10 * 365, // 10 years (legal requirement)
	ANALYTICS: 2 * 365, // 2 years (business purpose)
	MARKETING: 1 * 365, // 1 year (if consent withdrawn)
	ACCOUNT_MANAGEMENT: 10 * 365, // 10 years (account lifecycle)
	DEFAULT: 5 * 365, // 5 years default
};

// Sensitive personal data categories (Article 11)
export const SensitiveDataCategories = z.enum([
	'HEALTH_DATA',
	'BIOMETRIC_DATA',
	'FINANCIAL_DATA',
	'POLITICAL_OPINION',
	'RELIGIOUS_BELIEF',
	'ETHNIC_ORIGIN',
	'GENETIC_DATA',
	'UNION_MEMBERSHIP',
]);

// Consent management schema
const ConsentSchema = z.object({
	purpose: ConsentPurposes,
	granted: z.boolean(),
	timestamp: z.string().datetime(),
	ipAddress: z.string().optional(),
	userAgent: z.string().optional(),
	version: z.string().default('1.0'),
	expiresAt: z.string().datetime().optional(),
});

// Data subject request schema (LGPD Articles 18-22)
const DataSubjectRequestSchema = z.object({
	type: z.enum([
		'ACCESS_REQUEST', // Direito de acesso (Art. 18)
		'RECTIFICATION_REQUEST', // Direito de correção (Art. 18)
		'DELETION_REQUEST', // Direito de eliminação (Art. 18)
		'PORTABILITY_REQUEST', // Direito de portabilidade (Art. 18)
		'INFORMATION_REQUEST', // Direito de informação (Art. 18)
		'CONSENT_REVOCATION', // Revogação de consentimento (Art. 18)
		'OBJECTION_REQUEST', // Direito de oposição (Art. 18)
	]),
	description: z.string().optional(),
	documents: z.array(z.string().url()).optional(),
	contactEmail: z.string().email(),
});

// Data processing record schema (Article 37)
const ProcessingRecordSchema = z.object({
	dataController: z.string(),
	dataControllerContact: z.string(),
	sharedWith: z.array(z.string()).optional(),
	internationalTransfer: z.boolean().optional(),
	securityMeasures: z.array(z.string()),
	retentionPeriod: z.number(),
	purpose: ConsentPurposes,
	legalBasis: z.enum([
		'CONSENT',
		'LEGAL_OBLIGATION',
		'CONTRACT',
		'VITAL_INTEREST',
		'PUBLIC_INTEREST',
		'LEGITIMATE_INTEREST',
	]),
});

// LGPD compliance middleware
const lgpdComplianceMiddleware = createMiddleware(async (c, next) => {
	const authHeader = c.req.header('Authorization');
	if (!authHeader) {
		return c.json(
			{
				error: 'Autenticação necessária para processamento de dados',
				code: 'AUTH_REQUIRED',
				lgpdReference: 'Artigo 7 - Base legal para processamento',
			},
			401,
		);
	}

	const token = authHeader.replace('Bearer ', '');
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(token);

	if (error || !user) {
		return c.json(
			{
				error: 'Usuário não autenticado',
				code: 'INVALID_AUTH',
			},
			401,
		);
	}

	// Check if user has valid consent for current processing
	const consentCheck = await checkUserConsent(
		user.id,
		c.req.path,
		c.req.method,
	);

	if (!consentCheck.valid) {
		return c.json(
			{
				error: 'Consentimento não fornecido ou revogado',
				code: 'CONSENT_REQUIRED',
				lgpdReference: 'Artigo 8 - Consentimento do titular',
				details: {
					missingPurposes: consentCheck.missingPurposes,
					requiredAction: 'Obter consentimento explícito do usuário',
				},
			},
			403,
		);
	}

	// Log data access for compliance (LGPD Article 8)
	await logDataAccess({
		userId: user.id,
		endpoint: c.req.path,
		method: c.req.method,
		purpose: detectProcessingPurpose(c.req.path, c.req.method),
		ipAddress: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
		userAgent: c.req.header('User-Agent'),
		timestamp: new Date().toISOString(),
	});

	c.set('user', user);
	await next();
});

// Check user consent for specific processing
async function checkUserConsent(
	userId: string,
	path: string,
	method: string,
): Promise<{ valid: boolean; missingPurposes: string[] }> {
	const requiredPurposes = getRequiredPurposes(path, method);

	if (requiredPurposes.length === 0) {
		return { valid: true, missingPurposes: [] };
	}

	const { data: consents, error } = await supabase
		.from('lgpd_consents')
		.select('purpose, granted, expires_at')
		.eq('user_id', userId)
		.eq('granted', true)
		.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

	if (error || !consents) {
		return { valid: false, missingPurposes: requiredPurposes };
	}

	const grantedPurposes = consents.map((c) => c.purpose);
	const missingPurposes = requiredPurposes.filter(
		(p) => !grantedPurposes.includes(p),
	);

	return {
		valid: missingPurposes.length === 0,
		missingPurposes,
	};
}

// Get required consent purposes for endpoint
function getRequiredPurposes(path: string, method: string): string[] {
	const purposeMap: Record<string, string[]> = {
		'/api/v1/transactions': ['FINANCIAL_TRANSACTIONS', 'FRAUD_PREVENTION'],
		'/api/v1/pix': ['FINANCIAL_TRANSACTIONS', 'FRAUD_PREVENTION'],
		'/api/v1/user/profile': ['ACCOUNT_MANAGEMENT'],
		'/api/v1/analytics': ['ANALYTICS'],
		'/api/v1/marketing': ['MARKETING'],
		'/api/v1/credit': ['CREDIT_ANALYSIS', 'FINANCIAL_TRANSACTIONS'],
	};

	// Find matching path
	const matchedPath = Object.keys(purposeMap).find((p) => path.startsWith(p));
	return matchedPath ? purposeMap[matchedPath] : [];
}

// Detect processing purpose for logging
function detectProcessingPurpose(path: string, method: string): string {
	if (path.includes('/transactions') || path.includes('/pix')) {
		return 'FINANCIAL_TRANSACTIONS';
	} else if (path.includes('/profile') || path.includes('/account')) {
		return 'ACCOUNT_MANAGEMENT';
	} else if (path.includes('/analytics') || path.includes('/reports')) {
		return 'ANALYTICS';
	} else if (path.includes('/marketing') || path.includes('/campaigns')) {
		return 'MARKETING';
	} else {
		return 'ACCOUNT_MANAGEMENT'; // Default
	}
}

// Log data access for LGPD compliance
async function logDataAccess(data: {
	userId: string;
	endpoint: string;
	method: string;
	purpose: string;
	ipAddress?: string;
	userAgent?: string;
	timestamp: string;
}) {
	try {
		await supabase.from('lgpd_data_access_log').insert({
			user_id: data.userId,
			endpoint: data.endpoint,
			method: data.method,
			purpose: data.purpose,
			ip_address: data.ipAddress,
			user_agent: data.userAgent,
			timestamp: data.timestamp,
		});
	} catch (error) {
		console.error('Failed to log data access:', error);
		// Don't fail the request if logging fails
	}
}

// LGPD router
export const lgpdRouter = new Hono<{ Variables: { user: any } }>();

// POST /api/v1/lgpd/consent - Record user consent
lgpdRouter.post(
	'/consent',
	zValidator(
		'json',
		z.object({
			purposes: z.array(ConsentPurposes),
			granted: z.boolean(),
			ipAddress: z.string().optional(),
			userAgent: z.string().optional(),
		}),
	),
	async (c) => {
		const { user } = c.get('user');
		const { purposes, granted, ipAddress, userAgent } = c.req.valid('json');

		try {
			// Record or update consent for each purpose
			const consentRecords = purposes.map((purpose) => ({
				user_id: user.id,
				purpose,
				granted,
				timestamp: new Date().toISOString(),
				ip_address: ipAddress || c.req.header('X-Forwarded-For'),
				user_agent: userAgent || c.req.header('User-Agent'),
				version: '1.0',
			}));

			const { error } = await supabase
				.from('lgpd_consents')
				.upsert(consentRecords, {
					onConflict: 'user_id,purpose',
				});

			if (error) throw error;

			// Log consent change
			await supabase.from('lgpd_consent_log').insert({
				user_id: user.id,
				action: granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
				purposes,
				timestamp: new Date().toISOString(),
				ip_address: ipAddress || c.req.header('X-Forwarded-For'),
			});

			return c.json({
				data: {
					purposes,
					granted,
					timestamp: new Date().toISOString(),
					message: granted
						? 'Consentimento registrado com sucesso'
						: 'Consentimento revogado com sucesso',
				},
				lgpdReference: 'Artigo 8 - Consentimento do titular de dados',
			});
		} catch (error) {
			console.error('Consent recording error:', error);
			return c.json(
				{
					error: 'Erro ao registrar consentimento',
					code: 'CONSENT_RECORD_ERROR',
				},
				500,
			);
		}
	},
);

// GET /api/v1/lgpd/consent - Get user consents
lgpdRouter.get('/consent', async (c) => {
	const { user } = c.get('user');

	try {
		const { data: consents, error } = await supabase
			.from('lgpd_consents')
			.select('purpose, granted, timestamp, expires_at')
			.eq('user_id', user.id)
			.order('timestamp', { ascending: false });

		if (error) throw error;

		// Group by purpose and show latest status
		const latestConsents =
			consents?.reduce(
				(acc, consent) => {
					if (
						!acc[consent.purpose] ||
						new Date(consent.timestamp) >
							new Date(acc[consent.purpose].timestamp)
					) {
						acc[consent.purpose] = consent;
					}
					return acc;
				},
				{} as Record<string, any>,
			) || {};

		return c.json({
			data: Object.values(latestConsents),
			meta: {
				count: Object.keys(latestConsents).length,
				lastUpdated: consents?.length > 0 ? consents[0].timestamp : null,
			},
		});
	} catch (error) {
		console.error('Consent retrieval error:', error);
		return c.json(
			{
				error: 'Erro ao buscar consentimentos',
				code: 'CONSENT_RETRIEVAL_ERROR',
			},
			500,
		);
	}
});

// POST /api/v1/lgpd/data-subject-request - Handle data subject requests
lgpdRouter.post(
	'/data-subject-request',
	zValidator('json', DataSubjectRequestSchema),
	async (c) => {
		const { user } = c.get('user');
		const requestData = c.req.valid('json');

		try {
			// Create request ticket
			const { data: request, error: requestError } = await supabase
				.from('lgpd_data_subject_requests')
				.insert({
					user_id: user.id,
					type: requestData.type,
					description: requestData.description,
					documents: requestData.documents,
					contact_email: requestData.contactEmail,
					status: 'PENDING',
					created_at: new Date().toISOString(),
					ip_address: c.req.header('X-Forwarded-For'),
				})
				.select()
				.single();

			if (requestError || !request) {
				throw new Error(`Failed to create request: ${requestError?.message}`);
			}

			// Process request based on type
			let processingResult = null;
			switch (requestData.type) {
				case 'ACCESS_REQUEST':
					processingResult = await handleAccessRequest(user.id);
					break;
				case 'DELETION_REQUEST':
					processingResult = await handleDeletionRequest(user.id, request.id);
					break;
				case 'PORTABILITY_REQUEST':
					processingResult = await handlePortabilityRequest(user.id);
					break;
				case 'CONSENT_REVOCATION':
					processingResult = await handleConsentRevocation(user.id);
					break;
				default:
					processingResult = { status: 'MANUAL_REVIEW_REQUIRED' };
			}

			// Update request with processing result
			await supabase
				.from('lgpd_data_subject_requests')
				.update({
					status: processingResult.status,
					processed_at: new Date().toISOString(),
					processing_details: processingResult,
				})
				.eq('id', request.id);

			return c.json({
				data: {
					requestId: request.id,
					type: requestData.type,
					status: processingResult.status,
					message: getRequestStatusMessage(
						requestData.type,
						processingResult.status,
					),
					estimatedCompletion: getEstimatedCompletion(requestData.type),
					supportContact: {
						email: 'lgpd@aegiswallet.com.br',
						phone: '0800-XXX-XXXX',
						department: 'Encarregado de Proteção de Dados (DPO)',
					},
				},
				lgpdReference: getLGPDReference(requestData.type),
			});
		} catch (error) {
			console.error('Data subject request error:', error);
			return c.json(
				{
					error: 'Erro ao processar solicitação',
					code: 'DATA_SUBJECT_REQUEST_ERROR',
				},
				500,
			);
		}
	},
);

// Handle access request (Article 18)
async function handleAccessRequest(userId: string) {
	try {
		// Collect all user data
		const userData = await collectUserData(userId);

		// Mask sensitive financial data for security
		const maskedData = maskSensitiveData(userData);

		// Store access report for compliance
		await supabase.from('lgpd_access_reports').insert({
			user_id: userId,
			data_summary: Object.keys(userData),
			generated_at: new Date().toISOString(),
			report_url: `/api/v1/lgpd/access-report/${userId}`,
		});

		return {
			status: 'COMPLETED',
			dataCategories: Object.keys(userData),
			reportGenerated: true,
		};
	} catch (error) {
		return {
			status: 'ERROR',
			error: error.message,
		};
	}
}

// Handle deletion request (Article 18)
async function handleDeletionRequest(userId: string, requestId: string) {
	try {
		// Check for legal holds or regulatory requirements
		const legalHolds = await checkLegalHolds(userId);

		if (legalHolds.length > 0) {
			return {
				status: 'REQUIRES_LEGAL_REVIEW',
				legalHolds,
				message: 'Dados não podem ser excluídos devido a obrigações legais',
			};
		}

		// Anonymize data instead of deleting (better for audit trail)
		await anonymizeUserData(userId);

		// Mark user as deleted
		await supabase
			.from('users')
			.update({
				deleted_at: new Date().toISOString(),
				deletion_request_id: requestId,
			})
			.eq('id', userId);

		// Revoke all consents
		await supabase
			.from('lgpd_consents')
			.update({
				granted: false,
				revoked_at: new Date().toISOString(),
			})
			.eq('user_id', userId);

		return {
			status: 'COMPLETED',
			action: 'ANONYMIZED',
			message: 'Dados anonimizados conforme Artigo 16 da LGPD',
		};
	} catch (error) {
		return {
			status: 'ERROR',
			error: error.message,
		};
	}
}

// Handle portability request (Article 18)
async function handlePortabilityRequest(userId: string) {
	try {
		// Collect portable user data
		const portableData = await collectPortableUserData(userId);

		// Generate JSON file with user data
		const dataPackage = {
			user: portableData.profile,
			transactions: portableData.transactions.map(maskFinancialData),
			preferences: portableData.preferences,
			consents: portableData.consents,
			generated_at: new Date().toISOString(),
			version: '1.0',
		};

		// Store portability package
		await supabase.from('lgpd_portability_packages').insert({
			user_id: userId,
			package_data: dataPackage,
			expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
			generated_at: new Date().toISOString(),
		});

		return {
			status: 'COMPLETED',
			downloadUrl: `/api/v1/lgpd/portability-download/${userId}`,
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
		};
	} catch (error) {
		return {
			status: 'ERROR',
			error: error.message,
		};
	}
}

// Handle consent revocation (Article 18)
async function handleConsentRevocation(userId: string) {
	try {
		// Revoke all non-essential consents
		const essentialPurposes = ['LEGAL_COMPLIANCE', 'FRAUD_PREVENTION'];

		await supabase
			.from('lgpd_consents')
			.update({
				granted: false,
				revoked_at: new Date().toISOString(),
			})
			.eq('user_id', userId)
			.not(
				'purpose',
				'in',
				`(${essentialPurposes.map((p) => `'${p}'`).join(',')})`,
			);

		// Schedule data deletion for revoked purposes
		await scheduleDataCleanup(userId, essentialPurposes);

		return {
			status: 'COMPLETED',
			revokedPurposes: await getRevokedPurposes(userId),
			message: 'Consentimentos revogados com sucesso',
		};
	} catch (error) {
		return {
			status: 'ERROR',
			error: error.message,
		};
	}
}

// Helper function to collect user data
async function collectUserData(userId: string) {
	const [profile, transactions, consents, preferences] = await Promise.all([
		supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
		supabase.from('transactions').select('*').eq('user_id', userId),
		supabase.from('lgpd_consents').select('*').eq('user_id', userId),
		supabase
			.from('user_preferences')
			.select('*')
			.eq('user_id', userId)
			.single(),
	]);

	return {
		profile: profile.data,
		transactions: transactions.data || [],
		consents: consents.data || [],
		preferences: preferences.data,
	};
}

// Mask sensitive data for privacy
function maskSensitiveData(userData: any) {
	const masked = JSON.parse(JSON.stringify(userData));

	// Mask financial data
	if (masked.transactions) {
		masked.transactions = masked.transactions.map((tx: any) => ({
			...tx,
			amount: '***',
			recipient_name: tx.recipient_name
				? tx.recipient_name.substring(0, 2) + '***'
				: null,
		}));
	}

	// Mask personal identifiers
	if (masked.profile) {
		masked.profile = {
			...masked.profile,
			cpf: masked.profile.cpf
				? masked.profile.cpf.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2')
				: null,
			email: masked.profile.email
				? masked.profile.email.replace(/(.{2}).*@/, '$1***@')
				: null,
		};
	}

	return masked;
}

// Get request status message in Portuguese
function getRequestStatusMessage(requestType: string, status: string): string {
	const messages: Record<string, Record<string, string>> = {
		ACCESS_REQUEST: {
			COMPLETED: 'Seus dados foram coletados e estão disponíveis para acesso',
			ERROR: 'Erro ao processar solicitação de acesso',
			MANUAL_REVIEW_REQUIRED: 'Sua solicitação requer análise manual',
		},
		DELETION_REQUEST: {
			COMPLETED: 'Seus dados foram anonimizados conforme lei',
			ERROR: 'Erro ao processar solicitação de exclusão',
			REQUIRES_LEGAL_REVIEW: 'Sua solicitação requer análise legal',
		},
		PORTABILITY_REQUEST: {
			COMPLETED: 'Seus dados foram exportados com sucesso',
			ERROR: 'Erro ao processar solicitação de portabilidade',
			MANUAL_REVIEW_REQUIRED: 'Sua solicitação requer análise manual',
		},
	};

	return messages[requestType]?.[status] || 'Processando sua solicitação';
}

// Get LGPD legal reference
function getLGPDReference(requestType: string): string {
	const references: Record<string, string> = {
		ACCESS_REQUEST: 'Artigo 18 - Direito de acesso aos dados',
		RECTIFICATION_REQUEST: 'Artigo 18 - Direito de correção de dados',
		DELETION_REQUEST: 'Artigo 18 - Direito à eliminação de dados',
		PORTABILITY_REQUEST: 'Artigo 18 - Direito à portabilidade dos dados',
		INFORMATION_REQUEST: 'Artigo 18 - Direito à informação sobre processamento',
		CONSENT_REVOCATION: 'Artigo 18 - Direito de revogar consentimento',
		OBJECTION_REQUEST: 'Artigo 18 - Direito de oposição ao processamento',
	};

	return references[requestType] || 'LGPD - Lei Geral de Proteção de Dados';
}

// Get estimated completion time
function getEstimatedCompletion(requestType: string): string {
	const completionTimes: Record<string, string> = {
		ACCESS_REQUEST: '15 dias úteis',
		RECTIFICATION_REQUEST: '15 dias úteis',
		DELETION_REQUEST: '15 dias úteis',
		PORTABILITY_REQUEST: '15 dias úteis',
		INFORMATION_REQUEST: '10 dias úteis',
		CONSENT_REVOCATION: 'Imediato',
		OBJECTION_REQUEST: '15 dias úteis',
	};

	return completionTimes[requestType] || '15 dias úteis';
}

export default lgpdRouter;
