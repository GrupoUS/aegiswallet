import { logger } from '@/lib/logging/logger';
import { environment } from '@/server/config/environment';
import app from '@/server/index';

logger.info(`🚀 AegisWallet Server starting...`, {
	environment: environment.NODE_ENV,
	mode: environment.IS_DEVELOPMENT ? 'development' : 'production',
	port: environment.PORT,
	service: 'aegiswallet-server',
});

export default {
	fetch: app.fetch,
	port: environment.PORT,
};
