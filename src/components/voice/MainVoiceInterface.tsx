/**
 * Main Voice Interface - Story 04.01
 */

import React from 'react'
import { VoiceDashboard } from './VoiceDashboard'

export const MainVoiceInterface = React.memo(function MainVoiceInterface() {
  return (
    <div className="main-voice-interface">
      <VoiceDashboard />
    </div>
  )
})
