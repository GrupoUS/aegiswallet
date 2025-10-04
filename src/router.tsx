import { createRouter } from '@tanstack/react-router'
import { IndexRoute } from './routes'
import { DashboardRoute } from './routes/dashboard'
import { TransactionsRoute } from './routes/transactions'
import { RootRoute } from './routes/__root'

const rootRoute = RootRoute
const indexRoute = IndexRoute
const dashboardRoute = DashboardRoute
const transactionsRoute = TransactionsRoute

const router = createRouter({
  routeTree: rootRoute.addChildren({
    indexRoute,
    dashboardRoute,
    transactionsRoute,
  }),
})

export { router }