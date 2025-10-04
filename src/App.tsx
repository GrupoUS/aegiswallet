import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import '@/styles/accessibility.css'

function App() {
  return (
    <AccessibilityProvider>
      <RouterProvider router={router} />
    </AccessibilityProvider>
  )
}

export default App;
