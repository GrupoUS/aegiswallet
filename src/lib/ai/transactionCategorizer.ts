export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  subcategory?: string;
  merchant?: string;
  location?: string;
  paymentMethod?: string;
  confidence?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories?: Subcategory[];
  keywords: string[];
  patterns: RegExp[];
}

export interface Subcategory {
  id: string;
  name: string;
  keywords: string[];
  patterns: RegExp[];
}

// Brazilian financial categories with local patterns
const BRAZILIAN_CATEGORIES: Category[] = [
  {
    color: '#ef4444',
    icon: '🍽️',
    id: 'food',
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
    name: 'Alimentação',
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
        keywords: [
          'supermercado',
          'mercado',
          'atacarejo',
          'atacadão',
          'carrefour',
          'pão de açúcar',
        ],
        name: 'Supermercado',
        patterns: [/supermercado/i, /mercado/i, /atacarejo/i, /atacadão/i],
      },
      {
        id: 'restaurant',
        keywords: ['restaurante', 'comida', 'refeição', 'almoço', 'jantar'],
        name: 'Restaurante',
        patterns: [/restaurante/i, /refeição/i],
      },
      {
        id: 'delivery',
        keywords: ['delivery', 'ifood', 'rappi', 'uber eats'],
        name: 'Delivery',
        patterns: [/delivery/i, /ifood/i, /rappi/i, /uber eats/i],
      },
    ],
  },
  {
    color: '#3b82f6',
    icon: '🚗',
    id: 'transport',
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
    name: 'Transporte',
    patterns: [/uber/i, /99/i, /taxi/i, /posto.*gasolina/i, /estacionamento/i],
    subcategories: [
      {
        id: 'ride_sharing',
        keywords: ['uber', '99', 'cabify'],
        name: 'Transporte App',
        patterns: [/uber/i, /99/i, /cabify/i],
      },
      {
        id: 'fuel',
        keywords: ['gasolina', 'álcool', 'posto', 'combustível'],
        name: 'Combustível',
        patterns: [/gasolina/i, /álcool/i, /posto/i, /combustível/i],
      },
      {
        id: 'public_transport',
        keywords: ['ônibus', 'metrô', 'trem', 'bilhete'],
        name: 'Transporte Público',
        patterns: [/ônibus/i, /metrô/i, /trem/i, /bilhete/i],
      },
    ],
  },
  {
    color: '#8b5cf6',
    icon: '🛍️',
    id: 'shopping',
    keywords: ['loja', 'shopping', 'roupa', 'calçado', 'compra', 'mercado', 'varejo'],
    name: 'Compras',
    patterns: [/shopping/i, /loja/i, /roupa/i, /calçado/i],
    subcategories: [
      {
        id: 'clothing',
        keywords: ['roupa', 'calçado', 'vestuário'],
        name: 'Roupas',
        patterns: [/roupa/i, /calçado/i, /vestuário/i],
      },
      {
        id: 'electronics',
        keywords: ['celular', 'computador', 'eletrônico'],
        name: 'Eletrônicos',
        patterns: [/celular/i, /computador/i, /eletrônico/i],
      },
    ],
  },
  {
    color: '#f59e0b',
    icon: '📄',
    id: 'utilities',
    keywords: ['energia', 'luz', 'água', 'internet', 'telefone', 'conta', 'boleto'],
    name: 'Contas',
    patterns: [/energia.*elétrica/i, /luz/i, /água/i, /internet/i, /telefone/i],
    subcategories: [
      {
        id: 'electricity',
        keywords: ['energia', 'luz', 'eletropaulo', 'light'],
        name: 'Energia',
        patterns: [/energia/i, /luz/i, /eletropaulo/i, /light/i],
      },
      {
        id: 'water',
        keywords: ['água', 'sabesp'],
        name: 'Água',
        patterns: [/água/i, /sabesp/i],
      },
      {
        id: 'internet',
        keywords: ['internet', 'net', 'vivo', 'claro', 'oi'],
        name: 'Internet',
        patterns: [/internet/i, /net/i, /vivo/i, /claro/i, /oi/i],
      },
    ],
  },
  {
    color: '#10b981',
    icon: '🏥',
    id: 'health',
    keywords: ['farmácia', 'médico', 'hospital', 'plano', 'saúde', 'remédio'],
    name: 'Saúde',
    patterns: [/farmácia/i, /médico/i, /hospital/i, /plano.*saúde/i],
    subcategories: [
      {
        id: 'pharmacy',
        keywords: ['farmácia', 'remédio', 'medicamento'],
        name: 'Farmácia',
        patterns: [/farmácia/i, /remédio/i, /medicamento/i],
      },
      {
        id: 'medical',
        keywords: ['médico', 'consulta', 'hospital'],
        name: 'Médico',
        patterns: [/médico/i, /consulta/i, /hospital/i],
      },
    ],
  },
  {
    color: '#ec4899',
    icon: '🎬',
    id: 'entertainment',
    keywords: ['cinema', 'netflix', 'spotify', 'show', 'teatro', 'jogo'],
    name: 'Entretenimento',
    patterns: [/cinema/i, /netflix/i, /spotify/i, /show/i],
    subcategories: [
      {
        id: 'streaming',
        keywords: ['netflix', 'spotify', 'prime', 'hbo'],
        name: 'Streaming',
        patterns: [/netflix/i, /spotify/i, /prime/i, /hbo/i],
      },
      {
        id: 'cinema',
        keywords: ['cinema', 'filmes'],
        name: 'Cinema',
        patterns: [/cinema/i, /filme/i],
      },
    ],
  },
  {
    color: '#22c55e',
    icon: '💰',
    id: 'income',
    keywords: ['salário', 'pagamento', 'recebimento', 'depósito', 'renda'],
    name: 'Receitas',
    patterns: [/salário/i, /pagamento/i, /recebimento/i, /depósito/i],
    subcategories: [
      {
        id: 'salary',
        keywords: ['salário', 'ordenado'],
        name: 'Salário',
        patterns: [/salário/i, /ordenado/i],
      },
      {
        id: 'freelance',
        keywords: ['freelance', 'pj', 'autônomo'],
        name: 'Freelance',
        patterns: [/freelance/i, /pj/i, /autônomo/i],
      },
    ],
  },
];

