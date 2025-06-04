/**
 * TaskMaster AI Integration for AegisWallet
 * 
 * Integração do TaskMaster + Sequential Thinking para o projeto AegisWallet
 */

import { useState, useCallback, useRef } from 'react';

// Tipos para a integração
export interface TaskMasterTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complexity?: number;
  dependencies?: string[];
  subtasks?: TaskMasterTask[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface AnalysisResult {
  complexity: number;
  risks: string[];
  recommendations: string[];
  confidence: number;
  estimatedTime?: string;
  approach?: string;
}

export interface TaskMasterResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  analysis?: AnalysisResult;
  nextSteps?: string[];
}

// Configuração da integração
export interface TaskMasterConfig {
  apiEndpoint?: string;
  enableMocking?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  complexityThresholds?: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * Cliente TaskMaster AI
 */
export class TaskMasterAI {
  private config: TaskMasterConfig;
  private tasks: Map<string, TaskMasterTask> = new Map();
  private context: Map<string, any> = new Map();
  private initialized = false;

  constructor(config: TaskMasterConfig = {}) {
    this.config = {
      enableMocking: true,
      logLevel: 'info',
      complexityThresholds: {
        low: 3,
        medium: 6,
        high: 8
      },
      ...config
    };
  }

  /**
   * Inicializa o TaskMaster AI
   */
  async initialize(): Promise<TaskMasterResponse> {
    try {
      this.log('info', 'Inicializando TaskMaster AI...');
      
      // Simula inicialização
      await this.delay(500);
      
      this.initialized = true;
      this.log('info', 'TaskMaster AI inicializado com sucesso');
      
      return {
        success: true,
        data: {
          version: '1.0.0',
          environment: this.config.enableMocking ? 'mock' : 'production'
        }
      };
    } catch (error) {
      this.log('error', 'Erro ao inicializar TaskMaster AI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Análise e planejamento híbrido
   */
  async analyzeAndPlan(
    problem: string,
    context?: string
  ): Promise<TaskMasterResponse<{ tasks: TaskMasterTask[]; analysis: AnalysisResult }>> {
    this.ensureInitialized();
    
    try {
      this.log('info', 'Executando análise e planejamento para:', problem);
      
      // Simula análise Sequential Thinking
      const analysis = await this.performAnalysis(problem, context);
      
      // Simula criação de tarefas TaskMaster
      const tasks = await this.generateTasks(problem, analysis);
      
      // Salva tarefas
      tasks.forEach(task => this.tasks.set(task.id, task));
      
      return {
        success: true,
        data: { tasks, analysis },
        analysis,
        nextSteps: [
          'Revisar tarefas geradas',
          'Priorizar baseado na complexidade',
          'Iniciar com tarefas de menor risco'
        ]
      };
    } catch (error) {
      this.log('error', 'Erro na análise e planejamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na análise'
      };
    }
  }

  /**
   * Sugestão inteligente de próxima tarefa
   */
  async smartNextTask(
    projectId?: string,
    preferences?: { maxComplexity?: number; preferredType?: string }
  ): Promise<TaskMasterResponse<{ task: TaskMasterTask; recommendation: any }>> {
    this.ensureInitialized();
    
    try {
      const availableTasks = Array.from(this.tasks.values())
        .filter(task => task.status === 'pending');
      
      if (availableTasks.length === 0) {
        return {
          success: true,
          data: null,
          nextSteps: ['Criar novas tarefas', 'Revisar tarefas concluídas']
        };
      }
      
      // Análise de complexidade para cada tarefa
      const taskAnalysis = await Promise.all(
        availableTasks.map(async task => ({
          task,
          analysis: await this.analyzeTaskComplexity(task)
        }))
      );
      
      // Filtra por preferências
      let candidates = taskAnalysis;
      if (preferences?.maxComplexity) {
        candidates = candidates.filter(
          ({ analysis }) => analysis.complexity <= preferences.maxComplexity!
        );
      }
      
      // Seleciona melhor candidata
      const selected = candidates.sort((a, b) => {
        // Prioriza por: prioridade > baixa complexidade > confiança
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityWeight[a.task.priority];
        const bPriority = priorityWeight[b.task.priority];
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        if (a.analysis.complexity !== b.analysis.complexity) {
          return a.analysis.complexity - b.analysis.complexity;
        }
        return b.analysis.confidence - a.analysis.confidence;
      })[0];
      
      if (!selected) {
        return {
          success: false,
          error: 'Nenhuma tarefa adequada encontrada'
        };
      }
      
      const recommendation = {
        priority: this.getRecommendationPriority(selected.analysis),
        estimatedTime: this.estimateTime(selected.analysis.complexity),
        approach: this.suggestApproach(selected.analysis),
        warnings: this.generateWarnings(selected.analysis)
      };
      
      return {
        success: true,
        data: {
          task: selected.task,
          recommendation
        },
        analysis: selected.analysis
      };
    } catch (error) {
      this.log('error', 'Erro ao sugerir próxima tarefa:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na sugestão'
      };
    }
  }

  /**
   * Expansão de tarefa com análise profunda
   */
  async expandWithThinking(taskId: string): Promise<TaskMasterResponse<{
    originalTask: TaskMasterTask;
    subtasks: TaskMasterTask[];
    analysis: AnalysisResult;
  }>> {
    this.ensureInitialized();
    
    const originalTask = this.tasks.get(taskId);
    if (!originalTask) {
      return {
        success: false,
        error: 'Tarefa não encontrada'
      };
    }
    
    try {
      this.log('info', 'Expandindo tarefa:', originalTask.title);
      
      // Análise profunda da tarefa
      const analysis = await this.performDeepAnalysis(originalTask);
      
      // Geração de subtarefas
      const subtasks = await this.generateSubtasks(originalTask, analysis);
      
      // Atualiza tarefa original
      originalTask.subtasks = subtasks;
      originalTask.updatedAt = new Date();
      this.tasks.set(taskId, originalTask);
      
      // Salva subtarefas
      subtasks.forEach(subtask => this.tasks.set(subtask.id, subtask));
      
      return {
        success: true,
        data: {
          originalTask,
          subtasks,
          analysis
        },
        analysis
      };
    } catch (error) {
      this.log('error', 'Erro ao expandir tarefa:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na expansão'
      };
    }
  }

  /**
   * Validação de solução
   */
  async validateSolution(
    taskId: string,
    solution: string
  ): Promise<TaskMasterResponse<{
    validation: { isValid: boolean; confidence: number; feedback: string };
    statusUpdate: { status: string; notes: string };
    recommendations: string[];
  }>> {
    this.ensureInitialized();
    
    const task = this.tasks.get(taskId);
    if (!task) {
      return {
        success: false,
        error: 'Tarefa não encontrada'
      };
    }
    
    try {
      this.log('info', 'Validando solução para:', task.title);
      
      // Simula validação Sequential Thinking
      const validation = await this.performSolutionValidation(task, solution);
      
      // Atualiza status da tarefa
      const statusUpdate = {
        status: validation.isValid ? 'completed' : 'in-progress',
        notes: `Validação automática: ${validation.feedback}`
      };
      
      task.status = statusUpdate.status as any;
      task.updatedAt = new Date();
      if (!task.metadata) task.metadata = {};
      task.metadata.lastValidation = {
        timestamp: new Date(),
        result: validation,
        solution
      };
      
      this.tasks.set(taskId, task);
      
      const recommendations = this.generateSolutionRecommendations(validation, task);
      
      return {
        success: true,
        data: {
          validation,
          statusUpdate,
          recommendations
        }
      };
    } catch (error) {
      this.log('error', 'Erro ao validar solução:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na validação'
      };
    }
  }

  /**
   * Obtém todas as tarefas
   */
  async getTasks(filters?: {
    status?: TaskMasterTask['status'];
    priority?: TaskMasterTask['priority'];
    projectId?: string;
  }): Promise<TaskMasterResponse<TaskMasterTask[]>> {
    this.ensureInitialized();
    
    let tasks = Array.from(this.tasks.values());
    
    if (filters) {
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }
      if (filters.priority) {
        tasks = tasks.filter(task => task.priority === filters.priority);
      }
      if (filters.projectId) {
        tasks = tasks.filter(task => task.metadata?.projectId === filters.projectId);
      }
    }
    
    return {
      success: true,
      data: tasks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    };
  }

  /**
   * Atualiza status de uma tarefa
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskMasterTask['status'],
    notes?: string
  ): Promise<TaskMasterResponse<TaskMasterTask>> {
    this.ensureInitialized();
    
    const task = this.tasks.get(taskId);
    if (!task) {
      return {
        success: false,
        error: 'Tarefa não encontrada'
      };
    }
    
    task.status = status;
    task.updatedAt = new Date();
    if (notes) {
      if (!task.metadata) task.metadata = {};
      if (!task.metadata.notes) task.metadata.notes = [];
      task.metadata.notes.push({
        timestamp: new Date(),
        note: notes
      });
    }
    
    this.tasks.set(taskId, task);
    
    return {
      success: true,
      data: task
    };
  }

  /**
   * Obtém status do sistema
   */
  getSystemStatus() {
    return {
      initialized: this.initialized,
      tasksCount: this.tasks.size,
      contextSize: this.context.size,
      config: this.config
    };
  }

  // Métodos privados de simulação

  private async performAnalysis(problem: string, context?: string): Promise<AnalysisResult> {
    await this.delay(1000);
    
    const complexity = Math.floor(Math.random() * 10) + 1;
    const risks = this.generateRisks(problem, complexity);
    const recommendations = this.generateRecommendations(problem, complexity);
    
    return {
      complexity,
      risks,
      recommendations,
      confidence: Math.random() * 0.3 + 0.7 // 0.7 - 1.0
    };
  }

  private async generateTasks(problem: string, analysis: AnalysisResult): Promise<TaskMasterTask[]> {
    await this.delay(500);
    
    const taskCount = Math.min(Math.max(Math.floor(analysis.complexity / 2), 1), 5);
    const tasks: TaskMasterTask[] = [];
    
    for (let i = 0; i < taskCount; i++) {
      tasks.push({
        id: this.generateId(),
        title: `${problem} - Etapa ${i + 1}`,
        description: `Implementar parte ${i + 1} da solução para: ${problem}`,
        status: 'pending',
        priority: this.determinePriority(analysis.complexity, i),
        complexity: Math.floor(analysis.complexity / taskCount) + Math.floor(Math.random() * 3),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          generatedBy: 'taskmaster-ai',
          originalProblem: problem,
          analysisId: this.generateId()
        }
      });
    }
    
    return tasks;
  }

  private async analyzeTaskComplexity(task: TaskMasterTask): Promise<AnalysisResult> {
    await this.delay(300);
    
    const baseComplexity = task.complexity || Math.floor(Math.random() * 8) + 1;
    
    return {
      complexity: baseComplexity,
      risks: this.generateRisks(task.title, baseComplexity),
      recommendations: this.generateRecommendations(task.title, baseComplexity),
      confidence: Math.random() * 0.2 + 0.8
    };
  }

  private async performDeepAnalysis(task: TaskMasterTask): Promise<AnalysisResult> {
    await this.delay(800);
    
    const complexity = (task.complexity || 5) + Math.floor(Math.random() * 3);
    
    return {
      complexity,
      risks: [
        ...this.generateRisks(task.title, complexity),
        'Dependências técnicas complexas',
        'Possível necessidade de refatoração'
      ],
      recommendations: [
        ...this.generateRecommendations(task.title, complexity),
        'Implementar testes unitários',
        'Documentar decisões arquiteturais'
      ],
      confidence: Math.random() * 0.15 + 0.85
    };
  }

  private async generateSubtasks(task: TaskMasterTask, analysis: AnalysisResult): Promise<TaskMasterTask[]> {
    await this.delay(600);
    
    const subtaskCount = Math.min(Math.max(Math.floor(analysis.complexity / 3), 2), 6);
    const subtasks: TaskMasterTask[] = [];
    
    const subtaskTypes = [
      'Análise e design',
      'Implementação core',
      'Testes e validação',
      'Documentação',
      'Integração',
      'Otimização'
    ];
    
    for (let i = 0; i < subtaskCount; i++) {
      subtasks.push({
        id: this.generateId(),
        title: `${subtaskTypes[i] || `Subtarefa ${i + 1}`} - ${task.title}`,
        description: `${subtaskTypes[i] || 'Implementar'} para: ${task.description}`,
        status: 'pending',
        priority: task.priority,
        complexity: Math.max(1, Math.floor(analysis.complexity / subtaskCount)),
        dependencies: i > 0 ? [subtasks[i - 1].id] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          parentTaskId: task.id,
          generatedBy: 'taskmaster-ai-expansion',
          subtaskIndex: i
        }
      });
    }
    
    return subtasks;
  }

