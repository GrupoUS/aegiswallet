import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL ?? '');

// Check users table structure
console.log('=== USERS TABLE COLUMNS ===');
const columns = await sql`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'users'
  ORDER BY ordinal_position
`;
console.table(columns);

// Check users data
console.log('\n=== USERS DATA ===');
const users = await sql`SELECT * FROM users LIMIT 5`;
console.log(JSON.stringify(users, null, 2));

// Check subscriptions table structure
console.log('\n=== SUBSCRIPTIONS TABLE COLUMNS ===');
const subCols = await sql`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'subscriptions'
  ORDER BY ordinal_position
`;
console.table(subCols);

// Check subscriptions data
console.log('\n=== SUBSCRIPTIONS DATA ===');
const subs = await sql`SELECT * FROM subscriptions LIMIT 10`;
console.log(JSON.stringify(subs, null, 2));

// Check subscription_plans
console.log('\n=== SUBSCRIPTION PLANS ===');
const plans = await sql`SELECT * FROM subscription_plans`;
console.log(JSON.stringify(plans, null, 2));
