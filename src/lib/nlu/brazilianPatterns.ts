/**
 * Brazilian Portuguese Patterns for AegisWallet NLU
 *
 * Specialized pattern recognition for Brazilian financial commands
 * with regional variations, slang, and cultural context
 *
 * @module nlu/brazilianPatterns
 */

import type { EntityPattern, TrainingUtterance } from '@/lib/nlu/types';
import { EntityType, IntentType } from '@/lib/nlu/types';

// ============================================================================
// Brazilian Regional Variations
// ============================================================================

export interface RegionalVariation {
  region: 'SP' | 'RJ' | 'Nordeste' | 'Sul' | 'Norte' | 'Centro-Oeste' | 'Unknown';
  patterns: Record<string, string[]>; // Regional alternatives to standard patterns
  slang: string[];
  culturalContext: string[];
  financialTerminology: Record<string, string>;
}

export const BRAZILIAN_REGIONS: RegionalVariation[] = [
  {
    culturalContext: ['trânsito pesado', 'capital', 'interior', 'litoral', 'serra'],
    financialTerminology: {
      account: 'conta',
      bill: 'boleta',
      money: 'grana',
      transfer: 'transfer',
    },
    patterns: {
      check_balance: [
        'meu bem tá na conta',
        'saldo da conta',
        'quanto tenho',
        'como tá minha grana',
      ],
      how_much: ['quanto que tá', 'qual é o valor', 'quanto custa', 'quanto é'],
      pay_bill: ['pagar a boleta', 'acertar as contas', 'quitar a fatura', 'liquidar o débito'],
      transfer: ['mandar grana', 'fazer transfer', 'passar dinheiro', 'depositar na conta'],
    },
    region: 'SP',
    slang: ['meu bem', 'valeu', 'demais', 'massa', 'top', 'sinistro', 'manero'],
  },
  {
    culturalContext: ['praia', 'carnaval', 'favela', 'zona sul', 'zona norte'],
    financialTerminology: {
      account: 'conta',
      bill: 'boleto',
      money: 'grana',
      transfer: 'PIX',
    },
    patterns: {
      check_balance: ['saldo na conta', 'quanto tenho de grana', 'como tá minha conta'],
      how_much: ['quanto tá', 'qual é o preço', 'quanto fica', 'quanto é que é'],
      pay_bill: ['pagar a conta', 'acertar as contas', 'quitar a fatura', 'pagar o boleto'],
      transfer: ['mandar dinheiro', 'fazer PIX', 'passar grana', 'transferir na hora'],
    },
    region: 'RJ',
    slang: ['maneiro', 'caraca', 'legal', 'sussa', 'nossa', 'véi', 'irmao'],
  },
  {
    culturalContext: ['sertão', 'litoral', 'cangaço', 'forró', 'festa junina'],
    financialTerminology: {
      account: 'conta',
      bill: 'boleto',
      money: 'grana',
      transfer: 'depósito',
    },
    patterns: {
      check_balance: ['meu saldo', 'quanto tenho na conta', 'como tá minha grana'],
      how_much: ['quanto é bão', 'qual é o preço', 'quanto custa meu filho', 'quanto que é'],
      pay_bill: ['pagar a conta', 'acertar as dívidas', 'quitar o boleto', 'pagar as contas'],
      transfer: ['mandar dinheiro', 'fazer depósito', 'passar uma grana', 'enviar via PIX'],
    },
    region: 'Nordeste',
    slang: ['oxente', 'arre', 'bão', 'meu rei', 'rapaziada', 'segura o tá'],
  },
  {
    culturalContext: ['chimarrão', 'gaúcho', 'serra', 'praia', 'interior'],
    financialTerminology: {
      account: 'conta',
      bill: 'fatura',
      money: 'grana',
      transfer: 'transferência',
    },
    patterns: {
      check_balance: ['meu saldo', 'quanto tenho na conta', 'como tá meu dinheiro'],
      how_much: ['quanto custa', 'qual é o valor', 'quanto é gurizote', 'quanto que tá'],
      pay_bill: ['pagar a fatura', 'acertar as contas', 'quitar o boleto', 'pagar as contas'],
      transfer: ['mandar dinheiro', 'fazer transferência', 'passar grana', 'depositar tchê'],
    },
    region: 'Sul',
    slang: ['bah', 'tchê', 'guri', 'guria', 'saudades', 'legal', 'bom'],
  },
];

