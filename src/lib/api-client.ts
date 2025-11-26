/**
 * API Client for Hono RPC endpoints
 * Provides type-safe fetch wrapper with authentication and error handling
 */

import { supabase } from '@/integrations/supabase/client';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to current origin
    this.baseUrl =
      import.meta.env.VITE_API_URL ||
      `${typeof window !== 'undefined' ? window.location.origin : ''}/api`;
  }

  /**
   * Get authentication headers for API requests
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorDetails: Record<string, unknown> = {};
      let errorCode: string | undefined;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorCode = errorData.code;
          errorDetails = errorData.details || {};
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
      } else {
        errorMessage = (await response.text()) || errorMessage;
      }

      if (import.meta.env.DEV) {
        console.error(`[API] Error ${response.status}:`, errorMessage, errorDetails);
      }

      const error: ApiError = new Error(errorMessage);
      error.status = response.status;
      error.code = errorCode;
      error.details = errorDetails;

      throw error;
    }

    if (isJson) {
      return response.json();
    }

    // For non-JSON responses (like file downloads)
    return response as unknown as T;
  }

  /**
   * Make a GET request with optional query parameters
   */
  async get<T = unknown>(url: string, options?: { params?: Record<string, unknown> }): Promise<T> {
    const baseFullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    // Build query string from params, filtering out undefined/null values
    let finalUrl = baseFullUrl;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl = `${baseFullUrl}${baseFullUrl.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const headers = await this.getHeaders();

    const response = await fetch(finalUrl, {
      headers,
      method: 'GET',
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const headers = await this.getHeaders();

    if (import.meta.env.DEV) {
      console.log(`[API] POST ${fullUrl}`, { data });
    }

    const response = await fetch(fullUrl, {
      body: data ? JSON.stringify(data) : undefined,
      headers,
      method: 'POST',
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(url: string, data?: unknown): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const headers = await this.getHeaders();

    const response = await fetch(fullUrl, {
      body: data ? JSON.stringify(data) : undefined,
      headers,
      method: 'PUT',
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a PATCH request
   */
  async patch<T = unknown>(url: string, data?: unknown): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const headers = await this.getHeaders();

    const response = await fetch(fullUrl, {
      body: data ? JSON.stringify(data) : undefined,
      headers,
      method: 'PATCH',
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(url: string): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const headers = await this.getHeaders();

    const response = await fetch(fullUrl, {
      headers,
      method: 'DELETE',
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload a file
   */
  async upload<T = unknown>(
    url: string,
    file: File,
    additionalData?: Record<string, unknown>
  ): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(fullUrl, {
      body: formData,
      headers,
      method: 'POST',
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Download a file
   */
  async download(url: string, filename?: string): Promise<void> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const headers = await this.getHeaders();

    const response = await fetch(fullUrl, {
      headers,
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types for use with React Query
export type { ApiResponse, ApiError };
