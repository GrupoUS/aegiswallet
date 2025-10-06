import { RouterProvider } from '@tanstack/react-router'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { router } from './router'
import '@/styles/accessibility.css'

function InnerApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
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
