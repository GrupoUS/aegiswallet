/**
 * Google Calendar Sync Queue Processor
 *
 * This script processes the sync queue to handle asynchronous Google Calendar
 * sync operations. It should be run as a background worker or scheduled job.
 *
 * Usage:
 *   bun scripts/process-sync-queue.ts
 *
 * Environment Variables:
 *   - SUPABASE_URL: Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin operations
 */

import { createClient } from '@supabase/supabase-js';

const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RATE_LIMIT_DELAY_MS = 100; // 10 requests/second to respect Google API limits

async function processSyncQueue() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`[${new Date().toISOString()}] Starting sync queue processing...`);

  try {
    // Query pending items from sync queue
    const { data: pendingItems, error: queryError } = await supabase
      .from('sync_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (queryError) {
      throw new Error(`Failed to query sync queue: ${queryError.message}`);
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('No pending items in sync queue');
      return;
    }

    console.log(`Found ${pendingItems.length} pending item(s) to process`);

    let processed = 0;
    let failed = 0;

    // Process each item
    for (const item of pendingItems) {
      try {
        console.log(`Processing item ${item.id} (${item.sync_direction})...`);

        // Update status to processing
        await supabase
          .from('sync_queue')
          .update({
            status: 'processing',
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        // Get user's auth token
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.admin.getUserById(item.user_id);

        if (userError || !user) {
          throw new Error(`Failed to get user: ${userError?.message}`);
        }

        // Determine action based on sync direction
        const action = item.sync_direction === 'to_google' ? 'sync_to_google' : 'sync_from_google';
        const bodyKey = item.sync_direction === 'to_google' ? 'event_id' : 'google_event_id';

        // Call Edge Function to sync event
        const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
          body: {
            action,
            [bodyKey]: item.event_id,
          },
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
        });

        if (error) {
          throw new Error(`Edge Function error: ${error.message}`);
        }

        if (!data.success) {
          throw new Error(data.reason || 'Sync failed');
        }

        // Update status to completed
        await supabase
          .from('sync_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        console.log(`✓ Item ${item.id} processed successfully`);
        processed++;

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      } catch (error) {
        console.error(`✗ Failed to process item ${item.id}:`, error);

        // Increment retry count
        const newRetryCount = item.retry_count + 1;

        if (newRetryCount >= MAX_RETRIES) {
          // Mark as permanently failed
          await supabase
            .from('sync_queue')
            .update({
              status: 'failed',
              retry_count: newRetryCount,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          console.error(`✗ Item ${item.id} permanently failed after ${MAX_RETRIES} retries`);
          failed++;

          // Log to audit
          await supabase.from('calendar_sync_audit').insert({
            user_id: item.user_id,
            action: 'sync_failed',
            event_id: item.event_id,
            details: {
              message: 'Sync queue item permanently failed',
              sync_direction: item.sync_direction,
              error: error instanceof Error ? error.message : 'Unknown error',
              retry_count: newRetryCount,
            },
          });
        } else {
          // Reset to pending for retry with exponential backoff
          const backoffDelay = 2 ** newRetryCount * 1000;

          await supabase
            .from('sync_queue')
            .update({
              status: 'pending',
              retry_count: newRetryCount,
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', item.id);

          console.log(
            `  Scheduled for retry ${newRetryCount}/${MAX_RETRIES} (backoff: ${backoffDelay}ms)`
          );

          // Wait for backoff period
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }

    console.log(`\n[${new Date().toISOString()}] Sync queue processing complete`);
    console.log(`  Processed: ${processed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total: ${pendingItems.length}`);

    // Clean up old completed/failed items (older than 7 days)
    const { data: cleanupResult, error: cleanupError } = await supabase.rpc(
      'cleanup_old_sync_queue_items'
    );

    if (cleanupError) {
      console.error('Failed to cleanup old items:', cleanupError.message);
    } else {
      console.log(`Cleaned up ${cleanupResult} old sync queue item(s)`);
    }
  } catch (error) {
    console.error('Fatal error during sync queue processing:', error);
    process.exit(1);
  }
}

// Run the queue processor
processSyncQueue()
  .then(() => {
    console.log('Sync queue processing completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Sync queue processing failed:', error);
    process.exit(1);
  });
