export interface Transaction {
  id: string
  description: string
  amount: number
  date: Date
  type: 'income' | 'expense' | 'transfer'
  category?: string
  subcategory?: string
  merchant?: string
  location?: string
  paymentMethod?: string
  confidence?: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  subcategories?: Subcategory[]
  keywords: string[]
  patterns: RegExp[]
}

export interface Subcategory {
  id: string
  name: string
  keywords: string[]
  patterns: RegExp[]
}

// Brazilian financial categories with local patterns
const BRAZILIAN_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: 'Alimentação',
    icon: '🍽️',
    color: '#ef4444',
    keywords: [
      'restaurante',
      'lanchonete',
      'supermercado',
      'mercado',
      'padaria',
      'delivery',
      'ifood',
      'rappi',
      'food',
      'comida',
      'alimentação',
    ],
    patterns: [
      /mercado.*super/i,
      /restaurante/i,
      /lanchonete/i,
      /padaria/i,
      /delivery/i,
      /ifood/i,
      /rappi/i,
    ],
    subcategories: [
      {
        id: 'groceries',
        name: 'Supermercado',
        keywords: [
          'supermercado',
          'mercado',
          'atacarejo',
          'atacadão',
          'carrefour',
          'pão de açúcar',
        ],
        patterns: [/supermercado/i, /mercado/i, /atacarejo/i, /atacadão/i],
      },
      {
        id: 'restaurant',
        name: 'Restaurante',
        keywords: ['restaurante', 'comida', 'refeição', 'almoço', 'jantar'],
        patterns: [/restaurante/i, /refeição/i],
      },
      {
        id: 'delivery',
        name: 'Delivery',
        keywords: ['delivery', 'ifood', 'rappi', 'uber eats'],
        patterns: [/delivery/i, /ifood/i, /rappi/i, /uber eats/i],
      },
    ],
  },
  {
    id: 'transport',
    name: 'Transporte',
    icon: '🚗',
    color: '#3b82f6',
    keywords: [
      'uber',
      '99',
      'taxi',
      'posto',
      'gasolina',
      'estacionamento',
      'transporte',
      'ônibus',
      'metrô',
    ],
    patterns: [/uber/i, /99/i, /taxi/i, /posto.*gasolina/i, /estacionamento/i],
    subcategories: [
      {
        id: 'ride_sharing',
        name: 'Transporte App',
        keywords: ['uber', '99', 'cabify'],
        patterns: [/uber/i, /99/i, /cabify/i],
      },
      {
        id: 'fuel',
        name: 'Combustível',
        keywords: ['gasolina', 'álcool', 'posto', 'combustível'],
        patterns: [/gasolina/i, /álcool/i, /posto/i, /combustível/i],
      },
      {
        id: 'public_transport',
        name: 'Transporte Público',
        keywords: ['ônibus', 'metrô', 'trem', 'bilhete'],
        patterns: [/ônibus/i, /metrô/i, /trem/i, /bilhete/i],
      },
    ],
  },
  {
    id: 'shopping',
    name: 'Compras',
    icon: '🛍️',
    color: '#8b5cf6',
    keywords: ['loja', 'shopping', 'roupa', 'calçado', 'compra', 'mercado', 'varejo'],
    patterns: [/shopping/i, /loja/i, /roupa/i, /calçado/i],
    subcategories: [
      {
        id: 'clothing',
        name: 'Roupas',
        keywords: ['roupa', 'calçado', 'vestuário'],
        patterns: [/roupa/i, /calçado/i, /vestuário/i],
      },
      {
        id: 'electronics',
        name: 'Eletrônicos',
        keywords: ['celular', 'computador', 'eletrônico'],
        patterns: [/celular/i, /computador/i, /eletrônico/i],
      },
    ],
  },
  {
    id: 'utilities',
    name: 'Contas',
    icon: '📄',
    color: '#f59e0b',
    keywords: ['energia', 'luz', 'água', 'internet', 'telefone', 'conta', 'boleto'],
    patterns: [/energia.*elétrica/i, /luz/i, /água/i, /internet/i, /telefone/i],
    subcategories: [
      {
        id: 'electricity',
        name: 'Energia',
        keywords: ['energia', 'luz', 'eletropaulo', 'light'],
        patterns: [/energia/i, /luz/i, /eletropaulo/i, /light/i],
      },
      {
        id: 'water',
        name: 'Água',
        keywords: ['água', 'sabesp'],
        patterns: [/água/i, /sabesp/i],
      },
      {
        id: 'internet',
        name: 'Internet',
        keywords: ['internet', 'net', 'vivo', 'claro', 'oi'],
        patterns: [/internet/i, /net/i, /vivo/i, /claro/i, /oi/i],
      },
    ],
  },
  {
    id: 'health',
    name: 'Saúde',
    icon: '🏥',
    color: '#10b981',
    keywords: ['farmácia', 'médico', 'hospital', 'plano', 'saúde', 'remédio'],
    patterns: [/farmácia/i, /médico/i, /hospital/i, /plano.*saúde/i],
    subcategories: [
      {
        id: 'pharmacy',
        name: 'Farmácia',
        keywords: ['farmácia', 'remédio', 'medicamento'],
        patterns: [/farmácia/i, /remédio/i, /medicamento/i],
      },
      {
        id: 'medical',
        name: 'Médico',
        keywords: ['médico', 'consulta', 'hospital'],
        patterns: [/médico/i, /consulta/i, /hospital/i],
      },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entretenimento',
    icon: '🎬',
    color: '#ec4899',
    keywords: ['cinema', 'netflix', 'spotify', 'show', 'teatro', 'jogo'],
    patterns: [/cinema/i, /netflix/i, /spotify/i, /show/i],
    subcategories: [
      {
        id: 'streaming',
        name: 'Streaming',
        keywords: ['netflix', 'spotify', 'prime', 'hbo'],
        patterns: [/netflix/i, /spotify/i, /prime/i, /hbo/i],
      },
      {
        id: 'cinema',
        name: 'Cinema',
        keywords: ['cinema', 'filmes'],
        patterns: [/cinema/i, /filme/i],
      },
    ],
  },
  {
    id: 'income',
    name: 'Receitas',
    icon: '💰',
    color: '#22c55e',
    keywords: ['salário', 'pagamento', 'recebimento', 'depósito', 'renda'],
    patterns: [/salário/i, /pagamento/i, /recebimento/i, /depósito/i],
    subcategories: [
      {
        id: 'salary',
        name: 'Salário',
        keywords: ['salário', 'ordenado'],
        patterns: [/salário/i, /ordenado/i],
      },
      {
        id: 'freelance',
        name: 'Freelance',
        keywords: ['freelance', 'pj', 'autônomo'],
        patterns: [/freelance/i, /pj/i, /autônomo/i],
      },
    ],
  },
]