  private async performSolutionValidation(task: TaskMasterTask, solution: string): Promise<{
    isValid: boolean;
    confidence: number;
    feedback: string;
  }> {
    await this.delay(700);
    
    const isValid = Math.random() > 0.2; // 80% chance de ser válida
    const confidence = Math.random() * 0.2 + 0.8;
    
    const feedback = isValid
      ? 'Solução atende aos requisitos e segue boas práticas'
      : 'Solução precisa de ajustes para atender completamente aos requisitos';
    
    return { isValid, confidence, feedback };
  }

  private generateRisks(problem: string, complexity: number): string[] {
    const allRisks = [
      'Complexidade técnica alta',
      'Dependências externas',
      'Requisitos não claros',
      'Prazo apertado',
      'Recursos limitados',
      'Integração complexa',
      'Performance crítica',
      'Segurança sensível'
    ];
    
    const riskCount = Math.min(Math.floor(complexity / 2), 4);
    return allRisks.slice(0, riskCount);
  }

  private generateRecommendations(problem: string, complexity: number): string[] {
    const allRecommendations = [
      'Quebrar em tarefas menores',
      'Implementar testes desde o início',
      'Usar padrões estabelecidos',
      'Documentar decisões importantes',
      'Fazer revisões de código',
      'Implementar gradualmente',
      'Monitorar performance',
      'Validar com stakeholders'
    ];
    
    const recCount = Math.min(Math.floor(complexity / 2) + 1, 5);
    return allRecommendations.slice(0, recCount);
  }

