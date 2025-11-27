/**
 * LGPD Compliance API Routes
 * Manages consent, data export, deletion requests, and transaction limits
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { createComplianceService } from '@/lib/compliance';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import type { ConsentType } from '@/types/compliance';

const complianceRouter = new Hono<AppEnv>();

// =====================================================
// Validation Schemas
// =====================================================

const grantConsentSchema = z.object({
  collectionMethod: z
    .enum(['explicit_form', 'voice_command', 'terms_acceptance', 'settings_toggle'])
    .default('explicit_form'),
  consentType: z.enum([
    'data_processing',
    'financial_data',
    'voice_recording',
    'analytics',
    'marketing',
    'third_party_sharing',
    'open_banking',
    'biometric',
  ]),
});

const createExportRequestSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  requestType: z
    .enum(['full_export', 'financial_only', 'transactions', 'voice_commands', 'specific_period'])
    .default('full_export'),
});

const createDeletionRequestSchema = z.object({
  reason: z.string().optional(),
  requestType: z.enum(['full_deletion', 'anonymization', 'partial_deletion', 'consent_withdrawal']),
  scope: z.record(z.string(), z.unknown()).optional(),
});

const checkLimitSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  limitType: z.enum([
    'pix_daytime',
    'pix_nighttime',
    'pix_total_daily',
    'ted_daily',
    'boleto_daily',
    'total_daily',
    'total_monthly',
  ]),
});

// =====================================================
// CONSENT MANAGEMENT ENDPOINTS
// =====================================================

/**
 * GET /consent-templates - Get available consent templates
 */
