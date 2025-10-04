import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VoiceDashboard } from '@/components/voice/VoiceDashboard'

const IndexRoute = createFileRoute('/')({
  component: Index,
})

function Index() {
  return <VoiceDashboard />
}

export { IndexRoute }