  private determinePriority(complexity: number, index: number): TaskMasterTask['priority'] {
    if (complexity > 8) return 'urgent';
    if (complexity > 6) return 'high';
    if (index === 0) return 'high'; // Primeira tarefa sempre alta prioridade
    return 'medium';
  }

  private getRecommendationPriority(analysis: AnalysisResult): string {
    if (analysis.complexity > this.config.complexityThresholds!.high) return 'high';
    if (analysis.complexity > this.config.complexityThresholds!.medium) return 'medium';
    return 'low';
  }

  private estimateTime(complexity: number): string {
    if (complexity <= 3) return '2-4 horas';
    if (complexity <= 6) return '4-8 horas';
    if (complexity <= 8) return '1-2 dias';
    return '2-5 dias';
  }

  private suggestApproach(analysis: AnalysisResult): string {
    if (analysis.complexity > 8) return 'incremental';
    if (analysis.complexity > 5) return 'structured';
    return 'standard';
  }

  private generateWarnings(analysis: AnalysisResult): string[] {
    const warnings: string[] = [];
    
    if (analysis.complexity > 8) {
      warnings.push('Tarefa de alta complexidade - considere quebrar em subtarefas');
    }
    if (analysis.confidence < 0.7) {
      warnings.push('Baixa confiança na análise - revisar requisitos');
    }
    if (analysis.risks.length > 3) {
      warnings.push('Múltiplos riscos identificados - planejar mitigações');
    }
    
    return warnings;
  }

