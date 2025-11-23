/**
 * Web Push Provider - Story 01.04
 *
 * Web Push notification system for authentication and security alerts
 * VAPID authentication with LGPD compliance
 */

import { supabase } from '@/integrations/supabase/client';

export interface PushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
  gcmApiKey?: string;
  ttl: number;
  urgency: 'very-low' | 'low' | 'normal' | 'high';
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushMessage {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  url?: string;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  processingTime: number;
}

export interface AuthPushRequest {
  id: string;
  userId: string;
  pushToken: string;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  createdAt: Date;
  respondedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Web Push Provider Service
 */
export class PushProvider {
  private config: PushConfig;
  private subscriptions: Map<string, PushSubscription> = new Map();

  constructor(config: PushConfig) {
    this.config = config;
    this.initializeServiceWorker();
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const _registration = await navigator.serviceWorker.register('/sw.js');
    } catch (_error) {}
  }

  /**
   * Convert base64 URL to Uint8Array
   */
  private base64UrlToUint8Array(base64UrlData: string): Uint8Array {
    const padding = '='.repeat((4 - (base64UrlData.length % 4)) % 4);
    const base64 = (base64UrlData + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const buffer = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      buffer[i] = rawData.charCodeAt(i);
    }
    return buffer;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      applicationServerKey: this.base64UrlToUint8Array(this.config.vapidPublicKey),
      userVisibleOnly: true,
    });

    // Store subscription in database
    await supabase.from('push_subscriptions').upsert({
      auth_key: subscription.keys.auth,
      created_at: new Date().toISOString(),
      endpoint: subscription.endpoint,
      is_active: true,
      p256dh_key: subscription.keys.p256dh,
      updated_at: new Date().toISOString(),
      user_id: userId,
    });

    this.subscriptions.set(userId, subscription);
    return subscription;
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      const subscription = this.subscriptions.get(userId);
      if (subscription) {
        await subscription.unsubscribe();
        this.subscriptions.delete(userId);
      }

      // Deactivate in database
      await supabase.from('push_subscriptions').update({ is_active: false }).eq('user_id', userId);

      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get user's subscription
   */
  async getUserSubscription(userId: string): Promise<PushSubscription | null> {
    // Check in-memory cache first
    if (this.subscriptions.has(userId)) {
      return this.subscriptions.get(userId) as PushSubscription;
    }

    // Fetch from database
    const { data } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (data) {
      const subscription: PushSubscription = {
        endpoint: data.endpoint,
        keys: {
          auth: data.auth_key,
          p256dh: data.p256dh_key,
        },
      };
      this.subscriptions.set(userId, subscription);
      return subscription;
    }

    return null;
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId: string, message: PushMessage): Promise<PushResult> {
    const startTime = Date.now();

    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return {
          error: 'No active push subscription found',
          processingTime: Date.now() - startTime,
          success: false,
        };
      }

      // Prepare payload
      const payload = JSON.stringify({
        actions: message.actions,
        badge: message.badge || '/badge-72x72.png',
        body: message.body,
        data: {
          ...message.data,
          url: message.url || '/',
          timestamp: Date.now(),
        },
        icon: message.icon || '/icon-192x192.png',
        image: message.image,
        requireInteraction: message.requireInteraction || false,
        silent: message.silent || false,
        tag: message.tag,
        title: message.title,
      });

      // Send via backend API
      const response = await fetch('/api/push/send', {
        body: JSON.stringify({
          options: {
            ttl: this.config.ttl,
            urgency: this.config.urgency,
            vapidDetails: {
              subject: this.config.vapidSubject,
              publicKey: this.config.vapidPublicKey,
              privateKey: this.config.vapidPrivateKey,
            },
          },
          payload,
          subscription,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Push notification failed');
      }

      const data = await response.json();

      // Log push notification
      await this.logPushNotification(userId, message, data.messageId, 'sent');

      return {
        messageId: data.messageId,
        processingTime: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed push notification
      await this.logPushNotification(userId, message, undefined, 'failed', errorMessage);

      return {
        error: errorMessage,
        processingTime: Date.now() - startTime,
        success: false,
      };
    }
  }

  /**
   * Log push notification to database for LGPD compliance
   */
  private async logPushNotification(
    userId: string,
    message: PushMessage,
    messageId?: string,
    status: 'sent' | 'failed' | 'delivered' = 'sent',
    error?: string
  ): Promise<void> {
    try {
      await supabase.from('push_logs').insert({
        created_at: new Date().toISOString(),
        data: message.data,
        error,
        message_body: message.body,
        message_id: messageId,
        message_title: message.title,
        status,
        tag: message.tag,
        user_id: userId,
      });
    } catch (_logError) {}
  }

  /**
   * Create authentication push request
   */
  async createAuthPushRequest(userId: string): Promise<AuthPushRequest> {
    const pushToken = this.generateSecureToken(16);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const request: AuthPushRequest = {
      createdAt: new Date(),
      expiresAt,
      id: this.generateSecureToken(8),
      pushToken,
      status: 'pending',
      userId,
    };

    // Store in database
    await supabase.from('push_auth_requests').insert({
      created_at: request.createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      id: request.id,
      push_token: pushToken,
      status: 'pending',
      user_id: userId,
    });

    return request;
  }

  /**
   * Send authentication push notification
   */
  async sendAuthPush(userId: string, phoneNumber: string): Promise<PushResult> {
    try {
      const authRequest = await this.createAuthPushRequest(userId);

      const message: PushMessage = {
        actions: [
          {
            action: 'approve',
            icon: '/icons/checkmark.png',
            title: 'Aprovar',
          },
          {
            action: 'deny',
            icon: '/icons/close.png',
            title: 'Negar',
          },
        ],
        badge: '/badge-72x72.png',
        body: 'Nova tentativa de login detectada. Aprove ou negue para continuar.',
        data: {
          phoneNumber,
          requestId: authRequest.id,
          type: 'auth-request',
        },
        icon: '/icon-192x192.png',
        requireInteraction: true,
        tag: 'auth-request',
        title: 'AegisWallet - Aprovação de Login',
      };

      return this.sendPushNotification(userId, message);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: 0,
        success: false,
      };
    }
  }

  /**
   * Handle push notification response
   */
  async handlePushResponse(requestId: string, approved: boolean, userId: string): Promise<void> {
    try {
      // Update request status
      await supabase
        .from('push_auth_requests')
        .update({
          responded_at: new Date().toISOString(),
          status: approved ? 'approved' : 'denied',
        })
        .eq('id', requestId);

      // Log response
      await this.logPushNotification(
        userId,
        {
          body: `Authentication ${approved ? 'approved' : 'denied'}`,
          data: { approved, requestId },
          title: 'Auth Response',
        },
        undefined,
        'delivered'
      );
    } catch (_error) {}
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);

    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomValues);
    } else {
      for (let i = 0; i < length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
    }

    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }

    return result;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PushConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PushConfig {
    return { ...this.config };
  }

  /**
   * Clean up expired push requests
   */
  async cleanupExpiredRequests(): Promise<void> {
    try {
      await supabase
        .from('push_auth_requests')
        .update({ status: 'expired' })
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'pending');
    } catch (_error) {}
  }
}

/**
 * Create push provider instance
 */
export function createPushProvider(config: PushConfig): PushProvider {
  return new PushProvider(config);
}

/**
 * Quick auth push function
 */
export async function sendAuthPushNotification(
  userId: string,
  phoneNumber: string,
  config: PushConfig
): Promise<PushResult> {
  const provider = createPushProvider(config);
  return provider.sendAuthPush(userId, phoneNumber);
}