export class TransactionCategorizer {
  private categories: Category[]

  constructor() {
    this.categories = BRAZILIAN_CATEGORIES
  }

  /**
   * Categorize a transaction using pattern matching and keyword analysis
   */
  categorizeTransaction(
    transaction: Transaction
  ): Transaction & { category: string; subcategory?: string; confidence: number } {
    const description = transaction.description.toLowerCase()
    let bestMatch: { category: Category; subcategory?: Subcategory; confidence: number } = {
      category: this.categories[0],
      confidence: 0,
    }

    // Check income vs expense first
    if (transaction.type === 'income') {
      const incomeCategory = this.categories.find((cat) => cat.id === 'income')
      if (incomeCategory) {
        bestMatch = { category: incomeCategory, confidence: 0.9 }
      }
    }

    // Pattern matching
    for (const category of this.categories) {
      let categoryScore = 0

      // Check category keywords
      for (const keyword of category.keywords) {
        if (description.includes(keyword)) {
          categoryScore += 0.8
        }
      }

      // Check category patterns
      for (const pattern of category.patterns) {
        if (pattern.test(description)) {
          categoryScore += 0.9
        }
      }

      // Check subcategories
      let bestSubcategory: Subcategory | undefined
      let subcategoryScore = 0

      if (category.subcategories) {
        for (const subcategory of category.subcategories) {
          let score = 0

          for (const keyword of subcategory.keywords) {
            if (description.includes(keyword)) {
              score += 0.9
            }
          }

          for (const pattern of subcategory.patterns) {
            if (pattern.test(description)) {
              score += 0.95
            }
          }

          if (score > subcategoryScore) {
            subcategoryScore = score
            bestSubcategory = subcategory
          }
        }
      }

      const totalScore = Math.max(categoryScore, subcategoryScore)

      if (totalScore > bestMatch.confidence) {
        bestMatch = {
          category,
          subcategory: bestSubcategory,
          confidence: totalScore,
        }
      }
    }

    return {
      ...transaction,
      category: bestMatch.category.id,
      subcategory: bestMatch.subcategory?.id,
      confidence: bestMatch.confidence,
    }
  }

