import { createRouter, createRootRouteWithContext, createRoute, redirect, Outlet } from '@tanstack/react-router'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { VoiceDashboard } from '@/components/voice/VoiceDashboard'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import Login from '@/pages/Login'
import type { AuthContextType } from '@/contexts/AuthContext'

interface RouterContext {
  auth: AuthContextType
}

// Root route with context
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <TRPCProvider>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    </TRPCProvider>
  ),
})

// Index route (public)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: VoiceDashboard,
})

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || '/dashboard',
  }),
  beforeLoad: ({ context, search }) => {
    // Redirect if already authenticated
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect as string })
    }
  },
  component: Login,
})

// Authenticated layout route (pathless)
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: ({ context, location }) => {
    // Redirect to login if not authenticated
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: () => <Outlet />,
})

// Dashboard route (protected)
const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/dashboard',
  component: Dashboard,
})

// Transactions route (protected)
const transactionsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/transactions',
  component: Transactions,
})

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    transactionsRoute,
  ]),
])

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
  context: {
    // auth will be passed from App component
    auth: undefined!,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export { router }
