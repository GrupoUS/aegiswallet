// Sistema de metas de economia simplificado para o AegisWallet
// Usando localStorage para armazenar as metas até que as tabelas sejam criadas

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  goal_id: string;
  amount: number;
  date: string;
  description?: string;
  transaction_id?: string;
}

export interface GoalInsight {
  goal: SavingsGoal;
  progress_percentage: number;
  days_remaining: number;
  daily_target: number;
  weekly_target: number;
  monthly_target: number;
  is_on_track: boolean;
  projected_completion: string;
  recommendations: string[];
}

class GoalsService {
  private getStorageKey(userId: string): string {
    return `savings_goals_${userId}`;
  }

  private getProgressKey(userId: string): string {
    return `goal_progress_${userId}`;
  }

  private getStoredGoals(userId: string): SavingsGoal[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey(userId));
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveGoals(userId: string, goals: SavingsGoal[]): void {
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(goals));
  }

  private getStoredProgress(userId: string): GoalProgress[] {
    try {
      const stored = localStorage.getItem(this.getProgressKey(userId));
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveProgress(userId: string, progress: GoalProgress[]): void {
    localStorage.setItem(this.getProgressKey(userId), JSON.stringify(progress));
  }

  // Criar nova meta de economia
  async createGoal(userId: string, goalData: Omit<SavingsGoal, 'id' | 'user_id' | 'current_amount' | 'status' | 'created_at' | 'updated_at'>): Promise<SavingsGoal> {
    const goals = this.getStoredGoals(userId);
    
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      title: goalData.title,
      description: goalData.description,
      target_amount: goalData.target_amount,
      target_date: goalData.target_date,
      category: goalData.category,
      current_amount: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    goals.push(newGoal);
    this.saveGoals(userId, goals);
    
    return newGoal;
  }

  // Listar metas do usuário
  async getUserGoals(userId: string, status?: string): Promise<SavingsGoal[]> {
    const goals = this.getStoredGoals(userId);
    
    if (status) {
      return goals.filter(goal => goal.status === status);
    }
    
    return goals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Obter meta específica
  async getGoal(goalId: string, userId: string): Promise<SavingsGoal | null> {
    const goals = this.getStoredGoals(userId);
    return goals.find(goal => goal.id === goalId) || null;
  }

  // Adicionar progresso à meta
  async addProgress(userId: string, goalId: string, amount: number, description?: string, transactionId?: string): Promise<void> {
    const goals = this.getStoredGoals(userId);
    const progress = this.getStoredProgress(userId);
    
    // Adicionar novo progresso
    const newProgress: GoalProgress = {
      goal_id: goalId,
      amount: amount,
      date: new Date().toISOString(),
      description: description,
      transaction_id: transactionId
    };
    
    progress.push(newProgress);
    this.saveProgress(userId, progress);

    // Atualizar valor atual da meta
    const goalIndex = goals.findIndex(goal => goal.id === goalId);
    if (goalIndex !== -1) {
      goals[goalIndex].current_amount += amount;
      goals[goalIndex].updated_at = new Date().toISOString();
      
      // Verificar se a meta foi completada
      if (goals[goalIndex].current_amount >= goals[goalIndex].target_amount) {
        goals[goalIndex].status = 'completed';
      }
      
      this.saveGoals(userId, goals);
    }
  }

  // Obter progresso de uma meta
  async getGoalProgress(userId: string, goalId: string): Promise<GoalProgress[]> {
    const progress = this.getStoredProgress(userId);
    return progress
      .filter(p => p.goal_id === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Calcular insights da meta
  async getGoalInsights(userId: string, goalId: string): Promise<GoalInsight | null> {
    const goal = await this.getGoal(goalId, userId);
    if (!goal) return null;

    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const progressPercentage = (goal.current_amount / goal.target_amount) * 100;
    const remainingAmount = goal.target_amount - goal.current_amount;
    
    const dailyTarget = daysRemaining > 0 ? remainingAmount / daysRemaining : 0;
    const weeklyTarget = dailyTarget * 7;
    const monthlyTarget = dailyTarget * 30;

    // Calcular se está no caminho certo
    const totalDays = this.getDaysBetween(new Date(goal.created_at), targetDate);
    const daysPassed = this.getDaysBetween(new Date(goal.created_at), today);
    const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;
    const isOnTrack = progressPercentage >= expectedProgress * 0.9; // 90% de tolerância

    // Projeção de conclusão
    const progress = await this.getGoalProgress(userId, goalId);
    const recentProgress = progress.slice(0, 7); // últimos 7 registros
    const avgDailyProgress = recentProgress.length > 0 
      ? recentProgress.reduce((sum, p) => sum + p.amount, 0) / recentProgress.length 
      : 0;

    const projectedDays = avgDailyProgress > 0 ? Math.ceil(remainingAmount / avgDailyProgress) : daysRemaining;
    const projectedCompletion = new Date(today.getTime() + projectedDays * 24 * 60 * 60 * 1000).toISOString();

    // Gerar recomendações
    const recommendations = this.generateRecommendations(goal, progressPercentage, daysRemaining, isOnTrack, dailyTarget);

    return {
      goal,
      progress_percentage: progressPercentage,
      days_remaining: daysRemaining,
      daily_target: dailyTarget,
      weekly_target: weeklyTarget,
      monthly_target: monthlyTarget,
      is_on_track: isOnTrack,
      projected_completion: projectedCompletion,
      recommendations
    };
  }

  // Gerar recomendações personalizadas
  private generateRecommendations(goal: SavingsGoal, progressPercentage: number, daysRemaining: number, isOnTrack: boolean, dailyTarget: number): string[] {
    const recommendations: string[] = [];

    if (progressPercentage < 25) {
      recommendations.push('🚀 Você está no início! Considere automatizar uma transferência diária para sua meta.');
      recommendations.push('💡 Revise seus gastos diários e identifique onde pode economizar.');
    } else if (progressPercentage < 50) {
      recommendations.push('📈 Bom progresso! Mantenha o ritmo e considere aumentar um pouco o valor diário.');
      recommendations.push('🎯 Você está no caminho certo. Foque em manter a consistência.');
    } else if (progressPercentage < 75) {
      recommendations.push('🔥 Excelente! Você está mais da metade do caminho.');
      recommendations.push('⚡ Considere um esforço extra para acelerar o progresso.');
    } else if (progressPercentage < 100) {
      recommendations.push('🏆 Quase lá! Você está na reta final.');
      recommendations.push('💪 Mantenha o foco, a meta está ao seu alcance.');
    }

    if (!isOnTrack && daysRemaining > 0) {
      recommendations.push(`⏰ Para ficar em dia, você precisa economizar R$ ${dailyTarget.toFixed(2)} por dia.`);
      recommendations.push('📊 Considere revisar seu orçamento para acelerar o progresso.');
    }

    if (daysRemaining < 30 && progressPercentage < 80) {
      recommendations.push('🚨 Tempo limitado! Considere um esforço concentrado nas próximas semanas.');
    }

    if (dailyTarget > 100) {
      recommendations.push('💰 Meta ambiciosa! Considere dividir em metas menores ou estender o prazo.');
    }

    return recommendations;
  }

  // Calcular dias entre duas datas
  private getDaysBetween(date1: Date, date2: Date): number {
    return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Atualizar meta
  async updateGoal(userId: string, goalId: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal | null> {
    const goals = this.getStoredGoals(userId);
    const goalIndex = goals.findIndex(goal => goal.id === goalId);
    
    if (goalIndex === -1) return null;
    
    goals[goalIndex] = {
      ...goals[goalIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveGoals(userId, goals);
    return goals[goalIndex];
  }

  // Deletar meta
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const goals = this.getStoredGoals(userId);
    const progress = this.getStoredProgress(userId);
    
    // Remover meta
    const filteredGoals = goals.filter(goal => goal.id !== goalId);
    this.saveGoals(userId, filteredGoals);
    
    // Remover progresso relacionado
    const filteredProgress = progress.filter(p => p.goal_id !== goalId);
    this.saveProgress(userId, filteredProgress);
  }

  // Obter estatísticas gerais das metas
  async getGoalsStatistics(userId: string): Promise<{
    total_goals: number;
    active_goals: number;
    completed_goals: number;
    total_saved: number;
    total_target: number;
    average_progress: number;
  }> {
    const goals = this.getStoredGoals(userId);
    
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const averageProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return {
      total_goals: totalGoals,
      active_goals: activeGoals,
      completed_goals: completedGoals,
      total_saved: totalSaved,
      total_target: totalTarget,
      average_progress: averageProgress
    };
  }

  // Sugerir metas baseadas no perfil financeiro
  async suggestGoals(monthlyIncome: number, monthlyExpenses: number): Promise<Array<{
    title: string;
    description: string;
    suggested_amount: number;
    suggested_months: number;
    category: string;
  }>> {
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    const suggestions = [];

    // Meta de emergência (6 meses de gastos)
    suggestions.push({
      title: 'Reserva de Emergência',
      description: 'Fundo para cobrir 6 meses de gastos essenciais',
      suggested_amount: monthlyExpenses * 6,
      suggested_months: 12,
      category: 'Emergência'
    });

    // Meta de viagem (baseada em 10% da renda)
    if (monthlySurplus > 0) {
      suggestions.push({
        title: 'Viagem dos Sonhos',
        description: 'Economize para aquela viagem especial',
        suggested_amount: monthlyIncome * 0.1 * 12,
        suggested_months: 12,
        category: 'Lazer'
      });
    }

    // Meta de investimento
    if (monthlySurplus > 500) {
      suggestions.push({
        title: 'Investimento Inicial',
        description: 'Comece a investir para o futuro',
        suggested_amount: 10000,
        suggested_months: 18,
        category: 'Investimento'
      });
    }

    // Meta de compra (baseada em 20% da renda)
    suggestions.push({
      title: 'Compra Especial',
      description: 'Para aquele item que você sempre quis',
      suggested_amount: monthlyIncome * 0.2 * 6,
      suggested_months: 6,
      category: 'Compras'
    });

    return suggestions;
  }
}

export const goalsService = new GoalsService();

// Hook para usar o sistema de metas
export function useGoals() {
  const createGoal = async (userId: string, goalData: Omit<SavingsGoal, 'id' | 'user_id' | 'current_amount' | 'status' | 'created_at' | 'updated_at'>) => {
    return await goalsService.createGoal(userId, goalData);
  };

  const getUserGoals = async (userId: string, status?: string) => {
    return await goalsService.getUserGoals(userId, status);
  };

  const getGoal = async (goalId: string, userId: string) => {
    return await goalsService.getGoal(goalId, userId);
  };

  const addProgress = async (userId: string, goalId: string, amount: number, description?: string) => {
    return await goalsService.addProgress(userId, goalId, amount, description);
  };

  const getGoalInsights = async (userId: string, goalId: string) => {
    return await goalsService.getGoalInsights(userId, goalId);
  };

  const updateGoal = async (userId: string, goalId: string, updates: Partial<SavingsGoal>) => {
    return await goalsService.updateGoal(userId, goalId, updates);
  };

  const deleteGoal = async (userId: string, goalId: string) => {
    return await goalsService.deleteGoal(userId, goalId);
  };

  const getGoalsStatistics = async (userId: string) => {
    return await goalsService.getGoalsStatistics(userId);
  };

  const suggestGoals = async (monthlyIncome: number, monthlyExpenses: number) => {
    return await goalsService.suggestGoals(monthlyIncome, monthlyExpenses);
  };

  return {
    createGoal,
    getUserGoals,
    getGoal,
    addProgress,
    getGoalInsights,
    updateGoal,
    deleteGoal,
    getGoalsStatistics,
    suggestGoals
  };
}
