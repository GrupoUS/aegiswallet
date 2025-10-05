/**
 * Token Manager - Secure Token Storage
 * Story: 02.01 - Conectores Open Banking
 * 
 * AES-256-GCM encryption for OAuth tokens
 * PBKDF2 key derivation
 * Automatic token rotation
 */

import { supabase } from '@/integrations/supabase/client'

export interface EncryptedToken {
  encrypted: string
  iv: string
  algorithm: string
}

export interface TokenData {
  accessToken: string
  refreshToken?: string
  expiresAt: Date
  refreshExpiresAt?: Date
  scopes: string[]
}

export class TokenManager {
  private masterKey: string

  constructor() {
    this.masterKey = import.meta.env.VITE_ENCRYPTION_MASTER_KEY || 'default-key-change-in-production'
  }

  /**
   * Derive encryption key from master key + user ID
   */
  private async deriveKey(userId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.masterKey + userId),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(userId),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Encrypt token with AES-256-GCM
   */
  async encryptToken(token: string, userId: string): Promise<EncryptedToken> {
    const key = await this.deriveKey(userId)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoder = new TextEncoder()

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(token)
    )

    return {
      encrypted: Buffer.from(encrypted).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      algorithm: 'AES-256-GCM',
    }
  }

  /**
   * Decrypt token
   */
  async decryptToken(encrypted: EncryptedToken, userId: string): Promise<string> {
    const key = await this.deriveKey(userId)
    const decoder = new TextDecoder()

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: Buffer.from(encrypted.iv, 'base64') },
      key,
      Buffer.from(encrypted.encrypted, 'base64')
    )

    return decoder.decode(decrypted)
  }

  /**
   * Store encrypted tokens
   */
  async storeTokens(
    connectionId: string,
    userId: string,
    tokens: TokenData
  ): Promise<void> {
    const encryptedAccess = await this.encryptToken(tokens.accessToken, userId)
    const encryptedRefresh = tokens.refreshToken
      ? await this.encryptToken(tokens.refreshToken, userId)
      : null

    const { error } = await supabase
      .from('bank_tokens')
      .upsert({
        connection_id: connectionId,
        user_id: userId,
        encrypted_access_token: encryptedAccess.encrypted,
        encrypted_refresh_token: encryptedRefresh?.encrypted,
        encryption_iv: encryptedAccess.iv,
        encryption_algorithm: encryptedAccess.algorithm,
        expires_at: tokens.expiresAt.toISOString(),
        refresh_expires_at: tokens.refreshExpiresAt?.toISOString(),
        scopes: tokens.scopes,
      })

    if (error) {
      throw new Error(`Failed to store tokens: ${error.message}`)
    }
  }

  /**
   * Retrieve and decrypt tokens
   */
  async getTokens(connectionId: string, userId: string): Promise<TokenData | null> {
    const { data, error } = await supabase
      .from('bank_tokens')
      .select('*')
      .eq('connection_id', connectionId)
      .single()

    if (error || !data) {
      return null
    }

    const accessToken = await this.decryptToken(
      {
        encrypted: data.encrypted_access_token,
        iv: data.encryption_iv,
        algorithm: data.encryption_algorithm,
      },
      userId
    )

    let refreshToken: string | undefined
    if (data.encrypted_refresh_token) {
      refreshToken = await this.decryptToken(
        {
          encrypted: data.encrypted_refresh_token,
          iv: data.encryption_iv,
          algorithm: data.encryption_algorithm,
        },
        userId
      )
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(data.expires_at),
      refreshExpiresAt: data.refresh_expires_at ? new Date(data.refresh_expires_at) : undefined,
      scopes: data.scopes || [],
    }
  }

  /**
   * Delete tokens
   */
  async deleteTokens(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_tokens')
      .delete()
      .eq('connection_id', connectionId)

    if (error) {
      throw new Error(`Failed to delete tokens: ${error.message}`)
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() >= expiresAt
  }

  /**
   * Check if token needs refresh (1 hour before expiration)
   */
  needsRefresh(expiresAt: Date): boolean {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
    return oneHourFromNow >= expiresAt
  }
}

export function createTokenManager(): TokenManager {
  return new TokenManager()
}