  /**
   * Batch categorize multiple transactions
   */
  categorizeTransactions(
    transactions: Transaction[]
  ): Array<Transaction & { category: string; subcategory?: string; confidence: number }> {
    return transactions.map((transaction) => this.categorizeTransaction(transaction))
  }

  /**
   * Get all available categories
   */
  getCategories(): Category[] {
    return this.categories
  }

  /**
   * Get category by ID
   */
  getCategory(id: string): Category | undefined {
    return this.categories.find((cat) => cat.id === id)
  }

  /**
   * Learn from user corrections to improve future categorization
   */
  learnFromCorrection(
    transaction: Transaction,
    correctCategory: string,
    correctSubcategory?: string
  ): void {
    // This would typically update a machine learning model
    // For now, we'll just log the correction for future improvements
    console.log('Learning from correction:', {
      description: transaction.description,
      originalCategory: transaction.category,
      correctCategory,
      correctSubcategory,
    })
  }

  /**
   * Get spending insights by category
   */
  getCategoryInsights(
    transactions: Array<Transaction & { category: string; subcategory?: string }>
  ) {
    const insights = transactions
      .filter((t) => t.type === 'expense')
      .reduce(
        (acc, transaction) => {
          const categoryId = transaction.category
          if (!acc[categoryId]) {
            acc[categoryId] = {
              total: 0,
              count: 0,
              transactions: [],
            }
          }
          acc[categoryId].total += Math.abs(transaction.amount)
          acc[categoryId].count += 1
          acc[categoryId].transactions.push(transaction)
          return acc
        },
        {} as Record<string, { total: number; count: number; transactions: Transaction[] }>
      )

    // Add category details
    return Object.entries(insights).map(([categoryId, data]) => ({
      category: this.getCategory(categoryId),
      ...data,
      average: data.total / data.count,
    }))
  }

  /**
   * Predict future spending based on historical patterns
   */
  predictSpending(transactions: Array<Transaction & { category: string }>, daysAhead: number = 30) {
    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentTransactions = transactions.filter(
      (t) => t.date >= oneMonthAgo && t.type === 'expense'
    )

    const predictions = this.getCategories()
      .filter((cat) => cat.id !== 'income')
      .map((category) => {
        const categoryTransactions = recentTransactions.filter((t) => t.category === category.id)
        const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        const dailyAverage = totalSpent / 30

        return {
          category: category.id,
          predictedSpending: dailyAverage * daysAhead,
          confidence:
            categoryTransactions.length > 0 ? Math.min(categoryTransactions.length / 10, 1) : 0.1,
        }
      })
      .filter((pred) => pred.confidence > 0.2)

    return predictions
  }
}

// Export singleton instance
export const transactionCategorizer = new TransactionCategorizer()
