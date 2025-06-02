
'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FinancialAIAssistant, type AIResponse } from '@/lib/ai-financial-assistant';
import type { User } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
  data?: any;
}

export function useFinancialAI() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assistant, setAssistant] = useState<FinancialAIAssistant | null>(null);

  // Obter usuário atual do Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Inicializar o assistente quando o usuário estiver disponível
  const initializeAssistant = useCallback(() => {
    if (user?.id && !assistant) {
      const newAssistant = new FinancialAIAssistant(user.id);
      setAssistant(newAssistant);
      
      // Adicionar mensagem de boas-vindas
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: '🤖 Olá! Sou seu assistente financeiro inteligente. Posso ajudar você a:\n\n✅ Adicionar e gerenciar transações\n✅ Criar e apagar lembretes de contas\n✅ Analisar seus gastos\n✅ Categorizar despesas\n\nComo posso te ajudar hoje?',
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          'Adicionar transação de R$ 50 em alimentação',
          'Criar lembrete de conta de luz',
          'Apagar todos os lembretes',
          'Analise meus gastos do mês'
        ]
      };
      
      setMessages([welcomeMessage]);
    }
  }, [user?.id, assistant]);

  // Inicializar assistente quando usuário mudar
  useEffect(() => {
    if (user?.id) {
      initializeAssistant();
    } else {
      setAssistant(null);
      setMessages([]);
    }
  }, [user?.id, initializeAssistant]);

  // Enviar mensagem para o assistente
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!assistant || !user?.id) {
      console.error('Assistente não inicializado ou usuário não autenticado');
      return;
    }

    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Processar mensagem com o assistente
      const response: AIResponse = await assistant.processMessage(content);
      
      // Adicionar resposta do assistente
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        suggestions: response.suggestions,
        data: response.data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Adicionar mensagem de erro
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente. 🔄',
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          'Adicionar uma transação',
          'Criar um lembrete',
          'Ver meus gastos'
        ]
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [assistant, user?.id]);

  // Enviar sugestão (funciona como sendMessage)
  const sendSuggestion = useCallback(async (suggestion: string): Promise<void> => {
    await sendMessage(suggestion);
  }, [sendMessage]);

  // Limpar conversa
  const clearMessages = useCallback(() => {
    setMessages([]);
    initializeAssistant(); // Reinicializar com mensagem de boas-vindas
  }, [initializeAssistant]);

  // Obter última sugestão
  const getLastSuggestions = useCallback((): string[] => {
    const lastAssistantMessage = messages
      .filter(msg => !msg.isUser)
      .pop();
    
    return lastAssistantMessage?.suggestions || [];
  }, [messages]);

  return {
    messages,
    isLoading,
    sendMessage,
    sendSuggestion,
    clearMessages,
    initializeAssistant,
    getLastSuggestions,
    isReady: !!assistant && !!user?.id,
    user
  };
}