// ============================================================================
// Brazilian Financial Entity Patterns
// ============================================================================

export const BRAZILIAN_ENTITY_PATTERNS: EntityPattern[] = [
  // Money amounts with Brazilian variations
  {
    normalizer: (match: string) => {
      const cleanMatch = match.replace(/[^\d.,]/g, '').replace(',', '.');
      return parseFloat(cleanMatch);
    },
    pattern: /R?\$\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(reais|r\$|real|reis)/gi,
    type: EntityType.AMOUNT,
    validator: (value: number) => value > 0 && value <= 1000000,
  },

  // Brazilian bill types
  {
    normalizer: (match: string) => {
      const billTypes: Record<string, string> = {
        aluguel: 'aluguel',
        cartão: 'cartao',
        condomínio: 'condominio',
        energia: 'energia',
        escola: 'escola',
        financiamento: 'financiamento',
        gás: 'gás',
        internet: 'internet',
        luz: 'energia',
        'plano saúde': 'plano_saude',
        telefone: 'telefone',
        água: 'água',
      };
      return billTypes[match.toLowerCase()] || match.toLowerCase();
    },
    pattern:
      /(conta de )?(luz|energia|água|telefone|internet|gás|condomínio|escola|plano saúde|cartão|financiamento|aluguel)/gi,
    type: EntityType.BILL_TYPE,
  },

  // Brazilian date patterns
  {
    normalizer: (match: string) => {
      const today = new Date();
      const lowerMatch = match.toLowerCase();

      switch (lowerMatch) {
        case 'hoje':
          return today.toISOString().split('T')[0];
        case 'amanhã': {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().split('T')[0];
        }
        case 'ontem': {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return yesterday.toISOString().split('T')[0];
        }
        case 'semana que vem':
        case 'próxima semana': {
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          return nextWeek.toISOString().split('T')[0];
        }
        case 'mês que vem':
        case 'próximo mês': {
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          return nextMonth.toISOString().split('T')[0];
        }
        default:
          return match;
      }
    },
    pattern:
      /(hoje|amanhã|ontem|semana que vem|próxima semana|mês que vem|próximo mês|dia \d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
    type: EntityType.DATE,
  },

  // Brazilian account types
  {
    normalizer: (match: string) => {
      const accountTypes: Record<string, string> = {
        conjunta: 'conjunta',
        corrente: 'corrente',
        digital: 'digital',
        poupança: 'poupanca',
        salário: 'salario',
      };
      return accountTypes[match.toLowerCase()] || 'corrente';
    },
    pattern:
      /(conta )(corrente|poupança|salário|digital|conjunta)|corrente|poupança|salário|digital|conjunta/gi,
    type: EntityType.ACCOUNT,
  },

  // Brazilian recipients (simplified patterns)
  {
    normalizer: (match: string) => {
      const cleanMatch = match.replace(/para\s+/i, '').trim();

      // CPF pattern
      if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(cleanMatch)) {
        return { type: 'cpf', value: cleanMatch.replace(/[^\d]/g, '') };
      }

      // Phone pattern
      if (/^\d{11}$/.test(cleanMatch)) {
        return { type: 'phone', value: cleanMatch };
      }

      // Email pattern
      if (/@/.test(cleanMatch)) {
        return { type: 'email', value: cleanMatch };
      }

      // Name pattern (simplified)
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(cleanMatch)) {
        return { type: 'name', value: cleanMatch };
      }

      return { type: 'unknown', value: cleanMatch };
    },
    pattern:
      /((\d{3}\.?\d{3}\.?\d{3}-?\d{2})|(\d{11})|([\w.-]+@[\w.-]+\.[a-zA-Z]{2,})|(para\s+[A-Z][a-z]+\s+[A-Z][a-z]+))/gi,
    type: EntityType.RECIPIENT,
  },

  // Brazilian financial categories
  {
    normalizer: (match: string) => {
      const categories: Record<string, string> = {
        alimentação: 'alimentacao',
        cartão: 'cartao',
        contas: 'contas',
        'despesas pessoais': 'despesas_pessoais',
        economias: 'economias',
        educação: 'educacao',
        empréstimos: 'emprestimos',
        investimentos: 'investimentos',
        lazer: 'lazer',
        moradia: 'moradia',
        saúde: 'saude',
        transporte: 'transporte',
        vestuário: 'vestuario',
      };
      return categories[match.toLowerCase()] || match.toLowerCase();
    },
    pattern:
      /(alimentação|moradia|transporte|saúde|educação|lazer|vestuário|despesas pessoais|economias|investimentos|contas|cartão|empréstimos)/gi,
    type: EntityType.CATEGORY,
  },

  // Brazilian time periods
  {
    normalizer: (match: string) => {
      const periods: Record<string, string> = {
        'esta semana': 'this_week',
        'este mês': 'this_month',
        hoje: 'today',
        'mês atual': 'this_month',
        'mês passado': 'last_month',
        'próximos 30 dias': 'next_30_days',
        'próximos 7 dias': 'next_7_days',
        'semana passada': 'last_week',
        'últimos 30 dias': 'last_30_days',
        'últimos 7 dias': 'last_7_days',
      };
      return periods[match.toLowerCase()] || match.toLowerCase();
    },
    pattern:
      /(hoje|esta semana|este mês|mês atual|semana passada|mês passado|últimos 7 dias|últimos 30 dias|próximos 7 dias|próximos 30 dias)/gi,
    type: EntityType.PERIOD,
  },
];

