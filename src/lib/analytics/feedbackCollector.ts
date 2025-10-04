/**
 * Feedback Collection Service
 *
 * Story: 01.05 - Observabilidade e Treinamento Contínuo
 */

import { supabase } from '@/integrations/supabase/client'

export interface VoiceFeedback {
  userId: string
  metricId?: string
  rating: number // 1-5
  feedbackText?: string
  feedbackType: 'accuracy' | 'speed' | 'understanding' | 'general'
}

export class FeedbackCollectorService {
  async collectFeedback(feedback: VoiceFeedback): Promise<void> {
    try {
      const { error } = await supabase.from('voice_feedback').insert({
        user_id: feedback.userId,
        metric_id: feedback.metricId,
        rating: feedback.rating,
        feedback_text: feedback.feedbackText,
        feedback_type: feedback.feedbackType,
      })

      if (error) {
        console.error('Failed to collect feedback:', error)
      }
    } catch (error) {
      console.error('Error collecting feedback:', error)
    }
  }

  async calculateNPS(days: number = 30): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('voice_feedback')
        .select('rating')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (error || !data || data.length === 0) {
        return 0
      }

      const promoters = data.filter((f) => f.rating >= 4).length
      const detractors = data.filter((f) => f.rating <= 2).length
      const total = data.length

      return ((promoters - detractors) / total) * 100
    } catch (error) {
      console.error('Error calculating NPS:', error)
      return 0
    }
  }
}

export function createFeedbackCollectorService(): FeedbackCollectorService {
  return new FeedbackCollectorService()
}

export async function collectVoiceFeedback(feedback: VoiceFeedback): Promise<void> {
  const service = createFeedbackCollectorService()
  return service.collectFeedback(feedback)
}
