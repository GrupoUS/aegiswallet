import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TRPCProvider } from '@/components/providers/TRPCProvider'

const RootRoute = createRootRoute({
  component: () => (
    <TRPCProvider>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    </TRPCProvider>
  ),
})

export { RootRoute }
