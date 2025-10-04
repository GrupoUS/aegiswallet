import { createFileRoute } from '@tanstack/react-router'
import { VoiceDashboard } from '@/components/voice/VoiceDashboard'

const IndexRoute = createFileRoute('/')({
  component: Index,
})

function Index() {
  return <VoiceDashboard />
}

export { IndexRoute }
