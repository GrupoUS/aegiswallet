import { analyticsService } from './financial-services';

// Tipos para relatórios
export interface ReportData {
  user: {
    name: string;
    email: string;
  };
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  };
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  transactions: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
  }>;
  trends: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
}

class PDFExportService {
  // Gerar relatório financeiro completo
  async generateFinancialReport(userId: string, startDate: string, endDate: string, userName: string, userEmail: string): Promise<string> {
    try {
      // Coletar dados do relatório
      const reportData = await this.collectReportData(userId, startDate, endDate, userName, userEmail);
      
      // Gerar PDF usando canvas e jsPDF (simulado)
      const pdfContent = this.generatePDFContent(reportData);
      
      // Retornar URL do blob para download
      return this.createPDFBlob(pdfContent);
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      throw error;
    }
  }

  // Coletar dados para o relatório
  private async collectReportData(userId: string, startDate: string, endDate: string, userName: string, userEmail: string): Promise<ReportData> {
    // Buscar dados de gastos por categoria
    const categories = await analyticsService.getExpensesByCategory(userId, startDate, endDate);
    
    // Buscar tendências
    const trends = await analyticsService.getSpendingTrend(userId, 6);
    
    // Buscar transações do período
    const transactions = await analyticsService.getTransactionsByPeriod(userId, startDate, endDate);
    
    // Calcular totais
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCategoryExpenses = categories.reduce((sum, c) => sum + c.amount, 0);

    return {
      user: {
        name: userName,
        email: userEmail
      },
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionCount: transactions.length
      },
      categories: categories.map(cat => ({
        name: cat.category,
        amount: cat.amount,
        percentage: totalCategoryExpenses > 0 ? (cat.amount / totalCategoryExpenses) * 100 : 0
      })),
      transactions: transactions.map(t => ({
        date: new Date(t.date).toLocaleDateString('pt-BR'),
        description: t.description,
        category: t.category_name || 'Sem categoria',
        amount: t.amount,
        type: t.type as 'income' | 'expense' // Explicitly cast to the union type
      })),
      trends
    };
  }

  // Gerar conteúdo HTML do PDF
  private generatePDFContent(data: ReportData): string {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatDate = (dateStr: string) => 
      new Date(dateStr).toLocaleDateString('pt-BR');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório Financeiro - AegisWallet</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
          }
          .user-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .period {
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 25px;
            color: #1e40af;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
          }
          .summary-card.income {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
          .summary-card.expense {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          .summary-card.balance {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          }
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .summary-label {
            font-size: 14px;
            opacity: 0.9;
          }
          .section {
            margin-bottom: 35px;
          }
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .categories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }
          .category-item {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
          }
          .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .category-name {
            font-weight: 600;
            color: #374151;
          }
          .category-amount {
            font-weight: bold;
            color: #ef4444;
          }
          .category-bar {
            background: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
          }
          .category-fill {
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
            height: 100%;
            transition: width 0.3s ease;
          }
          .category-percentage {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
          }
          .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .transactions-table th,
          .transactions-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          .transactions-table th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          .transaction-income {
            color: #10b981;
            font-weight: 600;
          }
          .transaction-expense {
            color: #ef4444;
            font-weight: 600;
          }
          .trends-chart {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .page-break {
            page-break-before: always;
          }
          @media print {
            body { margin: 0; }
            .summary { grid-template-columns: repeat(2, 1fr); }
            .categories-grid { grid-template-columns: repeat(2, 1fr); }
          }
        </style>
      </head>
      <body>
        <!-- Cabeçalho -->
        <div class="header">
          <div class="logo">🛡️ AegisWallet</div>
          <div class="subtitle">Relatório Financeiro Detalhado</div>
        </div>

        <!-- Informações do usuário -->
        <div class="user-info">
          <strong>Usuário:</strong> ${data.user.name}<br>
          <strong>Email:</strong> ${data.user.email}<br>
          <strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}
        </div>

        <!-- Período -->
        <div class="period">
          Período: ${formatDate(data.period.start)} até ${formatDate(data.period.end)}
        </div>

        <!-- Resumo -->
        <div class="section">
          <div class="section-title">📊 Resumo Financeiro</div>
          <div class="summary">
            <div class="summary-card income">
              <div class="summary-value">${formatCurrency(data.summary.totalIncome)}</div>
              <div class="summary-label">Total de Receitas</div>
            </div>
            <div class="summary-card expense">
              <div class="summary-value">${formatCurrency(data.summary.totalExpenses)}</div>
              <div class="summary-label">Total de Gastos</div>
            </div>
            <div class="summary-card balance">
              <div class="summary-value">${formatCurrency(data.summary.balance)}</div>
              <div class="summary-label">Saldo do Período</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${data.summary.transactionCount}</div>
              <div class="summary-label">Total de Transações</div>
            </div>
          </div>
        </div>

        <!-- Gastos por Categoria -->
        <div class="section">
          <div class="section-title">🏷️ Gastos por Categoria</div>
          <div class="categories-grid">
            ${data.categories.map(cat => `
              <div class="category-item">
                <div class="category-header">
                  <span class="category-name">${cat.name}</span>
                  <span class="category-amount">${formatCurrency(cat.amount)}</span>
                </div>
                <div class="category-bar">
                  <div class="category-fill" style="width: ${cat.percentage}%"></div>
                </div>
                <div class="category-percentage">${cat.percentage.toFixed(1)}% do total</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Quebra de página para transações -->
        <div class="page-break"></div>

        <!-- Transações -->
        <div class="section">
          <div class="section-title">💳 Histórico de Transações</div>
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${data.transactions.slice(0, 50).map(t => `
                <tr>
                  <td>${t.date}</td>
                  <td>${t.description}</td>
                  <td>${t.category}</td>
                  <td class="transaction-${t.type}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${data.transactions.length > 50 ? `
            <p style="text-align: center; color: #6b7280; margin-top: 15px;">
              Mostrando as primeiras 50 transações de ${data.transactions.length} total.
            </p>
          ` : ''}
        </div>

        <!-- Tendências -->
        ${data.trends.length > 0 ? `
          <div class="section">
            <div class="section-title">📈 Tendência dos Últimos Meses</div>
            <div class="trends-chart">
              <p>Evolução de receitas e gastos nos últimos ${data.trends.length} meses</p>
              <table class="transactions-table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Receitas</th>
                    <th>Gastos</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.trends.map(trend => `
                    <tr>
                      <td>${trend.month}</td>
                      <td class="transaction-income">${formatCurrency(trend.income)}</td>
                      <td class="transaction-expense">${formatCurrency(trend.expenses)}</td>
                      <td class="${trend.balance >= 0 ? 'transaction-income' : 'transaction-expense'}">
                        ${formatCurrency(trend.balance)}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Rodapé -->
        <div class="footer">
          <p>Relatório gerado automaticamente pelo AegisWallet</p>
          <p>Este documento contém informações confidenciais. Mantenha-o seguro.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Criar blob do PDF para download
  private createPDFBlob(htmlContent: string): string {
    // Simular criação de PDF (em produção, usaria jsPDF ou similar)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }

  // Gerar relatório de categoria específica
  async generateCategoryReport(userId: string, categoryId: string, startDate: string, endDate: string): Promise<string> {
    try {
      // Buscar transações da categoria
      const transactions = await analyticsService.getTransactionsByCategory(userId, categoryId, startDate, endDate);
      
      const htmlContent = this.generateCategoryReportContent(transactions, startDate, endDate);
      return this.createPDFBlob(htmlContent);
    } catch (error) {
      console.error('Erro ao gerar relatório de categoria:', error);
      throw error;
    }
  }

  // Gerar conteúdo do relatório de categoria
  private generateCategoryReportContent(transactions: any[], startDate: string, endDate: string): string {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryName = transactions[0]?.category_name || 'Categoria';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Categoria - ${categoryName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Categoria: ${categoryName}</h1>
          <p>Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}</p>
        </div>
        
        <div class="summary">
          <h3>Resumo</h3>
          <p><strong>Total gasto:</strong> ${formatCurrency(total)}</p>
          <p><strong>Número de transações:</strong> ${transactions.length}</p>
          <p><strong>Média por transação:</strong> ${formatCurrency(total / transactions.length)}</p>
        </div>

        <h3>Transações</h3>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(t => `
              <tr>
                <td>${new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td>${t.description}</td>
                <td>${formatCurrency(t.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
}

export const pdfExportService = new PDFExportService();

// Hook para usar exportação de PDF
export function usePDFExport() {
  const generateFinancialReport = async (userId: string, startDate: string, endDate: string, userName: string, userEmail: string) => {
    return await pdfExportService.generateFinancialReport(userId, startDate, endDate, userName, userEmail);
  };

  const generateCategoryReport = async (userId: string, categoryId: string, startDate: string, endDate: string) => {
    return await pdfExportService.generateCategoryReport(userId, categoryId, startDate, endDate);
  };

  const downloadReport = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    generateFinancialReport,
    generateCategoryReport,
    downloadReport
  };
}
