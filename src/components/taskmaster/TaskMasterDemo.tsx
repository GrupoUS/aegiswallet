'use client';

import React, { useState } from 'react';
import { useTaskMasterAI, TaskMasterTask, AnalysisResult } from '@/lib/taskmaster-ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, CheckCircle, AlertCircle, Clock, Target } from 'lucide-react';

interface TaskMasterDemoProps {
  className?: string;
}

export function TaskMasterDemo({ className }: TaskMasterDemoProps) {
  const {
    isInitialized,
    isLoading,
    initialize,
    analyzeAndPlan,
    smartNextTask,
    expandWithThinking,
    validateSolution,
    getTasks,
    updateTaskStatus
  } = useTaskMasterAI();

  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('');
  const [tasks, setTasks] = useState<TaskMasterTask[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskMasterTask | null>(null);
  const [solution, setSolution] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleInitialize = async () => {
    addLog('Inicializando TaskMaster AI...');
    const result = await initialize();
    if (result.success) {
      addLog('✅ TaskMaster AI inicializado com sucesso!');
    } else {
      addLog(`❌ Erro na inicialização: ${result.error}`);
    }
  };

  const handleAnalyzeAndPlan = async () => {
    if (!problem.trim()) return;
    
    setIsProcessing(true);
    addLog(`Analisando problema: "${problem}"`);
    
    try {
      const result = await analyzeAndPlan(problem, context);
      if (result.success && result.data) {
        setTasks(result.data.tasks);
        setAnalysis(result.data.analysis);
        addLog(`✅ Análise concluída! ${result.data.tasks.length} tarefas geradas`);
        addLog(`📊 Complexidade: ${result.data.analysis.complexity}/10`);
      } else {
        addLog(`❌ Erro na análise: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSmartNextTask = async () => {
    setIsProcessing(true);
    addLog('Buscando próxima tarefa inteligente...');
    
    try {
      const result = await smartNextTask();
      if (result.success && result.data) {
        setSelectedTask(result.data.task);
        addLog(`🎯 Próxima tarefa sugerida: "${result.data.task.title}"`);
        addLog(`⏱️ Tempo estimado: ${result.data.recommendation.estimatedTime}`);
      } else if (result.success && !result.data) {
        addLog('ℹ️ Nenhuma tarefa pendente encontrada');
      } else {
        addLog(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExpandTask = async (taskId: string) => {
    setIsProcessing(true);
    addLog(`Expandindo tarefa com Sequential Thinking...`);
    
    try {
      const result = await expandWithThinking(taskId);
      if (result.success && result.data) {
        // Atualiza a lista de tarefas com as subtarefas
        const updatedTasks = await getTasks();
        if (updatedTasks.success) {
          setTasks(updatedTasks.data || []);
        }
        addLog(`🧠 Tarefa expandida! ${result.data.subtasks.length} subtarefas criadas`);
      } else {
        addLog(`❌ Erro na expansão: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidateSolution = async () => {
    if (!selectedTask || !solution.trim()) return;
    
    setIsProcessing(true);
    addLog(`Validando solução para: "${selectedTask.title}"`);
    
    try {
      const result = await validateSolution(selectedTask.id, solution);
      if (result.success && result.data) {
        const { validation, statusUpdate } = result.data;
        addLog(`${validation.isValid ? '✅' : '⚠️'} Validação: ${validation.feedback}`);
        addLog(`📈 Confiança: ${Math.round(validation.confidence * 100)}%`);
        
        // Atualiza a lista de tarefas
        const updatedTasks = await getTasks();
        if (updatedTasks.success) {
          setTasks(updatedTasks.data || []);
        }
        
        if (validation.isValid) {
          setSolution('');
          setSelectedTask(null);
        }
      } else {
        addLog(`❌ Erro na validação: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskMasterTask['status']) => {
    try {
      const result = await updateTaskStatus(taskId, status);
      if (result.success) {
        // Atualiza a lista de tarefas
        const updatedTasks = await getTasks();
        if (updatedTasks.success) {
          setTasks(updatedTasks.data || []);
        }
        addLog(`✅ Status atualizado para: ${status}`);
      }
    } catch (error) {
      addLog(`❌ Erro ao atualizar status: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  };

  const getPriorityColor = (priority: TaskMasterTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: TaskMasterTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            TaskMaster AI Demo
          </CardTitle>
          <CardDescription>
            Demonstração da integração TaskMaster + Sequential Thinking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isInitialized ? 'Inicializado' : 'Não inicializado'}
              </span>
            </div>
            {!isInitialized && (
              <Button onClick={handleInitialize} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Inicializar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análise e Planejamento */}
      {isInitialized && (
        <Card>
          <CardHeader>
            <CardTitle>1. Análise e Planejamento</CardTitle>
            <CardDescription>
              Descreva um problema para análise híbrida TaskMaster + Sequential Thinking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Problema</label>
              <Input
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Ex: Implementar sistema de autenticação"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contexto (opcional)</label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Contexto adicional sobre o problema..."
                className="mt-1"
                rows={3}
              />
            </div>
            <Button 
              onClick={handleAnalyzeAndPlan} 
              disabled={!problem.trim() || isProcessing}
              className="w-full"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analisar e Planejar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Análise Resultante */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Análise Sequential Thinking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Complexidade</label>
                <div className="text-2xl font-bold">{analysis.complexity}/10</div>
              </div>
              <div>
                <label className="text-sm font-medium">Confiança</label>
                <div className="text-2xl font-bold">{Math.round(analysis.confidence * 100)}%</div>
              </div>
              <div>
                <label className="text-sm font-medium">Tempo Estimado</label>
                <div className="text-lg font-semibold">{analysis.estimatedTime || 'N/A'}</div>
              </div>
            </div>
            
            {analysis.risks.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium">Riscos Identificados</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.risks.map((risk, index) => (
                    <Badge key={index} variant="destructive">{risk}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.recommendations.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium">Recomendações</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.recommendations.map((rec, index) => (
                    <Badge key={index} variant="secondary">{rec}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Tarefas */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Tarefas Geradas ({tasks.length})
              <Button onClick={handleSmartNextTask} disabled={isProcessing} size="sm">
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Próxima Tarefa Inteligente
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`p-4 border rounded-lg ${selectedTask?.id === task.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                          {task.priority}
                        </Badge>
                        {task.complexity && (
                          <Badge variant="outline">
                            Complexidade: {task.complexity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      {task.metadata?.parentTaskId && (
                        <Badge variant="secondary" className="text-xs">
                          Subtarefa
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTask(task)}
                        disabled={task.status === 'completed'}
                      >
                        Selecionar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExpandTask(task.id)}
                        disabled={isProcessing || task.subtasks?.length > 0}
                      >
                        Expandir
                      </Button>
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTaskStatus(task.id, 'in-progress')}
                        >
                          Iniciar
                        </Button>
                      )}
                      {task.status === 'in-progress' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                        >
                          Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validação de Solução */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle>Validação de Solução</CardTitle>
            <CardDescription>
              Tarefa selecionada: {selectedTask.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Solução Implementada</label>
              <Textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Descreva a solução implementada para validação..."
                className="mt-1"
                rows={4}
              />
            </div>
            <Button 
              onClick={handleValidateSolution} 
              disabled={!solution.trim() || isProcessing}
              className="w-full"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validar Solução
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Logs do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TaskMasterDemo;