// ============================================================================
// Brazilian Intent Patterns
// ============================================================================

export const BRAZILIAN_INTENT_PATTERNS = {
  [IntentType.CHECK_BALANCE]: [
    // Standard patterns
    /qual (é o )?meu saldo/i,
    /quanto (eu )?tenho (na )?conta/i,
    /mostrar saldo/i,
    /verificar saldo/i,
    /consultar saldo/i,

    // Brazilian variations
    /quanto (que )?tá (na )?minha (grana|conta)/i,
    /como tá (minha|meu) saldo/i,
    /meu bem tá (na )?conta/i,
    /quanto (eu )?tenho de grana/i,
    /saldo da (minha|meu) conta/i,
    /qual é o valor (na )?conta/i,
    /quanto (eu )?posso sacar/i,
    /tem quanto (na )?minha conta/i,
  ],

  [IntentType.PAY_BILL]: [
    // Standard patterns
    /pagar (a )?conta de (\w+)/i,
    /quitar (a )?fatura/i,
    /pagar (o )?boleto/i,
    /efetuar pagamento/i,

    // Brazilian variations
    /pagar a (conta|fatura|boleta) de (\w+)/i,
    /acertar (as )?contas/i,
    /liquidar (o )?débito/i,
    /quitar (a )?fatura de (\w+)/i,
    /preciso pagar (a )?conta de (\w+)/i,
    /vou pagar (o )?boleto de (\w+)/i,
    /pagar (minhas|as) contas/i,
    /quitar (os )?débitos/i,
    /fazer pagamento (de )?(\w+)/i,
    /regularizar (a )?situação/i,
  ],

  [IntentType.TRANSFER_MONEY]: [
    // Standard patterns
    /transferir (para )?(\w+)/i,
    /enviar dinheiro (para )?(\w+)/i,
    /fazer (uma )?transferência/i,
    /depositar (para )?(\w+)/i,

    // Brazilian variations
    /mandar (grana|dinheiro) (para )?(\w+)/i,
    /passar (grana|dinheiro) (para )?(\w+)/i,
    /fazer PIX (para )?(\w+)/i,
    /transferir (R?\$?\s*\d+(?:[.,]\d{2})?) (para )?(\w+)/i,
    /depositar (na )?conta (de )?(\w+)/i,
    /enviar (R?\$?\s*\d+(?:[.,]\d{2})?) (via PIX) (para )?(\w+)/i,
    /fazer transferência (para )?(\w+)/i,
    /pagar (para )?(\w+) (com )?PIX/i,
    /quitar (a )?pessoa (\w+)/i,
    /depositar (uma )?grana (para )?(\w+)/i,
  ],

  [IntentType.CHECK_BUDGET]: [
    // Standard patterns
    /verificar orçamento/i,
    /mostrar orçamento/i,
    /como está meu orçamento/i,
    /analisar gastos/i,

    // Brazilian variations
    /como tá (meu|o) orçamento/i,
    /quanto (eu )?gastei/i,
    /ver meus gastos/i,
    /analisar minhas despesas/i,
    /controlar orçamento/i,
    /meu orçamento tá (bem|ruim)/i,
    /quanto (eu )?gastei (este )?mês/i,
    /relatório de gastos/i,
    /extrato de despesas/i,
    /balanço mensal/i,
  ],

  [IntentType.CHECK_INCOME]: [
    // Standard patterns
    /verificar renda/i,
    /mostrar rendimentos/i,
    /quanto eu ganhei/i,
    /minhas entradas/i,

    // Brazilian variations
    /quanto (eu )?recebi/i,
    /minhas entradas (de )?dinheiro/i,
    /renda mensal/i,
    /ganhos do mês/i,
    /quanto entrou (na )?conta/i,
    /minha renda (é|está)/i,
    /recebimentos do mês/i,
    /fluxo de entradas/i,
    /rendimento mensal/i,
    /ganhei quanto (este )?mês/i,
  ],

  [IntentType.FINANCIAL_PROJECTION]: [
    // Standard patterns
    /projeção financeira/i,
    /prever gastos/i,
    /análise financeira/i,
    /planejar finanças/i,

    // Brazilian variations
    /previsão (de )?gastos/i,
    /quanto vou gastar/i,
    /planejar (o )?mês/i,
    /projetar finanças/i,
    /análise (do )?orçamento/i,
    /quanto vai dar (de )?gasto/i,
    /previsão (para )?próximo mês/i,
    /planejamento financeiro/i,
    /cálculo (de )?gastos/i,
    /orçamento futuro/i,
  ],
};

