/**
 * Google Calendar Environment Variables Extension
 *
 * Add these to your existing src/env.ts file inside the
 * server section of createEnv()
 *
 * @file src/env.ts (extension)
 */

// Add to the 'server' object in createEnv():

// Google Calendar OAuth 2.0
GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
GOOGLE_REDIRECT_URI: z.string().url('Google Redirect URI must be a valid URL'),

// Application URL (for webhooks)
APP_URL: z.string().url().optional().default(
  process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
),

// Cron job authentication
CRON_SECRET: z.string().min(32, 'Cron secret must be at least 32 characters'),


// =====================================================
// FULL EXAMPLE - src/env.ts
// =====================================================

/*
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // ... existing variables ...
    
    // Google Calendar OAuth 2.0
    GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
    GOOGLE_REDIRECT_URI: z.string().url('Google Redirect URI must be a valid URL'),
    
    // Application URL (for webhooks)
    APP_URL: z.string().url().optional().default(
      process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000'
    ),
    
    // Cron job authentication
    CRON_SECRET: z.string().min(32, 'Cron secret must be at least 32 characters'),
    
    // ... other variables ...
  },
  
  client: {
    // ... client variables ...
  },
  
  runtimeEnv: {
    // ... existing runtime env ...
    
    // Google Calendar
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    APP_URL: process.env.APP_URL,
    CRON_SECRET: process.env.CRON_SECRET,
  },
});
*/
