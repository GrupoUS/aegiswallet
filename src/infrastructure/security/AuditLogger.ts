/**
 * Comprehensive Audit Logging System
 * Tracks all security and business operations for compliance and monitoring
 */

export enum AuditEventType {
  // Authentication events
  AUTH_LOGIN_SUCCESS = 'auth_login_success',
  AUTH_LOGIN_FAILED = 'auth_login_failed',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_PASSWORD_CHANGE = 'auth_password_change',
  AUTH_PASSWORD_RESET_REQUEST = 'auth_password_reset_request',
  AUTH_PASSWORD_RESET_SUCCESS = 'auth_password_reset_success',
  AUTH_ACCOUNT_CREATED = 'auth_account_created',
  AUTH_ACCOUNT_DELETED = 'auth_account_deleted',

  // Authorization events
  AUTHZ_ACCESS_GRANTED = 'authz_access_granted',
  AUTHZ_ACCESS_DENIED = 'authz_access_denied',
  AUTHZ_PERMISSION_CHANGED = 'authz_permission_changed',

  // Data access events
  DATA_READ = 'data_read',
  DATA_CREATED = 'data_created',
  DATA_UPDATED = 'data_updated',
  DATA_DELETED = 'data_deleted',
  DATA_EXPORTED = 'data_exported',

  // Financial events
  FINANCIAL_TRANSACTION_CREATED = 'financial_transaction_created',
  FINANCIAL_TRANSACTION_UPDATED = 'financial_transaction_updated',
  FINANCIAL_TRANSACTION_DELETED = 'financial_transaction_deleted',
  FINANCIAL_ACCOUNT_ADDED = 'financial_account_added',
  FINANCIAL_ACCOUNT_REMOVED = 'financial_account_removed',
  FINANCIAL_TRANSFER_INITIATED = 'financial_transfer_initiated',
  FINANCIAL_TRANSFER_COMPLETED = 'financial_transfer_completed',
  FINANCIAL_TRANSFER_FAILED = 'financial_transfer_failed',

  // Security events
  SECURITY_RATE_LIMIT_EXCEEDED = 'security_rate_limit_exceeded',
  SECURITY_SUSPICIOUS_ACTIVITY = 'security_suspicious_activity',
  SECURITY_BRUTE_FORCE_ATTEMPT = 'security_brute_force_attempt',
  SECURITY_SESSION_HIJACK_ATTEMPT = 'security_session_hijack_attempt',
  SECURITY_INVALID_TOKEN = 'security_invalid_token',

  // System events
  SYSTEM_ERROR = 'system_error',
  SYSTEM_PERFORMANCE_ISSUE = 'system_performance_issue',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_BACKUP_COMPLETED = 'system_backup_completed',

  // Configuration events
  CONFIG_CHANGED = 'config_changed',
  FEATURE_ENABLED = 'feature_enabled',
  FEATURE_DISABLED = 'feature_disabled',

  // Privacy events
  PRIVACY_CONSENT_GRANTED = 'privacy_consent_granted',
  PRIVACY_CONSENT_REVOKED = 'privacy_consent_revoked',
  PRIVACY_DATA_REQUEST = 'privacy_data_request',
  PRIVACY_DATA_DELETION = 'privacy_data_deletion',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  resource?: string;
  resourceId?: string;
  action?: string;
  outcome: 'success' | 'failure' | 'warning';
  details: Record<string, any>;
  tags?: string[];
  correlationId?: string;
  source: string;
  environment: string;
}

export interface AuditEventFilter {
  userId?: string;
  eventType?: AuditEventType | AuditEventType[];
  severity?: AuditSeverity | AuditSeverity[];
  startDate?: Date;
  endDate?: Date;
  resource?: string;
  outcome?: 'success' | 'failure' | 'warning';
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface AuditEventProcessor {
  process(event: AuditEvent): Promise<void>;
}

export interface AuditEventStorage {
  store(event: AuditEvent): Promise<void>;
  query(filter: AuditEventFilter): Promise<{ events: AuditEvent[]; totalCount: number }>;
  delete(eventId: string): Promise<boolean>;
  archive(beforeDate: Date): Promise<number>;
  getStats(filter?: AuditEventFilter): Promise<Record<string, any>>;
}

/**
 * Audit Logger Main Class
 */
export class AuditLogger {
  private processors: AuditEventProcessor[] = [];
  private storage: AuditEventStorage;
  private correlationId: string | null = null;

  constructor(storage: AuditEventStorage) {
    this.storage = storage;
  }

