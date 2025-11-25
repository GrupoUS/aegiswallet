import { handle } from 'hono/vercel';
import app from './index';

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

export default handle(app);
