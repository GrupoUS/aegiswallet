import { createFileRoute } from '@tanstack/react-router'
import { VoiceDashboard } from '@/components/voice/VoiceDashboard'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return <VoiceDashboard />
}