  private generateSolutionRecommendations(validation: any, task: TaskMasterTask): string[] {
    const recommendations: string[] = [];
    
    if (validation.isValid) {
      recommendations.push('Considerar adicionar testes de integração');
      recommendations.push('Documentar solução para referência futura');
    } else {
      recommendations.push('Revisar requisitos da tarefa');
      recommendations.push('Considerar abordagem alternativa');
      recommendations.push('Buscar feedback de outros desenvolvedores');
    }
    
    return recommendations;
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('TaskMaster AI não foi inicializado. Chame initialize() primeiro.');
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(level: string, message: string, ...args: any[]): void {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const configLevel = levels[this.config.logLevel as keyof typeof levels] ?? 2;
    const messageLevel = levels[level as keyof typeof levels] ?? 2;
    
    if (messageLevel <= configLevel) {
      const logMethod = level === 'error' ? console.error :
                       level === 'warn' ? console.warn :
                       level === 'debug' ? console.debug :
                       console.log;
      logMethod(`[TaskMaster AI] ${message}`, ...args);
    }
  }
}

/**
 * Hook React para usar TaskMaster AI
 */
export function useTaskMasterAI(config?: TaskMasterConfig) {
  const [taskmaster] = useState(() => new TaskMasterAI(config));
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const initPromise = useRef<Promise<any> | null>(null);

  const initialize = useCallback(async () => {
    if (isInitialized || initPromise.current) {
      return initPromise.current;
    }

    setIsLoading(true);
    initPromise.current = taskmaster.initialize();
    
    try {
      const result = await initPromise.current;
      if (result.success) {
        setIsInitialized(true);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [taskmaster, isInitialized]);

  const analyzeAndPlan = useCallback(async (problem: string, context?: string) => {
    if (!isInitialized) await initialize();
    return taskmaster.analyzeAndPlan(problem, context);
  }, [taskmaster, isInitialized, initialize]);

  const smartNextTask = useCallback(async (projectId?: string, preferences?: any) => {
    if (!isInitialized) await initialize();
    return taskmaster.smartNextTask(projectId, preferences);
  }, [taskmaster, isInitialized, initialize]);

  const expandWithThinking = useCallback(async (taskId: string) => {
    if (!isInitialized) await initialize();
    return taskmaster.expandWithThinking(taskId);
  }, [taskmaster, isInitialized, initialize]);

  const validateSolution = useCallback(async (taskId: string, solution: string) => {
    if (!isInitialized) await initialize();
    return taskmaster.validateSolution(taskId, solution);
  }, [taskmaster, isInitialized, initialize]);

  const getTasks = useCallback(async (filters?: any) => {
    if (!isInitialized) await initialize();
    return taskmaster.getTasks(filters);
  }, [taskmaster, isInitialized, initialize]);

  const updateTaskStatus = useCallback(async (taskId: string, status: any, notes?: string) => {
    if (!isInitialized) await initialize();
    return taskmaster.updateTaskStatus(taskId, status, notes);
  }, [taskmaster, isInitialized, initialize]);

  return {
    // Estado
    isInitialized,
    isLoading,
    
    // Métodos
    initialize,
    analyzeAndPlan,
    smartNextTask,
    expandWithThinking,
    validateSolution,
    getTasks,
    updateTaskStatus,
    
    // Instância direta (para casos avançados)
    taskmaster
  };
}

// Instância global (singleton)
let globalTaskMaster: TaskMasterAI | null = null;

export function getGlobalTaskMaster(config?: TaskMasterConfig): TaskMasterAI {
  if (!globalTaskMaster) {
    globalTaskMaster = new TaskMasterAI(config);
  }
  return globalTaskMaster;
}

export default TaskMasterAI;
