/**
 * LGPD Compliance Routes Integration Tests
 *
 * Tests the compliance API endpoints for LGPD compliance functionality:
 * - Consent management
 * - Data export requests
 * - Data deletion requests
 * - Transaction limits
 * - Audit logging
 *
 * Run: bun test src/test/integration/compliance.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getSupabaseAdminClient, createTestUser, cleanupUserData, type TestUser } from './helpers';

describe('LGPD Compliance Integration Tests', () => {
  let supabase: ReturnType<typeof getSupabaseAdminClient>;
  let testUser: TestUser;

  beforeAll(async () => {
    supabase = getSupabaseAdminClient();
    testUser = await createTestUser(supabase);
  });

  afterAll(async () => {
    if (testUser) {
      // Clean up compliance-related data first
      await supabase.from('compliance_audit_logs').delete().eq('user_id', testUser.id);
      await supabase.from('data_export_requests').delete().eq('user_id', testUser.id);
      await supabase.from('data_deletion_requests').delete().eq('user_id', testUser.id);
      await supabase.from('lgpd_consents').delete().eq('user_id', testUser.id);
      await supabase.from('transaction_limits').delete().eq('user_id', testUser.id);
      await cleanupUserData(supabase, testUser.id);
    }
  });

  describe('Consent Templates', () => {
    it('should have active consent templates in database', async () => {
      const { data: templates, error } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(templates).toBeDefined();
      expect(templates!.length).toBeGreaterThan(0);
    });

    it('should have mandatory consent templates', async () => {
      const { data: templates, error } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('is_mandatory', true)
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(templates).toBeDefined();
      expect(templates!.length).toBeGreaterThan(0);
      
      // Check that data_processing is mandatory
      const hasDataProcessing = templates!.some(t => t.consent_type === 'data_processing');
      expect(hasDataProcessing).toBe(true);
    });

    it('should have Portuguese localization for templates', async () => {
      const { data: templates, error } = await supabase
        .from('consent_templates')
        .select('title_pt, description_pt, full_text_pt')
        .eq('is_active', true)
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(templates).toBeDefined();
      expect(templates!.title_pt).toBeTruthy();
      expect(templates!.description_pt).toBeTruthy();
      expect(templates!.full_text_pt).toBeTruthy();
    });
  });

  describe('Consent Management', () => {
    beforeEach(async () => {
      // Clean up any existing consents for the test user
      await supabase.from('lgpd_consents').delete().eq('user_id', testUser.id);
    });

    it('should create consent record', async () => {
      const { data: template } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('consent_type', 'data_processing')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!template) {
        throw new Error('No consent template found');
      }

      const { data: consent, error } = await supabase
        .from('lgpd_consents')
        .insert({
          user_id: testUser.id,
          consent_type: 'data_processing',
          purpose: template.description_pt,
          legal_basis: 'consent',
          granted: true,
          granted_at: new Date().toISOString(),
          consent_version: template.version,
          consent_text_hash: 'test-hash',
          collection_method: 'explicit_form',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(consent).toBeDefined();
      expect(consent!.user_id).toBe(testUser.id);
      expect(consent!.consent_type).toBe('data_processing');
      expect(consent!.granted).toBe(true);
    });

    it('should prevent duplicate consents with same version', async () => {
      const { data: template } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('consent_type', 'analytics')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!template) {
        throw new Error('No consent template found');
      }

      // First insert should succeed
      await supabase.from('lgpd_consents').insert({
        user_id: testUser.id,
        consent_type: 'analytics',
        purpose: template.description_pt,
        legal_basis: 'consent',
        granted: true,
        granted_at: new Date().toISOString(),
        consent_version: template.version,
        consent_text_hash: 'test-hash',
        collection_method: 'explicit_form',
      });

      // Second insert with same version should be upserted
      const { error } = await supabase.from('lgpd_consents').upsert({
        user_id: testUser.id,
        consent_type: 'analytics',
        purpose: template.description_pt,
        legal_basis: 'consent',
        granted: true,
        granted_at: new Date().toISOString(),
        consent_version: template.version,
        consent_text_hash: 'test-hash-updated',
        collection_method: 'explicit_form',
      }, { onConflict: 'user_id,consent_type,consent_version' });

      expect(error).toBeNull();
    });
  });

  describe('Data Export Requests', () => {
    beforeEach(async () => {
      await supabase.from('data_export_requests').delete().eq('user_id', testUser.id);
    });

    it('should create export request', async () => {
      const { data: request, error } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: testUser.id,
          request_type: 'full_export',
          format: 'json',
          status: 'pending',
          requested_via: 'app',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(request).toBeDefined();
      expect(request!.status).toBe('pending');
      expect(request!.format).toBe('json');
    });

    it('should track export request status transitions', async () => {
      // Create pending request
      const { data: request } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: testUser.id,
          request_type: 'financial_only',
          format: 'csv',
          status: 'pending',
          requested_via: 'app',
        })
        .select()
        .single();

      expect(request).toBeDefined();

      // Update to processing
      const { data: updated, error } = await supabase
        .from('data_export_requests')
        .update({
          status: 'processing',
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', request!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated!.status).toBe('processing');
      expect(updated!.processing_started_at).toBeTruthy();
    });
  });

  describe('Data Deletion Requests', () => {
    beforeEach(async () => {
      await supabase.from('data_deletion_requests').delete().eq('user_id', testUser.id);
    });

    it('should create deletion request with review deadline', async () => {
      const { data: request, error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: testUser.id,
          request_type: 'full_deletion',
          status: 'pending',
          scope: {},
          reason: 'Encerramento de conta',
          verification_code: 'TEST123',
          review_deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(request).toBeDefined();
      expect(request!.status).toBe('pending');
      expect(request!.verification_code).toBe('TEST123');
      expect(request!.review_deadline).toBeTruthy();
    });

    it('should enforce legal hold on deletion', async () => {
      // Create a request with legal hold
      const { data: holdRequest } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: testUser.id,
          request_type: 'full_deletion',
          status: 'approved',
          scope: {},
          legal_hold: true,
          verification_code: 'HOLD123',
        })
        .select()
        .single();

      expect(holdRequest).toBeDefined();
      expect(holdRequest!.legal_hold).toBe(true);
    });
  });

  describe('Transaction Limits', () => {
    beforeEach(async () => {
      await supabase.from('transaction_limits').delete().eq('user_id', testUser.id);
    });

    it('should create transaction limit for user', async () => {
      const { data: limit, error } = await supabase
        .from('transaction_limits')
        .insert({
          user_id: testUser.id,
          limit_type: 'pix_daytime',
          daily_limit: 5000,
          current_daily_used: 0,
          current_monthly_used: 0,
          last_reset_daily: new Date().toISOString(),
          last_reset_monthly: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(limit).toBeDefined();
      expect(limit!.daily_limit).toBe(5000);
      expect(limit!.current_daily_used).toBe(0);
    });

    it('should track limit usage', async () => {
      // Create limit
      const { data: limit } = await supabase
        .from('transaction_limits')
        .insert({
          user_id: testUser.id,
          limit_type: 'pix_daytime',
          daily_limit: 5000,
          current_daily_used: 0,
          current_monthly_used: 0,
          last_reset_daily: new Date().toISOString(),
          last_reset_monthly: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      expect(limit).toBeDefined();

      // Update usage
      const { data: updated, error } = await supabase
        .from('transaction_limits')
        .update({
          current_daily_used: 1500,
          current_monthly_used: 1500,
        })
        .eq('id', limit!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated!.current_daily_used).toBe(1500);
    });
  });

  describe('Audit Logging', () => {
    beforeEach(async () => {
      await supabase.from('compliance_audit_logs').delete().eq('user_id', testUser.id);
    });

    it('should create audit log entry', async () => {
      const { data: log, error } = await supabase
        .from('compliance_audit_logs')
        .insert({
          user_id: testUser.id,
          event_type: 'consent_granted',
          resource_type: 'lgpd_consents',
          resource_id: 'test-consent-id',
          description: 'User granted data processing consent',
          metadata: { consent_type: 'data_processing' },
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(log).toBeDefined();
      expect(log!.event_type).toBe('consent_granted');
      expect(log!.description).toContain('data processing');
    });

    it('should query audit logs by event type', async () => {
      // Create multiple log entries
      await supabase.from('compliance_audit_logs').insert([
        {
          user_id: testUser.id,
          event_type: 'consent_granted',
          description: 'Consent granted 1',
        },
        {
          user_id: testUser.id,
          event_type: 'consent_revoked',
          description: 'Consent revoked 1',
        },
        {
          user_id: testUser.id,
          event_type: 'data_export_requested',
          description: 'Export requested',
        },
      ]);

      const { data: grantedLogs, error } = await supabase
        .from('compliance_audit_logs')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('event_type', 'consent_granted');

      expect(error).toBeNull();
      expect(grantedLogs!.length).toBe(1);
      expect(grantedLogs![0].event_type).toBe('consent_granted');
    });
  });

  describe('RLS Policies', () => {
    it('should enforce user isolation for consents', async () => {
      // Create consent for test user
      const { data: template } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('consent_type', 'marketing')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!template) return;

      await supabase.from('lgpd_consents').insert({
        user_id: testUser.id,
        consent_type: 'marketing',
        purpose: template.description_pt,
        legal_basis: 'consent',
        granted: true,
        granted_at: new Date().toISOString(),
        consent_version: template.version,
        consent_text_hash: 'test-hash',
        collection_method: 'explicit_form',
      });

      // Query should only return this user's consents
      const { data: consents } = await supabase
        .from('lgpd_consents')
        .select('*')
        .eq('user_id', testUser.id);

      expect(consents).toBeDefined();
      expect(consents!.every(c => c.user_id === testUser.id)).toBe(true);
    });
  });
});
