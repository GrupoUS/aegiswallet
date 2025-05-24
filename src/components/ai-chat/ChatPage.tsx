import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Loader2, ArrowLeft, Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAccessLevel } from "@/hooks/useAccessLevel";
import SuggestedQuestions from "./SuggestedQuestions";
import AudioRecorder from "./AudioRecorder";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  actionExecuted?: boolean;
}

const AI_MODELS = [
  { 
    id: 'openai/gpt-3.5-turbo', 
    name: 'Sugestão Rápida (GPT-3.5)', 
    tier: 'free',
    description: 'Modelo básico gratuito'
  },
  { 
    id: 'openai/gpt-4o-mini', 
    name: 'Análise Detalhada (GPT-4)', 
    tier: 'premium',
    description: 'Modelo avançado para análises profundas'
  },
  { 
    id: 'anthropic/claude-3-haiku', 
    name: 'Criatividade (Claude)', 
    tier: 'premium',
    description: 'Especialista em soluções criativas'
  },
  { 
    id: 'google/gemini-pro', 
    name: 'Insights (Gemini Pro)', 
    tier: 'premium',
    description: 'Insights avançados e análise preditiva'
  }
];

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accessLevel } = useAccessLevel();

  const canUseModel = (model: typeof AI_MODELS[0]) => {
    if (model.tier === 'free') return true;
    return accessLevel === 'pro' || accessLevel === 'trial';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data) {
        const chatMessages: ChatMessage[] = [];
        data.forEach((chat) => {
          chatMessages.push({
            id: `${chat.id}-user`,
            role: 'user',
            content: chat.message,
            timestamp: new Date(chat.created_at)
          });
          chatMessages.push({
            id: `${chat.id}-assistant`,
            role: 'assistant',
            content: chat.response,
            timestamp: new Date(chat.created_at),
            model: chat.openrouter_model_used
          });
        });
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async (messageToSend?: string) => {
    const message = messageToSend || inputMessage;
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('ai-financial-chat', {
        body: {
          message: message,
          model: selectedModel
        }
      });

      if (error) throw error;

      // Check for premium model restriction error
      if (data.errorCode === 'PREMIUM_MODEL_REQUIRED') {
        toast({
          title: "Modelo Premium Requerido",
          description: data.error,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        model: data.model_used,
        actionExecuted: data.action_executed
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show success message if action was executed
      if (data.action_executed) {
        toast({
          title: "Ação Executada",
          description: "A ação solicitada foi executada com sucesso!",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = (question: string) => {
    setInputMessage(question);
    sendMessage(question);
  };

  const handleTranscriptionComplete = (text: string) => {
    setInputMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleModelChange = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (model && !canUseModel(model)) {
      toast({
        title: "Modelo Premium",
        description: "Este modelo é exclusivo para usuários Pro. Faça upgrade para acessar.",
        variant: "destructive"
      });
      return;
    }
    setSelectedModel(modelId);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="h-[85vh] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                Assistente Financeiro IA
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Modelo de IA:</span>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger className="w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => {
                  const canUse = canUseModel(model);
                  return (
                    <SelectItem 
                      key={model.id} 
                      value={model.id}
                      disabled={!canUse}
                      className={!canUse ? "opacity-50" : ""}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span>{model.name}</span>
                        {model.tier === 'premium' && (
                          canUse ? (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <Lock className="h-3 w-3 text-gray-400" />
                          )
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {model.tier === 'free' ? '(Gratuito)' : '(Pro)'}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {accessLevel === 'free' && (
            <div className="text-xs text-muted-foreground mt-2">
              💡 Faça upgrade para Pro e acesse modelos avançados de IA com capacidades de ação
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Olá! Sou seu assistente financeiro pessoal.</h3>
                  <p className="text-muted-foreground mb-4">
                    Analiso seus dados financeiros e ofereço insights personalizados sobre gastos, orçamento e planejamento financeiro.
                  </p>
                  {(accessLevel === 'pro' || accessLevel === 'trial') && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✨ <strong>Recursos Pro Ativados:</strong> Posso criar lembretes, registrar transações e usar modelos de IA avançados!
                      </p>
                    </div>
                  )}
                </div>
                <SuggestedQuestions onQuestionSelect={handleQuestionSelect} />
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.model && (
                      <div className="flex items-center gap-1 text-xs opacity-70 mt-1">
                        <span>
                          {AI_MODELS.find(m => m.id === message.model)?.name || message.model}
                        </span>
                        {message.actionExecuted && (
                          <span className="text-green-400 ml-2">✅ Ação executada</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="rounded-lg p-3 bg-background border">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analisando seus dados...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre finanças ou grave um áudio..."
              className="flex-1"
              disabled={isLoading}
            />
            <AudioRecorder 
              onTranscriptionComplete={handleTranscriptionComplete}
              disabled={isLoading}
            />
            <Button 
              onClick={() => sendMessage()} 
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPage;
