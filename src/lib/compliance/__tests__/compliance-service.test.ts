/**
 * ComplianceService Unit Tests
 * Tests for LGPD compliance functionality
 *
 * Run: bun test src/lib/compliance/__tests__/compliance-service.test.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	ComplianceService,
	createComplianceService,
} from '../compliance-service';
import type { CollectionMethod, ConsentType } from '@/types/compliance';

// Mock secureLogger
vi.mock('@/lib/logging/secure-logger', () => ({
	secureLogger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

// Mock Supabase client
const createMockSupabase = () => {
	const mockFrom = vi.fn();
	const mockRpc = vi.fn();

	return {
		from: mockFrom,
		rpc: mockRpc,
		_mockFrom: mockFrom,
		_mockRpc: mockRpc,
	};
};

describe('ComplianceService', () => {
	let mockSupabase: ReturnType<typeof createMockSupabase>;
	let service: ComplianceService;

	beforeEach(() => {
		mockSupabase = createMockSupabase();
		service = createComplianceService(mockSupabase as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Factory Function', () => {
		it('should create a ComplianceService instance', () => {
			const instance = createComplianceService(mockSupabase as any);
			expect(instance).toBeInstanceOf(ComplianceService);
		});
	});

	describe('getUserConsents', () => {
		it('should return user consents successfully', async () => {
			const mockConsents = [
				{
					id: 'consent-1',
					user_id: 'user-123',
					consent_type: 'data_processing',
					granted: true,
					granted_at: '2024-01-01T00:00:00Z',
					revoked_at: null,
				},
				{
					id: 'consent-2',
					user_id: 'user-123',
					consent_type: 'marketing',
					granted: true,
					granted_at: '2024-01-02T00:00:00Z',
					revoked_at: null,
				},
			];

			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						order: vi
							.fn()
							.mockResolvedValue({ data: mockConsents, error: null }),
					}),
				}),
			});

			const result = await service.getUserConsents('user-123');

			expect(mockSupabase._mockFrom).toHaveBeenCalledWith('lgpd_consents');
			expect(result).toEqual(mockConsents);
			expect(result).toHaveLength(2);
		});

		it('should throw error when fetching consents fails', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						order: vi.fn().mockResolvedValue({
							data: null,
							error: { message: 'Database error' },
						}),
					}),
				}),
			});

			await expect(service.getUserConsents('user-123')).rejects.toThrow(
				'Erro ao buscar consentimentos: Database error',
			);
		});

		it('should return empty array when no consents exist', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						order: vi.fn().mockResolvedValue({ data: [], error: null }),
					}),
				}),
			});

			const result = await service.getUserConsents('user-123');
			expect(result).toEqual([]);
		});
	});

	describe('getConsentTemplates', () => {
		it('should return active consent templates', async () => {
			const mockTemplates = [
				{
					id: 'template-1',
					consent_type: 'data_processing',
					version: '1.0',
					title_pt: 'Processamento de Dados',
					description_pt: 'Descrição...',
					full_text_pt: 'Texto completo...',
					is_mandatory: true,
					is_active: true,
				},
			];

			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						order: vi
							.fn()
							.mockResolvedValue({ data: mockTemplates, error: null }),
					}),
				}),
			});

			const result = await service.getConsentTemplates();

			expect(mockSupabase._mockFrom).toHaveBeenCalledWith('consent_templates');
			expect(result).toEqual(mockTemplates);
		});

		it('should throw error when fetching templates fails', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						order: vi.fn().mockResolvedValue({
							data: null,
							error: { message: 'Template error' },
						}),
					}),
				}),
			});

			await expect(service.getConsentTemplates()).rejects.toThrow(
				'Erro ao buscar modelos de consentimento: Template error',
			);
		});
	});

	describe('grantConsent', () => {
		it('should grant consent successfully', async () => {
			const mockTemplate = {
				id: 'template-1',
				consent_type: 'data_processing',
				version: '1.0',
				full_text_pt: 'Texto completo do consentimento',
				description_pt: 'Descrição do consentimento',
			};

			const mockConsent = {
				id: 'new-consent-1',
				user_id: 'user-123',
				consent_type: 'data_processing',
				granted: true,
				granted_at: expect.any(String),
			};

			// Mock template lookup
			mockSupabase._mockFrom.mockImplementation((table: string) => {
				if (table === 'consent_templates') {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								eq: vi.fn().mockReturnValue({
									order: vi.fn().mockReturnValue({
										limit: vi.fn().mockReturnValue({
											single: vi
												.fn()
												.mockResolvedValue({ data: mockTemplate, error: null }),
										}),
									}),
								}),
							}),
						}),
					};
				}
				if (table === 'lgpd_consents') {
					return {
						upsert: vi.fn().mockReturnValue({
							select: vi.fn().mockReturnValue({
								single: vi
									.fn()
									.mockResolvedValue({ data: mockConsent, error: null }),
							}),
						}),
					};
				}
				return {};
			});

			const result = await service.grantConsent(
				'user-123',
				'data_processing' as ConsentType,
				'explicit_form' as CollectionMethod,
				'192.168.1.1',
				'Mozilla/5.0',
			);

			expect(result).toMatchObject({
				id: 'new-consent-1',
				user_id: 'user-123',
				consent_type: 'data_processing',
				granted: true,
			});
		});

		it('should throw error when template not found', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							order: vi.fn().mockReturnValue({
								limit: vi.fn().mockReturnValue({
									single: vi
										.fn()
										.mockResolvedValue({ data: null, error: null }),
								}),
							}),
						}),
					}),
				}),
			});

			await expect(
				service.grantConsent(
					'user-123',
					'data_processing' as ConsentType,
					'explicit_form' as CollectionMethod,
				),
			).rejects.toThrow(
				'Modelo de consentimento não encontrado: data_processing',
			);
		});
	});

	describe('revokeConsent', () => {
		it('should revoke consent successfully', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				update: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								is: vi.fn().mockResolvedValue({ error: null }),
							}),
						}),
					}),
				}),
			});

			await service.revokeConsent('user-123', 'marketing' as ConsentType);

			expect(mockSupabase._mockFrom).toHaveBeenCalledWith('lgpd_consents');
		});

		it('should throw error when revocation fails', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				update: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								is: vi.fn().mockResolvedValue({
									error: { message: 'Revocation failed' },
								}),
							}),
						}),
					}),
				}),
			});

			await expect(
				service.revokeConsent('user-123', 'marketing' as ConsentType),
			).rejects.toThrow('Erro ao revogar consentimento: Revocation failed');
		});
	});

	describe('checkRequiredConsents', () => {
		it('should return true when all required consents are granted', async () => {
			mockSupabase._mockRpc.mockResolvedValue({ data: true, error: null });

			const result = await service.checkRequiredConsents('user-123', [
				'data_processing' as ConsentType,
				'financial_data' as ConsentType,
			]);

			expect(result).toBe(true);
			expect(mockSupabase._mockRpc).toHaveBeenCalledWith(
				'check_required_consents',
				{
					p_user_id: 'user-123',
					p_required_consents: ['data_processing', 'financial_data'],
				},
			);
		});

		it('should return false when required consents are missing', async () => {
			mockSupabase._mockRpc.mockResolvedValue({ data: false, error: null });

			const result = await service.checkRequiredConsents('user-123', [
				'data_processing' as ConsentType,
			]);

			expect(result).toBe(false);
		});

		it('should return false on RPC error', async () => {
			mockSupabase._mockRpc.mockResolvedValue({
				data: null,
				error: { message: 'RPC error' },
			});

			const result = await service.checkRequiredConsents('user-123', [
				'data_processing' as ConsentType,
			]);

			expect(result).toBe(false);
		});
	});

	describe('getMissingMandatoryConsents', () => {
		it('should return missing mandatory consents', async () => {
			const mockTemplates = [
				{ consent_type: 'data_processing' },
				{ consent_type: 'financial_data' },
				{ consent_type: 'voice_recording' },
			];

			const mockUserConsents = [{ consent_type: 'data_processing' }];

			mockSupabase._mockFrom.mockImplementation((table: string) => {
				if (table === 'consent_templates') {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								eq: vi
									.fn()
									.mockResolvedValue({ data: mockTemplates, error: null }),
							}),
						}),
					};
				}
				if (table === 'lgpd_consents') {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								eq: vi.fn().mockReturnValue({
									is: vi
										.fn()
										.mockResolvedValue({ data: mockUserConsents, error: null }),
								}),
							}),
						}),
					};
				}
				return {};
			});

			const result = await service.getMissingMandatoryConsents('user-123');

			expect(result).toContain('financial_data');
			expect(result).toContain('voice_recording');
			expect(result).not.toContain('data_processing');
		});

		it('should return empty array when no mandatory templates exist', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockResolvedValue({ data: [], error: null }),
					}),
				}),
			});

			const result = await service.getMissingMandatoryConsents('user-123');
			expect(result).toEqual([]);
		});
	});

	describe('createExportRequest', () => {
		it('should create export request successfully', async () => {
			const mockExportRequest = {
				id: 'export-1',
				user_id: 'user-123',
				request_type: 'full_export',
				format: 'json',
				status: 'pending',
			};

			mockSupabase._mockFrom.mockImplementation((table: string) => {
				if (table === 'data_export_requests') {
					return {
						insert: vi.fn().mockReturnValue({
							select: vi.fn().mockReturnValue({
								single: vi
									.fn()
									.mockResolvedValue({ data: mockExportRequest, error: null }),
							}),
						}),
					};
				}
				if (table === 'compliance_audit_logs') {
					return {
						insert: vi.fn().mockResolvedValue({ error: null }),
					};
				}
				return {};
			});

			const result = await service.createExportRequest(
				'user-123',
				'full_export',
				'json',
				undefined,
				undefined,
				'192.168.1.1',
			);

			expect(result).toMatchObject({
				id: 'export-1',
				request_type: 'full_export',
				format: 'json',
				status: 'pending',
			});
		});

		it('should throw error when export request creation fails', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				insert: vi.fn().mockReturnValue({
					select: vi.fn().mockReturnValue({
						single: vi.fn().mockResolvedValue({
							data: null,
							error: { message: 'Export creation failed' },
						}),
					}),
				}),
			});

			await expect(
				service.createExportRequest('user-123', 'full_export', 'json'),
			).rejects.toThrow(
				'Erro ao criar solicitação de exportação: Export creation failed',
			);
		});
	});

	describe('createDeletionRequest', () => {
		it('should create deletion request successfully', async () => {
			const mockDeletionRequest = {
				id: 'deletion-1',
				user_id: 'user-123',
				request_type: 'full_deletion',
				status: 'pending',
				verification_code: 'ABC123',
			};

			mockSupabase._mockFrom.mockImplementation((table: string) => {
				if (table === 'data_deletion_requests') {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								eq: vi.fn().mockReturnValue({
									eq: vi.fn().mockReturnValue({
										limit: vi.fn().mockResolvedValue({ data: [], error: null }),
									}),
								}),
							}),
						}),
						insert: vi.fn().mockReturnValue({
							select: vi.fn().mockReturnValue({
								single: vi
									.fn()
									.mockResolvedValue({
										data: mockDeletionRequest,
										error: null,
									}),
							}),
						}),
					};
				}
				if (table === 'compliance_audit_logs') {
					return {
						insert: vi.fn().mockResolvedValue({ error: null }),
					};
				}
				return {};
			});

			const result = await service.createDeletionRequest(
				'user-123',
				'full_deletion',
				undefined,
				'Encerramento de conta',
			);

			expect(result).toMatchObject({
				id: 'deletion-1',
				request_type: 'full_deletion',
				status: 'pending',
			});
		});

		it('should reject deletion when legal hold exists', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue({
									data: [{ id: 'hold-1' }],
									error: null,
								}),
							}),
						}),
					}),
				}),
			});

			await expect(
				service.createDeletionRequest('user-123', 'full_deletion'),
			).rejects.toThrow(
				'Seus dados estão sob retenção legal e não podem ser excluídos no momento.',
			);
		});
	});

	describe('getTransactionLimits', () => {
		it('should return user transaction limits', async () => {
			const mockLimits = [
				{
					id: 'limit-1',
					user_id: 'user-123',
					limit_type: 'pix_daytime',
					daily_limit: 5000,
					current_daily_used: 1000,
					is_active: true,
				},
			];

			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							order: vi
								.fn()
								.mockResolvedValue({ data: mockLimits, error: null }),
						}),
					}),
				}),
			});

			const result = await service.getTransactionLimits('user-123');

			expect(mockSupabase._mockFrom).toHaveBeenCalledWith('transaction_limits');
			expect(result).toEqual(mockLimits);
		});
	});

	describe('checkTransactionLimit', () => {
		it('should allow transaction within limit', async () => {
			const mockLimit = {
				id: 'limit-1',
				user_id: 'user-123',
				limit_type: 'pix_daytime',
				daily_limit: 5000,
				current_daily_used: 1000,
				is_active: true,
			};

			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi
									.fn()
									.mockResolvedValue({ data: mockLimit, error: null }),
							}),
						}),
					}),
				}),
			});

			const result = await service.checkTransactionLimit(
				'user-123',
				'pix_daytime',
				1000,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(3000); // 5000 - 1000 - 1000
		});

		it('should block transaction exceeding limit', async () => {
			const mockLimit = {
				id: 'limit-1',
				user_id: 'user-123',
				limit_type: 'pix_daytime',
				daily_limit: 5000,
				current_daily_used: 4500,
				is_active: true,
			};

			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi
									.fn()
									.mockResolvedValue({ data: mockLimit, error: null }),
							}),
						}),
					}),
				}),
			});

			const result = await service.checkTransactionLimit(
				'user-123',
				'pix_daytime',
				1000,
			);

			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(500); // 5000 - 4500
			expect(result.reason).toContain('Limite diário excedido');
		});

		it('should allow transaction when no limit is configured', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi.fn().mockResolvedValue({
									data: null,
									error: { code: 'PGRST116', message: 'Not found' },
								}),
							}),
						}),
					}),
				}),
			});

			const result = await service.checkTransactionLimit(
				'user-123',
				'pix_daytime',
				10000,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(Number.POSITIVE_INFINITY);
		});
	});

	describe('updateLimitUsage', () => {
		it('should update limit usage via RPC', async () => {
			mockSupabase._mockRpc.mockResolvedValue({ error: null });

			await service.updateLimitUsage('user-123', 'pix_daytime', 500);

			expect(mockSupabase._mockRpc).toHaveBeenCalledWith('update_limit_usage', {
				p_user_id: 'user-123',
				p_limit_type: 'pix_daytime',
				p_amount: 500,
			});
		});

		it('should throw error when RPC fails', async () => {
			mockSupabase._mockRpc.mockResolvedValue({
				error: { message: 'RPC failed' },
			});

			await expect(
				service.updateLimitUsage('user-123', 'pix_daytime', 500),
			).rejects.toThrow('Erro ao atualizar uso do limite: RPC failed');
		});
	});

	describe('getAuditHistory', () => {
		it('should return audit logs for user', async () => {
			const mockLogs = [
				{
					id: 'log-1',
					user_id: 'user-123',
					event_type: 'consent_granted',
					created_at: '2024-01-01T00:00:00Z',
				},
			];

			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						order: vi.fn().mockResolvedValue({ data: mockLogs, error: null }),
					}),
				}),
			});

			const result = await service.getAuditHistory('user-123');

			expect(mockSupabase._mockFrom).toHaveBeenCalledWith(
				'compliance_audit_logs',
			);
			expect(result).toEqual(mockLogs);
		});

		it('should filter by event type when provided', async () => {
			const mockOrderFn = vi.fn().mockResolvedValue({ data: [], error: null });
			const mockEqEventType = vi.fn().mockReturnValue({ order: mockOrderFn });
			const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqEventType });

			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: mockEqUserId,
				}),
			});

			await service.getAuditHistory('user-123', {
				eventType: 'consent_granted',
			});

			expect(mockEqEventType).toHaveBeenCalledWith(
				'event_type',
				'consent_granted',
			);
		});

		it('should apply limit when provided', async () => {
			const mockLimitFn = vi.fn().mockResolvedValue({ data: [], error: null });
			const mockOrderFn = vi.fn().mockReturnValue({ limit: mockLimitFn });

			mockSupabase._mockFrom.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						order: mockOrderFn,
					}),
				}),
			});

			await service.getAuditHistory('user-123', { limit: 50 });

			expect(mockLimitFn).toHaveBeenCalledWith(50);
		});
	});

	describe('logComplianceEvent', () => {
		it('should log compliance event successfully', async () => {
			mockSupabase._mockFrom.mockReturnValue({
				insert: vi.fn().mockResolvedValue({ error: null }),
			});

			await service.logComplianceEvent(
				'user-123',
				'consent_granted',
				'lgpd_consents',
				'consent-1',
				'User granted data processing consent',
			);

			expect(mockSupabase._mockFrom).toHaveBeenCalledWith(
				'compliance_audit_logs',
			);
		});
	});
});
