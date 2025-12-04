import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL ?? '');

const tables = await sql`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name
`;

console.log('Tables in database:');
tables.forEach((t: { table_name: string }) => console.log('  -', t.table_name));

// Check profiles
console.log('\n=== PROFILES ===');
const profiles = await sql`SELECT id, user_id, email, subscription_tier, stripe_customer_id FROM profiles LIMIT 10`;
console.table(profiles);
