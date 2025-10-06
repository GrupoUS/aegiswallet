import { RouterProvider, createRouter } from '@tanstack/react-router'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { routeTree } from './routeTree.gen'
// import '@/styles/accessibility.css' // Temporarily disabled due to PostCSS error

// Create router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  return <RouterProvider router={router} />
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aegiswallet-theme">
      <AccessibilityProvider>
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  )
}

export default App
