/**
 * Simple NeonDB Connection Test
 * Verifies database connectivity and basic schema
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables from .env.local, fallback to .env
config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  config({ path: '.env' });
}

// Override with correct Neon URL (fixing system env var issue)
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_jqbHF8Rt9LKl@ep-calm-unit-ac6cfbqc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

async function testNeonConnection() {
  console.log('🚀 Testing NeonDB Connection...\n');
  
  // Check environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log(`🔗 Database URL: ${process.env.DATABASE_URL}`);
console.log(`🔗 Contains neon? ${process.env.DATABASE_URL?.includes('neon')}`);
console.log(`🔗 Contains supabase? ${process.env.DATABASE_URL?.includes('supabase')}`);
  
  try {
    // Create Neon client
    const sql = neon(process.env.DATABASE_URL);
    
    // Test basic connection
    console.log('📡 Testing database connection...');
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version, current_database() as database_name`;
    
    console.log('✅ Connection successful!');
    console.log(`📅 Current Time: ${result[0].current_time}`);
    console.log(`🐘 PostgreSQL: ${result[0].postgres_version}`);
    console.log(`🗄️  Database: ${result[0].database_name}`);
    
    // Test table existence
    console.log('\n📋 Checking table existence...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    if (tables.length > 0) {
      console.log('✅ Tables found:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. You may need to run migrations.');
    }
    
    // Test if user tables have proper columns
    console.log('\n👤 Checking user isolation columns...');
    
    const userTables = ['users', 'bank_accounts', 'transactions', 'pix_keys'];
    
    for (const tableName of userTables) {
      try {
        const columns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${tableName} 
          AND (column_name = 'user_id' OR column_name = 'clerk_user_id' OR column_name = 'organization_id')
        `;
        
        if (columns.length > 0) {
          console.log(`✅ ${tableName}: Has user isolation columns`);
          columns.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
          });
        } else {
          console.log(`❌ ${tableName}: No user isolation columns found`);
        }
      } catch (error) {
        console.log(`❓ ${tableName}: Could not check columns (${error.message})`);
      }
    }
    
    console.log('\n🎯 NeonDB connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if DATABASE_URL is correct');
      console.log('2. Verify Neon project is active');
      console.log('3. Check network connectivity');
      console.log('4. Ensure database credentials are valid');
    }
    
    process.exit(1);
  }
}

testNeonConnection();
