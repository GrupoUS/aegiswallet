import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not defined. Set it in your .env file.\n' +
      'Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres'
  );
}

// Create postgres client with connection pool settings
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, {
  prepare: false,
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export type for use in other files
export type Database = typeof db;

// Export postgres client for direct queries if needed
export { client as pgClient };

// Re-export schema for convenience
export { schema };

// Simple validation query on initialization
// This runs once when the module is imported
// Note: Silent connection test for production
client`SELECT 1`
  .then(() => {
    // Connection successful - silent in production
  })
  .catch((err) => {
    // Error only shown in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Database connection failed:', err.message);
    }
  });
