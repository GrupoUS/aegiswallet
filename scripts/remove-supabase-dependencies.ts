/**
 * Remove Supabase dependencies from project
 * Run: bun scripts/remove-supabase-dependencies.ts
 */

import { execSync } from 'node:child_process';

console.log('🗑️ Removing Supabase dependencies...');

const supabaseDependencies = [
	'@supabase/supabase-js',
	'@supabase/postgrest-js',
	'@supabase/realtime-js',
	'@supabase/storage-js',
	'supabase', // CLI tool
];

function removeSupabaseDependencies() {
	try {
		// Remove from package.json
		execSync(`bun remove ${supabaseDependencies.join(' ')}`, {
			stdio: 'inherit',
		});
		console.log('✅ Supabase packages removed from package.json');

		// Remove from node_modules
		execSync('rm -rf node_modules/@supabase', { stdio: 'inherit' });
		console.log('✅ Supabase node_modules removed');

		console.log('🧹 Supabase dependencies removed successfully!');
	} catch (error) {
		console.error('❌ Error removing Supabase dependencies:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.main) {
	removeSupabaseDependencies();
}