complianceRouter.get('/consent-templates', authMiddleware, async (c) => {
  const { supabase } = c.get('auth');
  const requestId = c.get('requestId');

  try {
    const complianceService = createComplianceService(supabase);
    const templates = await complianceService.getConsentTemplates();

    return c.json({
      data: templates,
      meta: {
        requestId,
        retrievedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    secureLogger.error('Failed to get consent templates', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
    });

    return c.json(
      { code: 'CONSENT_TEMPLATES_ERROR', error: 'Erro ao buscar modelos de consentimento' },
      500
    );
  }
});

/**
 * GET /consents - Get user's consents
 */
complianceRouter.get(
  '/consents',
  authMiddleware,
  userRateLimitMiddleware({ windowMs: 60_000, max: 30, message: 'Muitas requisições' }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const complianceService = createComplianceService(supabase);
      const consents = await complianceService.getUserConsents(user.id);

      return c.json({
        data: consents,
        meta: { requestId, retrievedAt: new Date().toISOString() },
      });
    } catch (error) {
      secureLogger.error('Failed to get user consents', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json({ code: 'CONSENTS_ERROR', error: 'Erro ao buscar consentimentos' }, 500);
    }
  }
);

/**
 * GET /consents/missing - Get missing mandatory consents
 */
complianceRouter.get('/consents/missing', authMiddleware, async (c) => {
  const { user, supabase } = c.get('auth');
  const requestId = c.get('requestId');

  try {
    const complianceService = createComplianceService(supabase);
    const missingConsents = await complianceService.getMissingMandatoryConsents(user.id);

    return c.json({
      data: { hasMissing: missingConsents.length > 0, missingConsents },
      meta: { requestId, retrievedAt: new Date().toISOString() },
    });
  } catch (error) {
    secureLogger.error('Failed to get missing consents', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
      userId: user.id,
    });

    return c.json(
      { code: 'MISSING_CONSENTS_ERROR', error: 'Erro ao verificar consentimentos' },
      500
    );
  }
});

/**
 * POST /consents - Grant a consent
 */
complianceRouter.post(
  '/consents',
  authMiddleware,
  userRateLimitMiddleware({ windowMs: 60_000, max: 20, message: 'Muitas requisições' }),
  zValidator('json', grantConsentSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip');
      const userAgent = c.req.header('user-agent');

      const complianceService = createComplianceService(supabase);
      const consent = await complianceService.grantConsent(
        user.id,
        input.consentType,
        input.collectionMethod,
        ipAddress,
        userAgent
      );

      secureLogger.info('Consent granted', {
        consentType: input.consentType,
        requestId,
        userId: user.id,
      });

      return c.json(
        { data: consent, meta: { requestId, grantedAt: new Date().toISOString() } },
        201
      );
    } catch (error) {
      secureLogger.error('Failed to grant consent', {
        consentType: input.consentType,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json({ code: 'CONSENT_GRANT_ERROR', error: 'Erro ao registrar consentimento' }, 500);
    }
  }
);

/**
 * DELETE /consents/:type - Revoke a consent
 */
complianceRouter.delete(
  '/consents/:type',
  authMiddleware,
  userRateLimitMiddleware({ windowMs: 60_000, max: 20, message: 'Muitas requisições' }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const consentType = c.req.param('type');
    const requestId = c.get('requestId');

    try {
      const complianceService = createComplianceService(supabase);
      await complianceService.revokeConsent(user.id, consentType as ConsentType);

      secureLogger.info('Consent revoked', { consentType, requestId, userId: user.id });

      return c.json({
        data: { success: true, message: 'Consentimento revogado com sucesso' },
        meta: { requestId, revokedAt: new Date().toISOString() },
      });
    } catch (error) {
      secureLogger.error('Failed to revoke consent', {
        consentType,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json({ code: 'CONSENT_REVOKE_ERROR', error: 'Erro ao revogar consentimento' }, 500);
    }
  }
);

// =====================================================
// DATA EXPORT ENDPOINTS
// =====================================================

/**
 * GET /export-requests - Get user's export requests
 */
complianceRouter.get('/export-requests', authMiddleware, async (c) => {
  const { user, supabase } = c.get('auth');
  const requestId = c.get('requestId');

  try {
    const complianceService = createComplianceService(supabase);
    const requests = await complianceService.getExportRequests(user.id);

    return c.json({
      data: requests,
      meta: { requestId, retrievedAt: new Date().toISOString() },
    });
  } catch (error) {
    secureLogger.error('Failed to get export requests', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
      userId: user.id,
    });

    return c.json({ code: 'EXPORT_REQUESTS_ERROR', error: 'Erro ao buscar solicitações' }, 500);
  }
});

/**
 * POST /export-requests - Create a data export request
 */
complianceRouter.post(
  '/export-requests',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 3600_000,
    max: 5,
    message: 'Limite de solicitações atingido',
  }),
  zValidator('json', createExportRequestSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip');

      const complianceService = createComplianceService(supabase);
      const request = await complianceService.createExportRequest(
        user.id,
        input.requestType,
        input.format,
        input.dateFrom,
        input.dateTo,
        ipAddress
      );

      secureLogger.info('Export request created', {
        format: input.format,
        requestId,
        requestType: input.requestType,
        userId: user.id,
      });

      return c.json(
        {
          data: request,
          meta: { requestId, createdAt: new Date().toISOString() },
        },
        201
      );
    } catch (error) {
      secureLogger.error('Failed to create export request', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json({ code: 'EXPORT_REQUEST_ERROR', error: 'Erro ao criar solicitação' }, 500);
    }
  }
);

// =====================================================
// DATA DELETION ENDPOINTS
// =====================================================

/**
 * GET /deletion-requests - Get user's deletion requests
 */
complianceRouter.get('/deletion-requests', authMiddleware, async (c) => {
  const { user, supabase } = c.get('auth');
  const requestId = c.get('requestId');

  try {
    const complianceService = createComplianceService(supabase);
    const requests = await complianceService.getDeletionRequests(user.id);

    return c.json({
      data: requests,
      meta: { requestId, retrievedAt: new Date().toISOString() },
    });
  } catch (error) {
    secureLogger.error('Failed to get deletion requests', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
      userId: user.id,
    });

    return c.json({ code: 'DELETION_REQUESTS_ERROR', error: 'Erro ao buscar solicitações' }, 500);
  }
});

