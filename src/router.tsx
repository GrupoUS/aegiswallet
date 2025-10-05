import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { VoiceDashboard } from '@/components/voice/VoiceDashboard'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <TRPCProvider>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    </TRPCProvider>
  ),
})

// Index route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: VoiceDashboard,
})

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
})

// Transactions route  
const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions',
  component: Transactions,
})

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  transactionsRoute,
])

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
})

export { router }