export class TransactionCategorizer {
  private categories: Category[];

  constructor() {
    this.categories = BRAZILIAN_CATEGORIES;
  }

  /**
   * Categorize a transaction using pattern matching and keyword analysis
   */
  categorizeTransaction(transaction: Transaction): Transaction & {
    category: string;
    subcategory?: string;
    confidence: number;
  } {
    const description = transaction.description.toLowerCase();
    let bestMatch: {
      category: Category;
      subcategory?: Subcategory;
      confidence: number;
    } = {
      category: this.categories[0],
      confidence: 0,
    };

    // Check income vs expense first
    if (transaction.type === 'income') {
      const incomeCategory = this.categories.find((cat) => cat.id === 'income');
      if (incomeCategory) {
        bestMatch = { category: incomeCategory, confidence: 0.9 };
      }
    }

    // Pattern matching
    for (const category of this.categories) {
      let categoryScore = 0;

      // Check category keywords
      for (const keyword of category.keywords) {
        if (description.includes(keyword)) {
          categoryScore += 0.8;
        }
      }

      // Check category patterns
      for (const pattern of category.patterns) {
        if (pattern.test(description)) {
          categoryScore += 0.9;
        }
      }

      // Check subcategories
      let bestSubcategory: Subcategory | undefined;
      let subcategoryScore = 0;

      if (category.subcategories) {
        for (const subcategory of category.subcategories) {
          let score = 0;

          for (const keyword of subcategory.keywords) {
            if (description.includes(keyword)) {
              score += 0.9;
            }
          }

          for (const pattern of subcategory.patterns) {
            if (pattern.test(description)) {
              score += 0.95;
            }
          }

          if (score > subcategoryScore) {
            subcategoryScore = score;
            bestSubcategory = subcategory;
          }
        }
      }

      const totalScore = Math.max(categoryScore, subcategoryScore);

      if (totalScore > bestMatch.confidence) {
        bestMatch = {
          category,
          confidence: totalScore,
          subcategory: bestSubcategory,
        };
      }
    }

    return {
      ...transaction,
      category: bestMatch.category.id,
      subcategory: bestMatch.subcategory?.id,
      confidence: bestMatch.confidence,
    };
  }

  /**
   * Batch categorize multiple transactions
   */
  categorizeTransactions(
    transactions: Transaction[]
  ): (Transaction & { category: string; subcategory?: string; confidence: number })[] {
    return transactions.map((transaction) => this.categorizeTransaction(transaction));
  }

  /**
   * Get all available categories
   */
  getCategories(): Category[] {
    return this.categories;
  }

  /**
   * Get category by ID
   */
  getCategory(id: string): Category | undefined {
    return this.categories.find((cat) => cat.id === id);
  }

  /**
   * Learn from user corrections to improve future categorization
   */
  learnFromCorrection(
    _transaction: Transaction,
    _correctCategory: string,
    _correctSubcategory?: string
  ): void {}

  /**
   * Get spending insights by category
   */
  getCategoryInsights(transactions: (Transaction & { category: string; subcategory?: string })[]) {
    const insights = transactions
      .filter((t) => t.type === 'expense')
      .reduce(
        (acc, transaction) => {
          const categoryId = transaction.category;
          if (!acc[categoryId]) {
            acc[categoryId] = {
              count: 0,
              total: 0,
              transactions: [],
            };
          }
          acc[categoryId].total += Math.abs(transaction.amount);
          acc[categoryId].count += 1;
          acc[categoryId].transactions.push(transaction);
          return acc;
        },
        {} as Record<string, { total: number; count: number; transactions: Transaction[] }>
      );

    // Add category details
    return Object.entries(insights).map(([categoryId, data]) => ({
      category: this.getCategory(categoryId),
      ...data,
      average: data.total / data.count,
    }));
  }

  /**
   * Predict future spending based on historical patterns
   */
  predictSpending(transactions: (Transaction & { category: string })[], daysAhead: number = 30) {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentTransactions = transactions.filter(
      (t) => t.date >= oneMonthAgo && t.type === 'expense'
    );

    const predictions = this.getCategories()
      .filter((cat) => cat.id !== 'income')
      .map((category) => {
        const categoryTransactions = recentTransactions.filter((t) => t.category === category.id);
        const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const dailyAverage = totalSpent / 30;

        return {
          category: category.id,
          confidence:
            categoryTransactions.length > 0 ? Math.min(categoryTransactions.length / 10, 1) : 0.1,
          predictedSpending: dailyAverage * daysAhead,
        };
      })
      .filter((pred) => pred.confidence > 0.2);

    return predictions;
  }
}

// Export singleton instance
export const transactionCategorizer = new TransactionCategorizer();
