/**
 * Security Headers and CORS Middleware
 * Implements comprehensive security headers for Brazilian financial applications
 *
 * Features:
 * - OWASP recommended security headers
 * - Content Security Policy (CSP)
 * - CORS configuration for financial APIs
 * - HSTS for HTTPS enforcement
 * - XSS and clickjacking protection
 * - LGPD compliance headers
 */

export interface SecurityConfig {
  // CORS configuration
  cors: {
    origin: string | string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
  };

  // Content Security Policy
  csp: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    mediaSrc: string[];
    frameSrc: string[];
    childSrc: string[];
    workerSrc: string[];
    manifestSrc: string[];
    upgradeInsecureRequests: boolean;
  };

  // Security headers
  security: {
    hsts: {
      enabled: boolean;
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
    xFrameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    xContentTypeOptions: boolean;
    xXssProtection: boolean;
    referrerPolicy: string;
    permissionsPolicy: Record<string, string[]>;
  };

  // LGPD compliance
  lgpd: {
    privacyPolicyUrl: string;
    cookieConsent: boolean;
    dataProcessingDetails: string;
  };
}

/**
 * Default security configuration for production financial applications
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  cors: {
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Client-Version',
      'X-Request-ID',
    ],
    credentials: true,
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    origin: [
      'https://aegiswallet.com',
      'https://www.aegiswallet.com',
      'https://app.aegiswallet.com',
    ], // 24 hours
  },
  csp: {
    childSrc: ["'self'"],
    connectSrc: [
      "'self'",
      'https://api.openai.com',
      'https://api.anthropic.com',
      'https://api.openrouter.ai',
      'https://ownkoxryswokcdanrdgj.supabase.co', // Replace with env var in production
      'wss://ownkoxryswokcdanrdgj.supabase.co', // WebSocket connections
    ],
    defaultSrc: ["'self'"],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
    frameSrc: ["'none'"],
    imgSrc: [
      "'self'",
      'data:',
      'https:',
      'https://avatars.githubusercontent.com',
      'https://ui-avatars.com',
    ],
    manifestSrc: ["'self'"],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Temporary for development, remove in production
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://js.stripe.com', // For future payment integration
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
    ],
    upgradeInsecureRequests: true,
    workerSrc: ["'self'", 'blob:'],
  },
  lgpd: {
    cookieConsent: true,
    dataProcessingDetails: 'Financial data processing for account management',
    privacyPolicyUrl: 'https://aegiswallet.com/privacy-policy',
  },
  security: {
    hsts: {
      enabled: true,
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    permissionsPolicy: {
      camera: ['self'],
      microphone: ['self'], // For voice commands
      geolocation: ['self'],
      payment: ['self'], // For future payment integration
      usb: ['none'],
      magnetometer: ['none'],
      gyroscope: ['none'],
      accelerometer: ['none'],
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    xContentTypeOptions: true,
    xFrameOptions: 'DENY',
    xXssProtection: true,
  },
};

/**
 * Development security configuration (more relaxed)
 */
