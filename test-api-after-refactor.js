/**
 * Quick test script to validate API and cron endpoints after refactoring
 */

async function testEndpoints() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing API endpoints after refactoring...\n');
  
  // Test API health endpoint
  try {
    const healthResponse = await fetch(`${baseUrl}/api/v1/health`);
    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthResponse.status, healthData);
  } catch (error) {
    console.error('❌ API Health failed:', error.message);
  }
  
  // Test cron health endpoint
  try {
    const cronHealthResponse = await fetch(`${baseUrl}/cron/health`);
    const cronHealthData = await cronHealthResponse.json();
    console.log('✅ Cron Health:', cronHealthResponse.status, cronHealthData);
  } catch (error) {
    console.error('❌ Cron Health failed:', error.message);
  }
  
  // Test calendar channel renewal cron (should return unauthorized without secret)
  try {
    const cronRenewalResponse = await fetch(`${baseUrl}/cron/calendar-channel-renewal`);
    const renewalData = await cronRenewalResponse.json();
    console.log('✅ Calendar Renewal (expected unauthorized):', cronRenewalResponse.status, renewalData);
  } catch (error) {
    console.error('❌ Calendar Renewal failed:', error.message);
  }
  
  // Test sync queue processor cron (should return unauthorized without secret)
  try {
    const cronSyncResponse = await fetch(`${baseUrl}/cron/sync-queue-processor`);
    const syncData = await cronSyncResponse.json();
    console.log('✅ Sync Queue Processor (expected unauthorized):', cronSyncResponse.status, syncData);
  } catch (error) {
    console.error('❌ Sync Queue Processor failed:', error.message);
  }
  
  console.log('\n🎉 Test completed!');
}

testEndpoints().catch(console.error);
