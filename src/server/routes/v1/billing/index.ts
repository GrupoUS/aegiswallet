import { Hono } from 'hono';

import checkoutRouter from './checkout';
import paymentHistoryRouter from './payment-history';
import plansRouter from './plans';
import portalRouter from './portal';
import subscriptionRouter from './subscription';
import webhookRouter from './webhook';
import type { AppEnv } from '@/server/hono-types';

const billingRouter = new Hono<AppEnv>();

billingRouter.route('/checkout', checkoutRouter);
billingRouter.route('/subscription', subscriptionRouter);
billingRouter.route('/portal', portalRouter);
billingRouter.route('/plans', plansRouter);
billingRouter.route('/webhook', webhookRouter);
billingRouter.route('/payment-history', paymentHistoryRouter);

export default billingRouter;
