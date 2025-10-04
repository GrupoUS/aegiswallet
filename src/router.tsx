import { createRouter } from '@tanstack/react-router'
import { IndexRoute } from './routes'
import { RootRoute } from './routes/__root'
import { DashboardRoute } from './routes/dashboard'
import { TransactionsRoute } from './routes/transactions'

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
