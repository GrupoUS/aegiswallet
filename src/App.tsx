import { RouterProvider } from '@tanstack/react-router'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import { router } from './router'
import '@/styles/accessibility.css'

function App() {
  return (
    <AccessibilityProvider>
      <RouterProvider router={router} />
    </AccessibilityProvider>
  )
}

export default App
