/**
 * Explainability Panel - Story 05.03
 */

export interface Explanation {
  decision: string;
  reasoning: string[];
  confidence: number;
  factors: { name: string; impact: number }[];
}

export class ExplainabilityService {
  explainDecision(_decisionId: string): Explanation {
    return {
      confidence: 0.92,
      decision: 'approved',
      factors: [
        { impact: 35, name: 'Histórico' },
        { impact: 25, name: 'Valor' },
        { impact: 32, name: 'Padrão' },
      ],
      reasoning: [
        'Seu histórico de pagamentos é excelente',
        'O valor está dentro do seu limite diário',
        'Transação similar foi aprovada recentemente',
      ],
    };
  }
}

export function getExplainabilityService(): ExplainabilityService {
  return new ExplainabilityService();
}
