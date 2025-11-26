/**
 * Cron Job: Google Calendar Channel Renewal
 * Schedule: Daily at midnight (0 0 * * *)
 * Purpose: Renew webhook channels that are expiring within 24 hours
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30,
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: any, res: any) {
  // Only allow GET requests (Vercel cron uses GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret in production
  const cronSecret = req.headers['x-vercel-cron-secret'];
  if (process.env.VERCEL && process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Find channels expiring within 24 hours
    const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringChannels, error: fetchError } = await supabase
      .from('calendar_sync_settings')
      .select('user_id, google_channel_id, channel_expiry_at')
      .not('google_channel_id', 'is', null)
      .lt('channel_expiry_at', expiryThreshold)
      .eq('sync_enabled', true);

    if (fetchError) {
      console.error('Error fetching expiring channels:', fetchError);
      return res.status(500).json({ error: 'Database error', details: fetchError.message });
    }

    if (!expiringChannels || expiringChannels.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No channels need renewal',
        renewed: 0,
      });
    }

    let renewed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Renew each expiring channel
    for (const channel of expiringChannels) {
      try {
        // Call the edge function to renew the channel
        const renewResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/google-calendar-auth?action=renew_channel`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'x-user-id': channel.user_id,
            },
          }
        );

        if (renewResponse.ok) {
          renewed++;

          // Log success
          await supabase.from('calendar_sync_audit').insert({
            user_id: channel.user_id,
            action: 'channel_renewed',
            details: {
              message: 'Channel renewed by cron job',
              old_expiry: channel.channel_expiry_at,
            },
          });
        } else {
          failed++;
          const errorText = await renewResponse.text();
          errors.push(`User ${channel.user_id}: ${errorText}`);
        }
      } catch (err) {
        failed++;
        errors.push(`User ${channel.user_id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Channel renewal complete`,
      renewed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Channel renewal cron error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

