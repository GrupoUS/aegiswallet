import { logger } from '@/lib/logging/logger';
import { environment } from '@/server/config/environment';
import app from '@/server/index';

logger.info(`🚀 AegisWallet Server starting...`, {
  port: environment.PORT,
  environment: environment.NODE_ENV,
  service: 'aegiswallet-server',
  mode: environment.IS_DEVELOPMENT ? 'development' : 'production',
});

export default {
  port: environment.PORT,
  fetch: app.fetch,
};