  /**
   * Add event processor
   */
  addProcessor(processor: AuditEventProcessor): void {
    this.processors.push(processor);
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * Clear correlation ID
   */
  clearCorrelationId(): void {
    this.correlationId = null;
  }

  /**
   * Log audit event
   */
  async log(
    event: Omit<AuditEvent, 'id' | 'timestamp' | 'correlationId' | 'environment'>
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      correlationId: this.correlationId || undefined,
      environment: process.env.NODE_ENV || 'development',
      ...event,
    };

    try {
      // Store event
      await this.storage.store(auditEvent);

      // Process event through all processors
      await Promise.all(
        this.processors.map((processor) =>
          processor.process(auditEvent).catch((error) => {
            console.error('Audit processor failed:', error);
          })
        )
      );

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT] ${auditEvent.type}`, auditEvent);
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw errors to prevent breaking the main application flow
    }
  }

  /**
   * Convenience methods for common events
   */
  async logAuthSuccess(userId: string, details: Record<string, any> = {}): Promise<void> {
    await this.log({
      type: AuditEventType.AUTH_LOGIN_SUCCESS,
      severity: AuditSeverity.LOW,
      userId,
      outcome: 'success',
      source: 'web',
      details: { ...details, timestamp: new Date().toISOString() },
      tags: ['authentication', 'success'],
    });
  }

  async logAuthFailure(email: string, details: Record<string, any> = {}): Promise<void> {
    await this.log({
      type: AuditEventType.AUTH_LOGIN_FAILED,
      severity: AuditSeverity.MEDIUM,
      source: 'web',
      details: { email, ...details, timestamp: new Date().toISOString() },
      outcome: 'failure',
      tags: ['authentication', 'failure'],
    });
  }

  async logDataAccess(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    outcome: 'success' | 'failure' = 'success',
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log({
      type: AuditEventType.DATA_READ,
      severity: AuditSeverity.LOW,
      userId,
      action,
      resource,
      resourceId,
      outcome,
      details: { ...details, timestamp: new Date().toISOString() },
      tags: ['data', 'access'],
    });
  }

  async logFinancialOperation(
    userId: string,
    type: AuditEventType,
    amount?: number,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log({
      type,
      severity: amount && amount > 10000 ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      userId,
      outcome: 'success',
      details: { amount, ...details, timestamp: new Date().toISOString() },
      tags: ['financial', 'transaction'],
    });
  }

  async logSecurityEvent(
    type: AuditEventType,
    severity: AuditSeverity,
    details: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.log({
      type,
      severity,
      userId,
      outcome: 'warning',
      details: { ...details, timestamp: new Date().toISOString() },
      tags: ['security', 'alert'],
    });
  }

  async logSystemEvent(
    type: AuditEventType,
    severity: AuditSeverity,
    details: Record<string, any>
  ): Promise<void> {
    await this.log({
      type,
      severity,
      outcome: 'success',
      details: { ...details, timestamp: new Date().toISOString() },
      tags: ['system'],
      source: 'system',
    });
  }

  /**
   * Query audit events
   */
  async query(filter: AuditEventFilter): Promise<{ events: AuditEvent[]; totalCount: number }> {
    try {
      return await this.storage.query(filter);
    } catch (error) {
      console.error('Failed to query audit events:', error);
      return { events: [], totalCount: 0 };
    }
  }

  /**
   * Get audit statistics
   */
  async getStats(filter?: AuditEventFilter): Promise<Record<string, any>> {
    try {
      return await this.storage.getStats(filter);
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      return {};
    }
  }

  /**
   * Archive old events
   */
  async archive(beforeDate: Date): Promise<number> {
    try {
      const archivedCount = await this.storage.archive(beforeDate);
      await this.logSystemEvent(AuditEventType.SYSTEM_MAINTENANCE, AuditSeverity.LOW, {
        action: 'archive_audit_events',
        archivedCount,
        beforeDate: beforeDate.toISOString(),
      });
      return archivedCount;
    } catch (error) {
      console.error('Failed to archive audit events:', error);
      return 0;
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * In-memory audit storage implementation (for development)
 */
export class InMemoryAuditStorage implements AuditEventStorage {
  private events: AuditEvent[] = [];
  private maxEvents: number = 10000;

  constructor(maxEvents: number = 10000) {
    this.maxEvents = maxEvents;
  }

  async store(event: AuditEvent): Promise<void> {
    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  async query(filter: AuditEventFilter): Promise<{ events: AuditEvent[]; totalCount: number }> {
    let filteredEvents = [...this.events];

    // Apply filters
    if (filter.userId) {
      filteredEvents = filteredEvents.filter((e) => e.userId === filter.userId);
    }

    if (filter.eventType) {
      const types = Array.isArray(filter.eventType) ? filter.eventType : [filter.eventType];
      filteredEvents = filteredEvents.filter((e) => types.includes(e.type));
    }

    if (filter.severity) {
      const severities = Array.isArray(filter.severity) ? filter.severity : [filter.severity];
      filteredEvents = filteredEvents.filter((e) => severities.includes(e.severity));
    }

    if (filter.startDate) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp <= filter.endDate!);
    }

    if (filter.resource) {
      filteredEvents = filteredEvents.filter((e) => e.resource === filter.resource);
    }

    if (filter.outcome) {
      filteredEvents = filteredEvents.filter((e) => e.outcome === filter.outcome);
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredEvents = filteredEvents.filter((e) =>
        filter.tags!.some((tag) => e.tags?.includes(tag))
      );
    }

    // Sort by timestamp descending
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const totalCount = filteredEvents.length;

    // Apply pagination
    if (filter.offset) {
      filteredEvents = filteredEvents.slice(filter.offset);
    }

    if (filter.limit) {
      filteredEvents = filteredEvents.slice(0, filter.limit);
    }

    return {
      events: filteredEvents,
      totalCount,
    };
  }

  async delete(eventId: string): Promise<boolean> {
    const index = this.events.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      this.events.splice(index, 1);
      return true;
    }
    return false;
  }

  async archive(beforeDate: Date): Promise<number> {
    const beforeCount = this.events.length;
    this.events = this.events.filter((e) => e.timestamp >= beforeDate);
    return beforeCount - this.events.length;
  }

  async getStats(filter?: AuditEventFilter): Promise<Record<string, any>> {
    const events = filter ? (await this.query(filter)).events : this.events;

    return {
      totalEvents: events.length,
      eventsByType: events.reduce(
        (acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      eventsBySeverity: events.reduce(
        (acc, event) => {
          acc[event.severity] = (acc[event.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      eventsByOutcome: events.reduce(
        (acc, event) => {
          acc[event.outcome] = (acc[event.outcome] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentEvents: events.filter(
        (e) => Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
      ).length,
    };
  }
}

/**
 * Supabase audit storage implementation (for production)
 */
export class SupabaseAuditStorage implements AuditEventStorage {
  constructor(private supabase: any) {}

  async store(event: AuditEvent): Promise<void> {
    const { error } = await this.supabase.from('audit_events').insert({
      id: event.id,
      type: event.type,
      severity: event.severity,
      user_id: event.userId,
      session_id: event.sessionId,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      timestamp: event.timestamp.toISOString(),
      resource: event.resource,
      resource_id: event.resourceId,
      action: event.action,
      outcome: event.outcome,
      details: event.details,
      tags: event.tags,
      correlation_id: event.correlationId,
      source: event.source,
      environment: event.environment,
    });

    if (error) {
      throw new Error(`Failed to store audit event: ${error.message}`);
    }
  }

  async query(filter: AuditEventFilter): Promise<{ events: AuditEvent[]; totalCount: number }> {
    let query = this.supabase.from('audit_events').select('*', { count: 'exact' });

    // Apply filters
    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }

    if (filter.eventType) {
      if (Array.isArray(filter.eventType)) {
        query = query.in('type', filter.eventType);
      } else {
        query = query.eq('type', filter.eventType);
      }
    }

    if (filter.severity) {
      if (Array.isArray(filter.severity)) {
        query = query.in('severity', filter.severity);
      } else {
        query = query.eq('severity', filter.severity);
      }
    }

    if (filter.startDate) {
      query = query.gte('timestamp', filter.startDate.toISOString());
    }

    if (filter.endDate) {
      query = query.lte('timestamp', filter.endDate.toISOString());
    }

    if (filter.resource) {
      query = query.eq('resource', filter.resource);
    }

    if (filter.outcome) {
      query = query.eq('outcome', filter.outcome);
    }

    // Order and pagination
    query = query.order('timestamp', { ascending: false });

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
    } else if (filter.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to query audit events: ${error.message}`);
    }

