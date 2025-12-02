import { logger } from '@/lib/logging/logger';
import { environment } from '@/server/config/environment';
import app from '@/server/index';

const PORT = environment.PORT || 3000;

logger.info(`🚀 AegisWallet Server starting...`, {
	environment: environment.NODE_ENV,
	mode: environment.IS_DEVELOPMENT ? 'development' : 'production',
	port: PORT,
	service: 'aegiswallet-server',
});

// Export configuration for Bun.serve() auto-detection
// Bun automatically starts a server when it detects a default export with fetch + port
export default {
	fetch: app.fetch,
	port: PORT,
};
