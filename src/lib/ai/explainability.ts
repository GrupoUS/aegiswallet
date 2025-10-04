/**
 * Explainability Panel - Story 05.03
 */

export interface Explanation {
  decision: string
  reasoning: string[]
  confidence: number
  factors: Array<{ name: string; impact: number }>
}

export class ExplainabilityService {
  explainDecision(decisionId: string): Explanation {
    return {
      decision: 'approved',
      reasoning: [
        'Seu histórico de pagamentos é excelente',
        'O valor está dentro do seu limite diário',
        'Transação similar foi aprovada recentemente',
      ],
      confidence: 0.92,
      factors: [
        { name: 'Histórico', impact: 35 },
        { name: 'Valor', impact: 25 },
        { name: 'Padrão', impact: 32 },
      ],
    }
  }
}

export function getExplainabilityService(): ExplainabilityService {
  return new ExplainabilityService()
}
