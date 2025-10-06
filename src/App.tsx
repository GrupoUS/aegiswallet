import { RouterProvider } from '@tanstack/react-router'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { router } from './router'
import '@/styles/accessibility.css'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aegiswallet-theme">
      <AccessibilityProvider>
        <RouterProvider router={router} />
      </AccessibilityProvider>
    </ThemeProvider>
  )
}

export default App