// ============================================================================
// Brazilian Training Dataset
// ============================================================================

export const BRAZILIAN_TRAINING_DATA: TrainingUtterance[] = [
  // Check Balance - SP variations
  { intent: IntentType.CHECK_BALANCE, region: 'SP', text: 'qual é meu saldo' },
  {
    intent: IntentType.CHECK_BALANCE,
    metadata: { slang: true },
    region: 'SP',
    text: 'quanto que tá na minha conta',
  },
  {
    intent: IntentType.CHECK_BALANCE,
    metadata: { slang: true },
    region: 'SP',
    text: 'meu bem tá na conta',
  },
  {
    intent: IntentType.CHECK_BALANCE,
    metadata: { slang: true },
    region: 'SP',
    text: 'como tá minha grana',
  },

  // Check Balance - RJ variations
  {
    intent: IntentType.CHECK_BALANCE,
    region: 'RJ',
    text: 'quanto tá na conta',
  },
  {
    intent: IntentType.CHECK_BALANCE,
    metadata: { slang: true },
    region: 'RJ',
    text: 'meu saldo tá bom',
  },
  {
    intent: IntentType.CHECK_BALANCE,
    metadata: { slang: true },
    region: 'RJ',
    text: 'quanto tenho de grana',
  },

  // Check Balance - Nordeste variations
  {
    intent: IntentType.CHECK_BALANCE,
    metadata: { slang: true },
    region: 'Nordeste',
    text: 'oxente, quanto tenho na conta',
  },
  {
    intent: IntentType.CHECK_BALANCE,
    metadata: { slang: true },
    region: 'Nordeste',
    text: 'meu rei, qual é o saldo',
  },
  {
    intent: IntentType.CHECK_BALANCE,
    metadata: { slang: true },
    region: 'Nordeste',
    text: 'quanto é bão que tá na conta',
  },

  // Pay Bill - Regional variations
  {
    entities: [
      {
        endIndex: 17,
        startIndex: 14,
        type: EntityType.BILL_TYPE,
        value: 'luz',
      },
    ],
    intent: IntentType.PAY_BILL,
    text: 'pagar a conta de luz',
  },
  {
    entities: [
      {
        endIndex: 23,
        startIndex: 16,
        type: EntityType.BILL_TYPE,
        value: 'energia',
      },
    ],
    intent: IntentType.PAY_BILL,
    text: 'quitar o boleto de energia',
  },
  {
    entities: [
      {
        endIndex: 18,
        startIndex: 15,
        type: EntityType.BILL_TYPE,
        value: 'água',
      },
    ],
    intent: IntentType.PAY_BILL,
    metadata: { slang: true },
    region: 'SP',
    text: 'pagar a boleta de água',
  },
  {
    intent: IntentType.PAY_BILL,
    metadata: { slang: true },
    text: 'acertar as contas do mês',
  },

  // Transfer Money - Regional variations
  {
    entities: [
      { endIndex: 13, startIndex: 10, type: EntityType.AMOUNT, value: '100' },
      {
        endIndex: 24,
        startIndex: 20,
        type: EntityType.RECIPIENT,
        value: 'João',
      },
    ],
    intent: IntentType.TRANSFER_MONEY,
    text: 'mandar R$ 100 para o João',
  },
  {
    entities: [
      {
        endIndex: 18,
        startIndex: 13,
        type: EntityType.RECIPIENT,
        value: 'Maria',
      },
    ],
    intent: IntentType.TRANSFER_MONEY,
    text: 'fazer PIX para Maria',
  },
  {
    entities: [
      { endIndex: 13, startIndex: 6, type: EntityType.AMOUNT, value: '50' },
      {
        endIndex: 29,
        startIndex: 24,
        type: EntityType.RECIPIENT,
        value: 'irmão',
      },
    ],
    intent: IntentType.TRANSFER_MONEY,
    metadata: { slang: true },
    text: 'passar 50 reais para meu irmão',
  },
  {
    entities: [
      {
        endIndex: 25,
        startIndex: 20,
        type: EntityType.RECIPIENT,
        value: 'Paulo',
      },
    ],
    intent: IntentType.TRANSFER_MONEY,
    text: 'depositar na conta do Paulo',
  },

  // Check Budget - Brazilian variations
  {
    intent: IntentType.CHECK_BUDGET,
    metadata: { slang: true },
    text: 'como tá meu orçamento',
  },
  { intent: IntentType.CHECK_BUDGET, text: 'quanto gastei este mês' },
  { intent: IntentType.CHECK_BUDGET, text: 'ver meus gastos' },
  { intent: IntentType.CHECK_BUDGET, text: 'analisar minhas despesas' },

  // Check Income - Brazilian variations
  { intent: IntentType.CHECK_INCOME, text: 'quanto recebi este mês' },
  { intent: IntentType.CHECK_INCOME, text: 'minhas entradas de dinheiro' },
  {
    intent: IntentType.CHECK_INCOME,
    metadata: { slang: true },
    text: 'quanto entrou na conta',
  },
  { intent: IntentType.CHECK_INCOME, text: 'renda mensal' },

  // Financial Projection - Brazilian variations
  {
    intent: IntentType.FINANCIAL_PROJECTION,
    text: 'previsão de gastos para próximo mês',
  },
  {
    intent: IntentType.FINANCIAL_PROJECTION,
    metadata: { slang: true },
    text: 'quanto vou gastar este mês',
  },
  { intent: IntentType.FINANCIAL_PROJECTION, text: 'planejar o orçamento' },
  {
    intent: IntentType.FINANCIAL_PROJECTION,
    text: 'análise financeira mensal',
  },
];

