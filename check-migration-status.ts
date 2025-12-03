/**
 * Check migration status in the database
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const checkMigrationStatus = async () => {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const sql = neon(databaseUrl);

	try {
		console.log('Checking migration table...');
		
		// Check if drizzle_migrations table exists
		const tableExists = await sql`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = 'drizzle_migrations'
			);
		`;
		
		if (tableExists[0].exists) {
			console.log('✅ drizzle_migrations table exists');
			
			// Get migration history
			const migrations = await sql`
				SELECT id, hash, created_at 
				FROM drizzle_migrations 
				ORDER BY created_at DESC
			`;
			
			console.log(`\nFound ${migrations.length} migrations in database:`);
			migrations.forEach((mig, index) => {
				console.log(`${index + 1}. ${mig.id.substring(0, 8)}... (Created: ${mig.created_at})`);
			});
		} else {
			console.log('❌ drizzle_migrations table does not exist');
		}
		
		// Check if the specific bank_accounts column is already NOT NULL
		console.log('\nChecking bank_accounts table structure...');
		const columnInfo = await sql`
			SELECT column_name, is_nullable, data_type 
			FROM information_schema.columns 
			WHERE table_name = 'bank_accounts' 
			AND column_name = 'user_id'
		`;
		
		if (columnInfo.length > 0) {
			console.log('user_id column info:', columnInfo[0]);
		}
		
		process.exit(0);
	} catch (error) {
		console.error('Error checking migration status:', error);
		process.exit(1);
	}
};

checkMigrationStatus();