    const events = (data || []).map(this.mapDbEventToAuditEvent);

    return {
      events,
      totalCount: count || 0,
    };
  }

  async delete(eventId: string): Promise<boolean> {
    const { error } = await this.supabase.from('audit_events').delete().eq('id', eventId);

    return !error;
  }

  async archive(beforeDate: Date): Promise<number> {
    // Move events to archive table
    const { error } = await this.supabase.rpc('archive_audit_events', {
      before_date: beforeDate.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to archive audit events: ${error.message}`);
    }

    return 0; // RPC should return count
  }

  async getStats(_filter?: AuditEventFilter): Promise<Record<string, any>> {
    // This would typically use database aggregation functions
    // For now, return basic stats
    return {};
  }

  private mapDbEventToAuditEvent(dbEvent: any): AuditEvent {
    return {
      id: dbEvent.id,
      type: dbEvent.type,
      severity: dbEvent.severity,
      userId: dbEvent.user_id,
      sessionId: dbEvent.session_id,
      ipAddress: dbEvent.ip_address,
      userAgent: dbEvent.user_agent,
      timestamp: new Date(dbEvent.timestamp),
      resource: dbEvent.resource,
      resourceId: dbEvent.resource_id,
      action: dbEvent.action,
      outcome: dbEvent.outcome,
      details: dbEvent.details,
      tags: dbEvent.tags,
      correlationId: dbEvent.correlation_id,
      source: dbEvent.source,
      environment: dbEvent.environment,
    };
  }
}

/**
 * Global audit logger instance
 */
export const auditLogger = new AuditLogger(
  process.env.NODE_ENV === 'production'
    ? new SupabaseAuditStorage(require('@/integrations/supabase/client').supabase)
    : new InMemoryAuditStorage()
);
