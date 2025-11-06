export interface Translation {
  // Voice Commands
  voice: {
    commands: {
      balance: string[];
      budget: string[];
      bills: string[];
      incoming: string[];
      projection: string[];
      transfer: string[];
    };
    responses: {
      greeting: string;
      listening: string;
      processing: string;
      error: string;
      success: string;
      notSupported: string;
    };
    hints: {
      tapToSpeak: string;
      availableCommands: string;
      commands: {
        balance: string;
        budget: string;
        bills: string;
        incoming: string;
        projection: string;
        transfer: string;
      };
    };
  };

  // Financial Terms
  financial: {
    currency: string;
    balance: string;
    income: string;
    expense: string;
    transfer: string;
    payment: string;
    invoice: string;
    receipt: string;
    budget: string;
    savings: string;
    investment: string;
    dueDate: string;
    overdue: string;
    paid: string;
    pending: string;
    scheduled: string;
  };

  // Categories
  categories: {
    food: string;
    transport: string;
    shopping: string;
    utilities: string;
    health: string;
    entertainment: string;
    income: string;
    other: string;
  };

  // Actions
  actions: {
    pay: string;
    transfer: string;
    deposit: string;
    withdraw: string;
    schedule: string;
    cancel: string;
    confirm: string;
    edit: string;
    delete: string;
    view: string;
    export: string;
    import: string;
  };

  // Status Messages
  status: {
    loading: string;
    processing: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    empty: string;
    noData: string;
  };

  // Accessibility
  accessibility: {
    voiceControl: string;
    voiceActivation: string;
    screenReader: string;
    keyboardNavigation: string;
    highContrast: string;
    largeText: string;
    reducedMotion: string;
    voiceAnnouncements: string;
  };

  // Errors
  errors: {
    network: string;
    authentication: string;
    permission: string;
    validation: string;
    notFound: string;
    serverError: string;
    voiceNotSupported: string;
    microphoneAccess: string;
  };

  // Time Formats
  timeFormats: {
    fullDate: string;
    shortDate: string;
    time: string;
    dateTime: string;
    relativeTime: {
      today: string;
      yesterday: string;
      tomorrow: string;
      thisWeek: string;
      lastWeek: string;
      thisMonth: string;
      lastMonth: string;
    };
  };
}

export const ptBR: Translation = {
  voice: {
    commands: {
      balance: [
        'como está meu saldo',
        'qual é o meu saldo',
        'quanto tenho na conta',
        'meu saldo',
        'saldo da conta',
      ],
      budget: [
        'quanto posso gastar esse mês',
        'qual meu limite de gastos',
        'quanto tenho disponível para gastar',
        'meu orçamento mensal',
        'limite de gastos',
      ],
      bills: [
        'tem algum boleto programado para pagar',
        'contas para pagar',
        'boleto para pagar',
        'quais contas vencem',
        'pagamentos pendentes',
      ],
      incoming: [
        'tem algum recebimento programado para entrar',
        'receitas programadas',
        'dinheiro para entrar',
        'recebimentos futuros',
        'entradas de dinheiro',
      ],
      projection: [
        'como ficará meu saldo no final do mês',
        'projeção de saldo',
        'saldo projetado',
        'quanto vou ter no fim do mês',
        'saldo final do mês',
      ],
      transfer: [
        'faz uma transferência para',
        'transferir dinheiro para',
        'fazer transferência para',
        'enviar dinheiro para',
        'pagar para',
      ],
    },
    responses: {
      greeting: 'Olá! Como posso ajudar com suas finanças hoje?',
      listening: 'Estou ouvindo...',
      processing: 'Processando comando...',
      error: 'Não entendi. Poderia repetir?',
      success: 'Comando processado com sucesso!',
      notSupported: 'Seu navegador não suporta reconhecimento de voz',
    },
    hints: {
      tapToSpeak: 'Toque para falar',
      availableCommands: 'Comandos disponíveis:',
      commands: {
        balance: 'Meu saldo',
        budget: 'Orçamento',
        bills: 'Contas a pagar',
        incoming: 'Recebimentos',
        projection: 'Projeção',
        transfer: 'Transferência',
      },
    },
  },

  financial: {
    currency: 'R$',
    balance: 'Saldo',
    income: 'Receita',
    expense: 'Despesa',
    transfer: 'Transferência',
    payment: 'Pagamento',
    invoice: 'Fatura',
    receipt: 'Recibo',
    budget: 'Orçamento',
    savings: 'Poupança',
    investment: 'Investimento',
    dueDate: 'Data de vencimento',
    overdue: 'Vencido',
    paid: 'Pago',
    pending: 'Pendente',
    scheduled: 'Agendado',
  },

  categories: {
    food: 'Alimentação',
    transport: 'Transporte',
    shopping: 'Compras',
    utilities: 'Contas',
    health: 'Saúde',
    entertainment: 'Entretenimento',
    income: 'Receitas',
    other: 'Outros',
  },

  actions: {
    pay: 'Pagar',
    transfer: 'Transferir',
    deposit: 'Depositar',
    withdraw: 'Sacar',
    schedule: 'Agendar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    edit: 'Editar',
    delete: 'Excluir',
    view: 'Visualizar',
    export: 'Exportar',
    import: 'Importar',
  },

  status: {
    loading: 'Carregando...',
    processing: 'Processando...',
    success: 'Sucesso!',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Informação',
    empty: 'Nenhum item encontrado',
    noData: 'Sem dados disponíveis',
  },

  accessibility: {
    voiceControl: 'Controle por voz',
    voiceActivation: 'Ativação por voz',
    screenReader: 'Leitor de tela',
    keyboardNavigation: 'Navegação por teclado',
    highContrast: 'Alto contraste',
    largeText: 'Texto grande',
    reducedMotion: 'Movimento reduzido',
    voiceAnnouncements: 'Anúncios por voz',
  },

  errors: {
    network: 'Erro de conexão. Verifique sua internet.',
    authentication: 'Erro de autenticação. Faça login novamente.',
    permission: 'Você não tem permissão para realizar esta ação.',
    validation: 'Dados inválidos. Verifique e tente novamente.',
    notFound: 'Página não encontrada.',
    serverError: 'Erro interno do servidor. Tente novamente mais tarde.',
    voiceNotSupported: 'Seu navegador não suporta reconhecimento de voz.',
    microphoneAccess: 'Permissão para microfone negada. Habilite nas configurações do navegador.',
  },

  timeFormats: {
    fullDate: 'dd/MM/yyyy',
    shortDate: 'dd/MM',
    time: 'HH:mm',
    dateTime: 'dd/MM/yyyy HH:mm',
    relativeTime: {
      today: 'Hoje',
      yesterday: 'Ontem',
      tomorrow: 'Amanhã',
      thisWeek: 'Esta semana',
      lastWeek: 'Semana passada',
      thisMonth: 'Este mês',
      lastMonth: 'Mês passado',
    },
  },
};