/**
 * POST /deletion-requests - Create a data deletion request
 */
complianceRouter.post(
  '/deletion-requests',
  authMiddleware,
  userRateLimitMiddleware({ windowMs: 86400_000, max: 3, message: 'Limite diário atingido' }),
  zValidator('json', createDeletionRequestSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip');

      const complianceService = createComplianceService(supabase);
      const request = await complianceService.createDeletionRequest(
        user.id,
        input.requestType,
        input.scope,
        input.reason,
        ipAddress
      );

      secureLogger.info('Deletion request created', {
        requestId,
        requestType: input.requestType,
        userId: user.id,
      });

      return c.json(
        {
          data: request,
          meta: { requestId, createdAt: new Date().toISOString() },
        },
        201
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      secureLogger.error('Failed to create deletion request', {
        error: errorMessage,
        requestId,
        userId: user.id,
      });

      // Handle legal hold error
      if (errorMessage.includes('retenção legal')) {
        return c.json({ code: 'LEGAL_HOLD', error: errorMessage }, 403);
      }

      return c.json({ code: 'DELETION_REQUEST_ERROR', error: 'Erro ao criar solicitação' }, 500);
    }
  }
);

// =====================================================
// TRANSACTION LIMITS ENDPOINTS
// =====================================================

/**
 * GET /limits - Get user's transaction limits
 */
complianceRouter.get('/limits', authMiddleware, async (c) => {
  const { user, supabase } = c.get('auth');
  const requestId = c.get('requestId');

  try {
    const complianceService = createComplianceService(supabase);
    const limits = await complianceService.getTransactionLimits(user.id);

    return c.json({
      data: limits,
      meta: { requestId, retrievedAt: new Date().toISOString() },
    });
  } catch (error) {
    secureLogger.error('Failed to get transaction limits', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
      userId: user.id,
    });

    return c.json({ code: 'LIMITS_ERROR', error: 'Erro ao buscar limites' }, 500);
  }
});

/**
 * POST /limits/check - Check if a transaction is within limits
 */
complianceRouter.post(
  '/limits/check',
  authMiddleware,
  userRateLimitMiddleware({ windowMs: 60_000, max: 60, message: 'Muitas verificações' }),
  zValidator('json', checkLimitSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const complianceService = createComplianceService(supabase);
      const result = await complianceService.checkTransactionLimit(
        user.id,
        input.limitType,
        input.amount
      );

      return c.json({
        data: result,
        meta: { requestId, checkedAt: new Date().toISOString() },
      });
    } catch (error) {
      secureLogger.error('Failed to check transaction limit', {
        amount: input.amount,
        error: error instanceof Error ? error.message : 'Unknown error',
        limitType: input.limitType,
        requestId,
        userId: user.id,
      });

      return c.json({ code: 'LIMIT_CHECK_ERROR', error: 'Erro ao verificar limite' }, 500);
    }
  }
);

// =====================================================
// AUDIT ENDPOINTS
// =====================================================

/**
 * GET /audit - Get compliance audit history
 */
complianceRouter.get(
  '/audit',
  authMiddleware,
  userRateLimitMiddleware({ windowMs: 60_000, max: 10, message: 'Muitas requisições' }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const limit = Number(c.req.query('limit')) || 50;
      const eventType = c.req.query('eventType');

      const complianceService = createComplianceService(supabase);
      const history = await complianceService.getAuditHistory(user.id, {
        limit,
        eventType: eventType || undefined,
      });

      return c.json({
        data: history,
        meta: { requestId, retrievedAt: new Date().toISOString() },
      });
    } catch (error) {
      secureLogger.error('Failed to get audit history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json({ code: 'AUDIT_ERROR', error: 'Erro ao buscar histórico' }, 500);
    }
  }
);

export default complianceRouter;
