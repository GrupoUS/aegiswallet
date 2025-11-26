/**
 * Google Calendar Channel Renewal Cron Job
 *
 * This script automatically renews expiring webhook channels to maintain
 * real-time sync with Google Calendar. Should be run daily via cron.
 *
 * Usage:
 *   bun scripts/channel-renewal-cron.ts
 *
 * Environment Variables:
 *   - SUPABASE_URL: Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin operations
 */

import { createClient } from '@supabase/supabase-js';

const RENEWAL_THRESHOLD_HOURS = 24;

async function renewExpiringChannels() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`[${new Date().toISOString()}] Starting channel renewal check...`);

  try {
    // Calculate threshold date (24 hours from now)
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() + RENEWAL_THRESHOLD_HOURS);

    // Query channels expiring within threshold
    const { data: expiringChannels, error: queryError } = await supabase
      .from('calendar_sync_settings')
      .select('user_id, google_channel_id, google_resource_id, channel_expiry_at')
      .not('channel_expiry_at', 'is', null)
      .lt('channel_expiry_at', thresholdDate.toISOString())
      .eq('sync_enabled', true);

    if (queryError) {
      throw new Error(`Failed to query expiring channels: ${queryError.message}`);
    }

    if (!expiringChannels || expiringChannels.length === 0) {
      console.log('No channels need renewal');
      return;
    }

    console.log(
      `Found ${expiringChannels.length} channel(s) expiring within ${RENEWAL_THRESHOLD_HOURS} hours`
    );

    let renewed = 0;
    let failed = 0;

    // Process each expiring channel
    for (const channel of expiringChannels) {
      try {
        console.log(`Renewing channel for user ${channel.user_id}...`);

        // Get user's auth token
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.admin.getUserById(channel.user_id);

        if (userError || !user) {
          console.error(`Failed to get user ${channel.user_id}:`, userError?.message);
          failed++;
          continue;
        }

        // Create a temporary session for the user
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: user.email!,
        });

        if (sessionError || !sessionData) {
          console.error(
            `Failed to create session for user ${channel.user_id}:`,
            sessionError?.message
          );
          failed++;
          continue;
        }

        // Call Edge Function to renew channel
        const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
          body: { action: 'renew_channel' },
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
        });

        if (error) {
          throw new Error(`Edge Function error: ${error.message}`);
        }

        console.log(`✓ Channel renewed for user ${channel.user_id}`);
        console.log(`  New channel ID: ${data.channel_id}`);
        console.log(`  Expires at: ${data.expiry_at}`);

        renewed++;

        // Audit log
        await supabase.from('calendar_sync_audit').insert({
          user_id: channel.user_id,
          action: 'channel_renewed',
          details: {
            message: 'Channel automatically renewed by cron job',
            old_channel_id: channel.google_channel_id,
            new_channel_id: data.channel_id,
            expiry_at: data.expiry_at,
          },
        });
      } catch (error) {
        console.error(`✗ Failed to renew channel for user ${channel.user_id}:`, error);
        failed++;

        // Log error to audit
        await supabase.from('calendar_sync_audit').insert({
          user_id: channel.user_id,
          action: 'webhook_error',
          details: {
            message: 'Failed to renew channel automatically',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        // Retry up to 3 times
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          retryCount++;
          console.log(`  Retry ${retryCount}/${maxRetries}...`);

          try {
            await new Promise((resolve) => setTimeout(resolve, 2 ** retryCount * 1000));

            const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
              body: { action: 'renew_channel' },
              headers: {
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
            });

            if (!error) {
              console.log(`✓ Channel renewed on retry ${retryCount}`);
              renewed++;
              failed--;
              break;
            }
          } catch (retryError) {
            console.error(`  Retry ${retryCount} failed:`, retryError);
          }
        }

        // If all retries failed, disable sync for this user
        if (retryCount >= maxRetries) {
          console.error(`✗ All retries failed for user ${channel.user_id}, disabling sync`);

          await supabase
            .from('calendar_sync_settings')
            .update({
              sync_enabled: false,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', channel.user_id);

          // TODO: Send notification to user about sync being disabled
        }
      }
    }

    console.log(`\n[${new Date().toISOString()}] Channel renewal complete`);
    console.log(`  Renewed: ${renewed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total: ${expiringChannels.length}`);
  } catch (error) {
    console.error('Fatal error during channel renewal:', error);
    process.exit(1);
  }
}

// Run the renewal process
renewExpiringChannels()
  .then(() => {
    console.log('Channel renewal completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Channel renewal failed:', error);
    process.exit(1);
  });