// Brazilian localization utilities
export const brazilianLocalization = {
  /**
   * Format currency to Brazilian Real
   */
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  },

  /**
   * Format date to Brazilian format
   */
  formatDate: (date: Date, format: 'full' | 'short' | 'time' = 'full'): string => {
    switch (format) {
      case 'full':
        return date.toLocaleDateString('pt-BR');
      case 'short':
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        });
      case 'time':
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      default:
        return date.toLocaleDateString('pt-BR');
    }
  },

  /**
   * Format relative time in Portuguese
   */
  formatRelativeTime: (date: Date): string => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays > 0 && diffDays <= 7) return `Em ${diffDays} dias`;
    if (diffDays < 0 && diffDays >= -7) return `Há ${Math.abs(diffDays)} dias`;

    return date.toLocaleDateString('pt-BR');
  },

  /**
   * Format phone number to Brazilian format
   */
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  },

  /**
   * Validate CPF (Brazilian tax ID)
   */
  validateCPF: (cpf: string): boolean => {
    const cleanedCPF = cpf.replace(/[^\d]/g, '');
    if (cleanedCPF.length !== 11) return false;

    // Basic CPF validation
    let sum = 0;
    let remainder: number;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanedCPF.substring(i - 1, i), 10) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanedCPF.substring(9, 10), 10)) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanedCPF.substring(i - 1, i), 10) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanedCPF.substring(10, 11), 10)) return false;

    return true;
  },

  /**
   * Validate CNPJ (Brazilian company tax ID)
   */
  validateCNPJ: (cnpj: string): boolean => {
    const cleanedCNPJ = cnpj.replace(/[^\d]/g, '');
    if (cleanedCNPJ.length !== 14) return false;

    // Basic CNPJ validation
    // First digit verification
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanedCNPJ[i], 10) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }

    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    // Second digit verification
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanedCNPJ[i], 10) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }

    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    return digit1 === parseInt(cleanedCNPJ[12], 10) && digit2 === parseInt(cleanedCNPJ[13], 10);
  },

  /**
   * Get Brazilian states
   */
  getStates: () => [
    { code: 'AC', name: 'Acre' },
    { code: 'AL', name: 'Alagoas' },
    { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },
    { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' },
    { code: 'MT', name: 'Mato Grosso' },
    { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'PA', name: 'Pará' },
    { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' },
    { code: 'RR', name: 'Roraima' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },
    { code: 'SE', name: 'Sergipe' },
    { code: 'TO', name: 'Tocantins' },
  ],
};