export const DEVELOPMENT_SECURITY_CONFIG: SecurityConfig = {
  ...DEFAULT_SECURITY_CONFIG,
  cors: {
    ...DEFAULT_SECURITY_CONFIG.cors,
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ],
  },
  csp: {
    ...DEFAULT_SECURITY_CONFIG.csp,
    scriptSrc: [
      ...DEFAULT_SECURITY_CONFIG.csp.scriptSrc,
      "'unsafe-eval'", // For development only
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    connectSrc: [
      ...DEFAULT_SECURITY_CONFIG.csp.connectSrc,
      'ws://localhost:3000',
      'ws://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    upgradeInsecureRequests: false, // Disabled for HTTP development
  },
  security: {
    ...DEFAULT_SECURITY_CONFIG.security,
    hsts: {
      ...DEFAULT_SECURITY_CONFIG.security.hsts,
      enabled: false, // Disabled for HTTP development
    },
  },
};

/**
 * Generate Content Security Policy header value
 */
export function generateCSPHeader(config: SecurityConfig['csp']): string {
  const directives: string[] = [];

  const addDirective = (name: string, sources: string[]) => {
    if (sources.length > 0) {
      directives.push(`${name} ${sources.join(' ')}`);
    }
  };

  addDirective('default-src', config.defaultSrc);
  addDirective('script-src', config.scriptSrc);
  addDirective('style-src', config.styleSrc);
  addDirective('img-src', config.imgSrc);
  addDirective('connect-src', config.connectSrc);
  addDirective('font-src', config.fontSrc);
  addDirective('object-src', config.objectSrc);
  addDirective('media-src', config.mediaSrc);
  addDirective('frame-src', config.frameSrc);
  addDirective('child-src', config.childSrc);
  addDirective('worker-src', config.workerSrc);
  addDirective('manifest-src', config.manifestSrc);

  if (config.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/**
 * Generate security headers object
 */
export function generateSecurityHeaders(
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Content Security Policy
  headers['Content-Security-Policy'] = generateCSPHeader(config.csp);

  // HSTS (HTTPS Strict Transport Security)
  if (config.security.hsts.enabled) {
    const hstsParts = [
      `max-age=${config.security.hsts.maxAge}`,
      config.security.hsts.includeSubDomains ? 'includeSubDomains' : '',
      config.security.hsts.preload ? 'preload' : '',
    ].filter(Boolean);

    headers['Strict-Transport-Security'] = hstsParts.join('; ');
  }

  // Frame protection
  headers['X-Frame-Options'] = config.security.xFrameOptions;

  // MIME type sniffing protection
  if (config.security.xContentTypeOptions) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }

  // XSS protection
  if (config.security.xXssProtection) {
    headers['X-XSS-Protection'] = '1; mode=block';
  }

  // Referrer policy
  headers['Referrer-Policy'] = config.security.referrerPolicy;

  // Permissions policy
  const permissionsPolicy = Object.entries(config.security.permissionsPolicy)
    .filter(([_, permissions]) => permissions.length > 0)
    .map(([feature, permissions]) => `${feature}=(${permissions.join(', ')})`)
    .join(', ');

  if (permissionsPolicy) {
    headers['Permissions-Policy'] = permissionsPolicy;
  }

  // LGPD compliance headers
  headers['X-Privacy-Policy'] = config.lgpd.privacyPolicyUrl;
  headers['X-Data-Processing'] = config.lgpd.dataProcessingDetails;

  if (config.lgpd.cookieConsent) {
    headers['X-Cookie-Consent'] = 'required';
  }

  // Remove some headers for development
  if (process.env.NODE_ENV === 'development') {
    headers['Strict-Transport-Security'] = undefined;
  }

  return headers;
}

interface ResponseWithHeader {
  setHeader: (key: string, value: string) => void;
}

/**
 * Express/Node.js middleware function for security headers
 */
export function securityHeadersMiddleware(config?: SecurityConfig) {
  const securityConfig =
    config ||
    (process.env.NODE_ENV === 'development'
      ? DEVELOPMENT_SECURITY_CONFIG
      : DEFAULT_SECURITY_CONFIG);

  return (_req: unknown, res: ResponseWithHeader, next: () => void) => {
    const headers = generateSecurityHeaders(securityConfig);

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Add security audit headers
    res.setHeader('X-Security-Audit', 'true');
    res.setHeader('X-Content-Security-Policy-Version', '1.0');

    next();
  };
}

/**
 * CORS middleware function
 */
export function corsMiddleware(config?: SecurityConfig['cors']) {
  const corsConfig = config || DEFAULT_SECURITY_CONFIG.cors;

  return (
    req: { headers: { origin?: string }; method: string },
    res: {
      setHeader: (key: string, value: string) => void;
      status: (code: number) => { end: () => void };
    },
    next: () => void
  ) => {
    const origin = req.headers.origin;

    // Check if origin is allowed
    const isAllowedOrigin = Array.isArray(corsConfig.origin)
      ? corsConfig.origin.includes(origin || '')
      : corsConfig.origin === origin || corsConfig.origin === '*';

    if (isAllowedOrigin || corsConfig.origin === '*') {
      if (corsConfig.origin !== '*') {
        res.setHeader('Access-Control-Allow-Origin', origin || '');
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    }

    // Set other CORS headers
    if (corsConfig.credentials && corsConfig.origin !== '*') {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));

    if (corsConfig.exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
    }

    res.setHeader('Access-Control-Max-Age', corsConfig.maxAge.toString());

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  };
}

/**
 * Combined security and CORS middleware
 */
export function securityMiddleware(config?: SecurityConfig) {
  const securityConfig =
    config ||
    (process.env.NODE_ENV === 'development'
      ? DEVELOPMENT_SECURITY_CONFIG
      : DEFAULT_SECURITY_CONFIG);

  return [corsMiddleware(securityConfig.cors), securityHeadersMiddleware(securityConfig)];
}

/**
 * Hono middleware for security (if using Hono framework)
 */
export function createHonoSecurityMiddleware(config?: SecurityConfig) {
  const securityConfig =
    config ||
    (process.env.NODE_ENV === 'development'
      ? DEVELOPMENT_SECURITY_CONFIG
      : DEFAULT_SECURITY_CONFIG);

  const headers = generateSecurityHeaders(securityConfig);

  return async (
    c: {
      header: (key: string, value: string) => void;
      req: { header: (key: string) => string | undefined; method: string };
      text: (body: string, status: number) => void;
    },
    next: () => Promise<void>
  ) => {
    Object.entries(headers).forEach(([key, value]) => {
      c.header(key, value);
    });

    // Add security audit headers
    c.header('X-Security-Audit', 'true');
    c.header('X-Content-Security-Policy-Version', '1.0');

    // Handle CORS
    const origin = c.req.header('origin');
    if (origin) {
      const isAllowedOrigin = Array.isArray(securityConfig.cors.origin)
        ? securityConfig.cors.origin.includes(origin)
        : securityConfig.cors.origin === origin || securityConfig.cors.origin === '*';

      if (isAllowedOrigin || securityConfig.cors.origin === '*') {
        if (securityConfig.cors.origin !== '*') {
          c.header('Access-Control-Allow-Origin', origin);
        } else {
          c.header('Access-Control-Allow-Origin', '*');
        }
      }

      if (c.req.method === 'OPTIONS') {
        c.header('Access-Control-Allow-Methods', securityConfig.cors.methods.join(', '));
        c.header('Access-Control-Allow-Headers', securityConfig.cors.allowedHeaders.join(', '));
        c.header('Access-Control-Max-Age', securityConfig.cors.maxAge.toString());
        return c.text('', 200);
      }
    }

    await next();
  };
}

export default {
  DEFAULT_SECURITY_CONFIG,
  DEVELOPMENT_SECURITY_CONFIG,
  corsMiddleware,
  createHonoSecurityMiddleware,
  generateCSPHeader,
  generateSecurityHeaders,
  securityHeadersMiddleware,
  securityMiddleware,
};
