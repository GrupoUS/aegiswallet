import { createRouter, RouterProvider } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { routeTree } from './routeTree.gen'

// import '@/styles/accessibility.css' // Temporarily disabled due to PostCSS error

// Handle OAuth hash fragments before router initialization
const handleOAuthHash = () => {
  if (typeof window !== 'undefined') {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hasOAuthParams = hashParams.has('access_token') || hashParams.has('error')

    if (hasOAuthParams) {
      // For OAuth redirects, we need to make sure we're on the dashboard path
      if (!window.location.pathname.includes('/dashboard')) {
        // Store the hash in sessionStorage and redirect to dashboard
        sessionStorage.setItem('oauth_hash', window.location.hash)
        window.location.replace('/dashboard')
        return true // Indicate that redirect is happening
      } else {
        // Store the hash for processing by the dashboard component
        sessionStorage.setItem('oauth_hash', window.location.hash)
      }
    }
  }
  return false
}

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
  useEffect(() => {
    // Handle OAuth hash fragments on app load
    const isRedirecting = handleOAuthHash()
    if (isRedirecting) {
      return // Don't render anything if redirecting
    }
  }, [])

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