// ============================================================================
// Brazilian Context Analysis
// ============================================================================

export interface BrazilianContext {
  region: string;
  linguisticStyle: 'formal' | 'colloquial' | 'slang' | 'mixed';
  culturalMarkers: string[];
  financialContext: {
    commonBills: string[];
    paymentMethods: string[];
    financialHabits: string[];
  };
  temporalContext: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: 'weekday' | 'weekend';
    seasonality: 'beginning' | 'middle' | 'end'; // of month
  };
}

export class BrazilianContextAnalyzer {
  /**
   * Analyze text to extract Brazilian context
   */
  analyzeContext(text: string): BrazilianContext {
    const lowerText = text.toLowerCase();

    return {
      culturalMarkers: this.detectCulturalMarkers(lowerText),
      financialContext: this.analyzeFinancialContext(lowerText),
      linguisticStyle: this.detectLinguisticStyle(lowerText),
      region: this.detectRegion(lowerText),
      temporalContext: this.analyzeTemporalContext(),
    };
  }

  private detectRegion(text: string): string {
    for (const region of BRAZILIAN_REGIONS) {
      const hasSlang = region.slang.some((slang) => text.includes(slang));
      const hasPattern = Object.values(region.patterns).some((patterns) =>
        patterns.some((pattern) => text.includes(pattern))
      );

      if (hasSlang || hasPattern) {
        return region.region;
      }
    }

    return 'Unknown';
  }

