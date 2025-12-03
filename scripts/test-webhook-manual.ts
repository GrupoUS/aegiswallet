#!/usr/bin/env tsx
/**
 * Manual Webhook Endpoint Test Script
 *
 * Tests webhook endpoint accessibility and basic functionality
 * Useful for debugging webhook configuration issues
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL ||
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/webhooks/clerk`
    : 'http://localhost:3000/api/webhooks/clerk';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// Test payloads
const TEST_PAYLOADS = {
  valid: {
    object: 'event',
    type: 'user.created',
    data: {
      id: 'user_test123456789',
      email_addresses: [{
        id: 'idn_test123',
        email_address: 'test@example.com',
        verification: {
          status: 'verified',
          strategy: 'ticket'
        }
      }],
      first_name: 'Test',
      last_name: 'User',
      created_at: 1654012591514,
      object: 'user'
    },
    instance_id: 'ins_test123',
    timestamp: 1654012591835
  },
  invalidSignature: {
    object: 'event',
    type: 'user.created',
    data: { id: 'user_test' },
    instance_id: 'ins_test',
    timestamp: 1654012591835
  },
  missingHeaders: {
    type: 'user.created',
    data: { id: 'user_test' }
  }
};

// Generate svix signature
function generateSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedPayload = JSON.stringify(payload);

  const toSign = `${timestamp}.${signedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(toSign, 'utf8')
    .digest('base64');

  return `v1,${timestamp},${signature}`;
}

// Test webhook endpoint
async function testWebhookEndpoint() {
  console.log('\n🌐 Testing Webhook Endpoint Accessibility\n');
  console.log(`URL: ${WEBHOOK_URL}`);

  try {
    // Test 1: Basic connectivity
    console.log('\n1️⃣ Testing basic connectivity...');
    const response1 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });

    console.log(`   Status: ${response1.status} ${response1.statusText}`);

    if (response1.status === 400) {
      console.log('   ✅ Webhook endpoint accessible (correctly rejected invalid request)');
    } else if (response1.status >= 500) {
      console.log('   ⚠️  Webhook endpoint returned server error');
    } else {
      console.log(`   ℹ️  Webhook endpoint returned: ${response1.status}`);
    }

    // Test 2: Valid signature
    if (WEBHOOK_SECRET) {
      console.log('\n2️⃣ Testing with valid signature...');
      const validPayload = TEST_PAYLOADS.valid;
      const signature = generateSignature(JSON.stringify(validPayload), WEBHOOK_SECRET);
      const timestamp = signature.split(',')[0].replace('v1,', '');

      const response2 = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'svix-id': 'test-id-123',
          'svix-timestamp': timestamp,
          'svix-signature': signature,
        },
        body: JSON.stringify(validPayload),
      });

      console.log(`   Status: ${response2.status} ${response2.statusText}`);

      if (response2.status === 200) {
        console.log('   ✅ Webhook processed valid signature successfully');
      } else {
        const responseText = await response2.text();
        console.log(`   ❌ Webhook failed to process valid signature`);
        console.log(`   Response: ${responseText}`);
      }
    } else {
      console.log('\n⚠️  Skipping signature test - CLERK_WEBHOOK_SECRET not set');
    }

    // Test 3: Invalid signature
    console.log('\n3️⃣ Testing with invalid signature...');
    const response3 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'svix-id': 'test-id-456',
        'svix-timestamp': '1654012591',
        'svix-signature': 'invalid_signature_123',
      },
      body: JSON.stringify(TEST_PAYLOADS.invalidSignature),
    });

    console.log(`   Status: ${response3.status} ${response3.statusText}`);

    if (response3.status === 400) {
      console.log('   ✅ Webhook correctly rejected invalid signature');
    } else {
      console.log('   ⚠️  Webhook should have rejected invalid signature');
    }

    // Test 4: Missing headers
    console.log('\n4️⃣ Testing with missing required headers...');
    const response4 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(TEST_PAYLOADS.missingHeaders),
    });

    console.log(`   Status: ${response4.status} ${response4.statusText}`);

    if (response4.status === 400) {
      console.log('   ✅ Webhook correctly rejected missing headers');
    } else {
      console.log('   ⚠️  Webhook should have rejected missing headers');
    }

  } catch (error) {
    console.error(`❌ Webhook endpoint test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Is your server running?');
      console.log('   - Check if the port is correct');
      console.log('   - Verify firewall settings');
    }
  }
}

// Check environment
function checkEnvironment() {
  console.log('\n🔧 Checking Environment Configuration\n');

  if (!WEBHOOK_SECRET) {
    console.log('❌ CLERK_WEBHOOK_SECRET not set');
    console.log('   Get this from Clerk Dashboard > Webhooks > Your webhook > Signing Secret');
    return false;
  }

  if (!WEBHOOK_SECRET.startsWith('whsec_')) {
    console.log('⚠️  CLERK_WEBHOOK_SECRET might be invalid');
    console.log('   Should start with "whsec_"');
  } else {
    console.log('✅ CLERK_WEBHOOK_SECRET format looks correct');
  }

  console.log(`✅ Webhook URL: ${WEBHOOK_URL}`);

  // Check if server is running locally
  if (WEBHOOK_URL.includes('localhost')) {
    console.log('\n💡 Local development detected');
    console.log('   Make sure your server is running: bun dev');
  }

  return true;
}

// Main execution
async function main() {
  console.log('🚀 Manual Webhook Endpoint Test');
  console.log('='.repeat(60));

  const envOk = checkEnvironment();
  if (!envOk) {
    process.exit(1);
  }

  await testWebhookEndpoint();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Manual webhook test completed');
  console.log('\n📋 Next Steps:');
  console.log('1. If all tests passed, your webhook is properly configured');
  console.log('2. If tests failed, check:');
  console.log('   - Server is running (bun dev)');
  console.log('   - Webhook endpoint is accessible');
  console.log('   - CLERK_WEBHOOK_SECRET is correct');
  console.log('   - No firewall blocking the requests');
  console.log('\n🔗 Test with real Clerk events:');
  console.log('   Create a test user in Clerk Dashboard to trigger user.created webhook');
}

// Run if executed directly
if (import.meta.main || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  main().catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

export { main, testWebhookEndpoint, checkEnvironment };