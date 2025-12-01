/**
 * LGPD Compliance Types
 * Brazilian Data Protection Law compliance types for AegisWallet
 */

// ========================================
// LGPD CONSENT TYPES
// ========================================

export type ConsentType =
	| 'data_processing'
	| 'marketing'
	| 'analytics'
	| 'third_party'
	| 'third_party_sharing'
	| 'voice_data'
	| 'voice_recording'
	| 'biometric'
	| 'financial_data'
	| 'location'
	| 'open_banking';

export type LegalBasis =
	| 'consent'
	| 'contract'
	| 'legal_obligation'
	| 'legitimate_interest'
	| 'credit_protection';

export type CollectionMethod =
	| 'signup'
	| 'settings'
	| 'settings_toggle'
	| 'prompt'
	| 'api'
	| 'import'
	| 'explicit_form'
	| 'terms_acceptance'
	| 'voice_command';

export interface LgpdConsent {
	id: string;
	user_id: string;
	consent_type: ConsentType;
	purpose: string;
	legal_basis: LegalBasis;
	granted: boolean;
	granted_at: string | null;
	revoked_at: string | null;
	consent_version: string;
	consent_text_hash: string;
	collection_method: CollectionMethod;
	ip_address: string | null;
	user_agent: string | null;
	metadata: Record<string, unknown>;
	expires_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface ConsentTemplate {
	id: string;
	consent_type: ConsentType;
	version: string;
	title_pt: string;
	description_pt: string;
	full_text_pt: string;
	is_mandatory: boolean;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// ========================================
// DATA SUBJECT RIGHTS TYPES
// ========================================

export type DataExportRequestType =
	| 'full_data'
	| 'full_export'
	| 'transactions'
	| 'profile'
	| 'consents'
	| 'audit_logs'
	| 'financial_only'
	| 'voice_commands'
	| 'specific_period';

export type DataExportFormat = 'json' | 'csv' | 'pdf';

export type DataExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

export interface DataExportRequest {
	id: string;
	user_id: string;
	request_type: DataExportRequestType;
	format: DataExportFormat;
	status: DataExportStatus;
	date_from: string | null;
	date_to: string | null;
	file_path: string | null;
	download_url: string | null;
	download_expires_at: string | null;
	downloaded_at: string | null;
	file_size_bytes: number | null;
	processing_started_at: string | null;
	processing_completed_at: string | null;
	error_message: string | null;
	requested_via: 'app' | 'email' | 'support';
	ip_address: string | null;
	created_at: string;
	updated_at: string;
}

export type DataDeletionRequestType =
	| 'full_account'
	| 'full_deletion'
	| 'specific_data'
	| 'anonymization'
	| 'partial_deletion'
	| 'consent_withdrawal';

export type DataDeletionStatus =
	| 'pending'
	| 'verified'
	| 'approved'
	| 'processing'
	| 'completed'
	| 'rejected'
	| 'cancelled';

export interface DataDeletionRequest {
	id: string;
	user_id: string;
	request_type: DataDeletionRequestType;
	scope: Record<string, unknown>;
	reason: string | null;
	status: DataDeletionStatus;
	rejection_reason: string | null;
	legal_hold: boolean;
	tables_affected: string[];
	records_deleted: number;
	records_anonymized: number;
	verification_code: string | null;
	verified_at: string | null;
	review_deadline: string | null;
	processing_started_at: string | null;
	processing_completed_at: string | null;
	processed_by: string | null;
	ip_address: string | null;
	created_at: string;
	updated_at: string;
}

// ========================================
// OPEN BANKING & FINANCIAL COMPLIANCE
// ========================================

export type OpenBankingConsentStatus =
	| 'awaiting_authorization'
	| 'authorized'
	| 'active'
	| 'rejected'
	| 'revoked'
	| 'expired';

export interface OpenBankingConsent {
	id: string;
	user_id: string;
	institution_id: string;
	institution_name: string;
	consent_id: string;
	permissions: string[];
	status: OpenBankingConsentStatus;
	created_at_institution: string | null;
	expires_at: string;
	revoked_at: string | null;
	revocation_reason: string | null;
	sharing_purpose: string;
	data_categories: string[];
	last_sync_at: string | null;
	sync_error_count: number;
	ip_address: string | null;
	created_at: string;
	updated_at: string;
}

export type TransactionLimitType =
	| 'pix_daily'
	| 'pix_daytime'
	| 'pix_nighttime'
	| 'pix_transaction'
	| 'pix_total_daily'
	| 'boleto_daily'
	| 'ted_daily'
	| 'transfer_daily'
	| 'withdrawal_daily'
	| 'total_daily'
	| 'total_monthly';

export interface TransactionLimit {
	id: string;
	user_id: string;
	limit_type: TransactionLimitType;
	daily_limit: number;
	nightly_limit: number | null;
	monthly_limit: number | null;
	per_transaction_limit: number | null;
	current_daily_used: number;
	current_monthly_used: number;
	last_reset_daily: string;
	last_reset_monthly: string;
	is_custom: boolean;
	requires_approval_above: number | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export type TermsType =
	| 'terms_of_service'
	| 'privacy_policy'
	| 'pix_terms'
	| 'open_banking_terms'
	| 'investment_disclaimer'
	| 'voice_assistant_terms';

export interface TermsAcceptance {
	id: string;
	user_id: string;
	terms_type: TermsType;
	version: string;
	accepted_at: string;
	ip_address: string | null;
	user_agent: string | null;
	document_hash: string;
	created_at: string;
}

// ========================================
// COMPLIANCE AUDIT TYPES
// ========================================

export type ComplianceEventType =
	| 'consent_granted'
	| 'consent_revoked'
	| 'data_export_requested'
	| 'data_export_completed'
	| 'data_deletion_requested'
	| 'data_deletion_completed'
	| 'data_accessed'
	| 'data_modified'
	| 'limit_updated'
	| 'policy_acknowledged';

export interface ComplianceAuditLog {
	id: string;
	user_id: string | null;
	event_type: ComplianceEventType;
	resource_type: string | null;
	resource_id: string | null;
	action: string;
	old_value: Record<string, unknown> | null;
	new_value: Record<string, unknown> | null;
	ip_address: string | null;
	user_agent: string | null;
	geo_location: Record<string, unknown> | null;
	session_id: string | null;
	request_id: string | null;
	risk_score: number | null;
	requires_review: boolean;
	reviewed_by: string | null;
	reviewed_at: string | null;
	context: Record<string, unknown>;
	created_at: string;
}

export interface DataRetentionPolicy {
	id: string;
	table_name: string;
	retention_period: string;
	deletion_strategy: 'hard_delete' | 'soft_delete' | 'anonymize' | 'archive';
	legal_basis: string;
	applies_to_inactive_only: boolean;
	is_active: boolean;
	last_cleanup_at: string | null;
	next_cleanup_at: string | null;
	created_at: string;
	updated_at: string;
}

// ========================================
// API REQUEST/RESPONSE TYPES
// ========================================

export interface GrantConsentRequest {
	consent_type: ConsentType;
	collection_method: CollectionMethod;
}

export interface RevokeConsentRequest {
	consent_type: ConsentType;
}

export interface CreateExportRequest {
	request_type: DataExportRequestType;
	format: DataExportFormat;
	date_from?: string;
	date_to?: string;
}

export interface CreateDeletionRequest {
	request_type: DataDeletionRequestType;
	scope?: Record<string, unknown>;
	reason?: string;
}

export interface CheckLimitRequest {
	limit_type: TransactionLimitType;
	amount: number;
}

export interface CheckLimitResponse {
	allowed: boolean;
	reason?: string;
	requires_approval?: boolean;
	limit?: number;
	used?: number;
	requested?: number;
	remaining?: number;
	remaining_daily?: number;
	approval_threshold?: number;
}

export interface UserConsentsResponse {
	consents: LgpdConsent[];
	templates: ConsentTemplate[];
	missing_mandatory: ConsentType[];
}