  private detectLinguisticStyle(text: string): 'formal' | 'colloquial' | 'slang' | 'mixed' {
    const formalIndicators = ['gostaria', 'poderia', 'agradeceria', 'por favor'];
    const slangIndicators = ['oxente', 'caraca', 'meu bem', 'bah', 'tchê', 'maneiro'];
    const colloquialIndicators = ['meu', 'minha', 'quero', 'vou', 'pegar', 'tá'];

    const hasFormal = formalIndicators.some((indicator) => text.includes(indicator));
    const hasSlang = slangIndicators.some((indicator) => text.includes(indicator));
    const hasColloquial = colloquialIndicators.some((indicator) => text.includes(indicator));

    if (hasFormal && !hasSlang) {
      return 'formal';
    }
    if (hasSlang && !hasFormal) {
      return 'slang';
    }
    if (hasColloquial && !hasFormal && !hasSlang) {
      return 'colloquial';
    }
    if (hasSlang && hasFormal) {
      return 'mixed';
    }

    return 'colloquial';
  }

  private detectCulturalMarkers(text: string): string[] {
    const markers = [];

    // Time-related cultural markers
    if (text.includes('semana')) {
      markers.push('time_planning');
    }
    if (text.includes('mês') || text.includes('mes')) {
      markers.push('monthly_planning');
    }

    // Social context markers
    if (text.includes('família') || text.includes('filhos')) {
      markers.push('family_context');
    }
    if (text.includes('trabalho') || text.includes('emprego')) {
      markers.push('work_context');
    }

    // Regional markers
    if (text.includes('praiá') || text.includes('praia')) {
      markers.push('coastal_life');
    }
    if (text.includes('trânsito') || text.includes('engarrafamento')) {
      markers.push('urban_life');
    }

    return markers;
  }

  private analyzeFinancialContext(text: string): BrazilianContext['financialContext'] {
    const commonBills = [];
    const paymentMethods = [];
    const financialHabits = [];

    // Detect common bills
    if (text.includes('luz') || text.includes('energia')) {
      commonBills.push('energia');
    }
    if (text.includes('água')) {
      commonBills.push('agua');
    }
    if (text.includes('telefone') || text.includes('celular')) {
      commonBills.push('telefone');
    }
    if (text.includes('internet')) {
      commonBills.push('internet');
    }

    // Detect payment methods
    if (text.includes('PIX') || text.includes('pix')) {
      paymentMethods.push('pix');
    }
    if (text.includes('boleto') || text.includes('boleta')) {
      paymentMethods.push('boleto');
    }
    if (text.includes('transfer') || text.includes('depositar')) {
      paymentMethods.push('transferencia');
    }

    // Detect financial habits
    if (text.includes('todo mês') || text.includes('mensalmente')) {
      financialHabits.push('regular_planning');
    }
    if (text.includes('economizar') || text.includes('guardar')) {
      financialHabits.push('saving_habit');
    }
    if (text.includes('gastar') || text.includes('despesa')) {
      financialHabits.push('expense_tracking');
    }

    return {
      commonBills,
      financialHabits,
      paymentMethods,
    };
  }

  private analyzeTemporalContext(): BrazilianContext['temporalContext'] {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    // Time of day
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 6 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 18) {
      timeOfDay = 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    // Day of week
    const dayType = dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday';

    // Month seasonality
    let seasonality: 'beginning' | 'middle' | 'end';
    if (dayOfMonth <= 10) {
      seasonality = 'beginning';
    } else if (dayOfMonth <= 20) {
      seasonality = 'middle';
    } else {
      seasonality = 'end';
    }

    return {
      dayOfWeek: dayType,
      seasonality,
      timeOfDay,
    };
  }
}

// ============================================================================
// Exports
// ============================================================================
