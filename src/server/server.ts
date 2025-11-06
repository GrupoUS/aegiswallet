import app from '@/server/index';

const port = process.env.PORT || 3000;

logger.info(`🚀 Server running on http://localhost:${port}`, {
  port,
  environment: process.env.NODE_ENV || 'development',
  service: 'aegiswallet-server',
});

export default {
  port,
  fetch: app.fetch,
};
