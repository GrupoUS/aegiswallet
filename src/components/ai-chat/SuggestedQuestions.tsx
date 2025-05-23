
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, PiggyBank, Bell, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import PremiumFeatureBanner from "@/components/subscription/PremiumFeatureBanner";
import { useNavigate } from "react-router-dom";

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void;
}

const SuggestedQuestions = ({ onQuestionSelect }: SuggestedQuestionsProps) => {
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/?tab=subscription");
  };

  const questionCategories = [
    {
      title: "Sobre o Assistente IA",
      icon: <Bot className="h-4 w-4" />,
      isPremium: false,
      questions: [
        "O que você pode fazer por mim?",
        "Como você analisa minhas finanças?",
        "Quais dados meus você acessa?"
      ]
    },
    {
      title: "Análise Financeira",
      icon: <TrendingUp className="h-4 w-4" />,
      isPremium: false,
      questions: [
        "Como está minha saúde financeira este mês?",
        "Quais foram minhas maiores despesas recentemente?",
        "Resumo dos gastos por categoria"
      ]
    },
    {
      title: "Orçamento e Planejamento",
      icon: <PiggyBank className="h-4 w-4" />,
      isPremium: false,
      questions: [
        "Dicas para economizar dinheiro",
        "Como posso reduzir meus gastos?",
        "Sugestões de orçamento mensal"
      ]
    },
    {
      title: "Contas e Lembretes",
      icon: <Bell className="h-4 w-4" />,
      isPremium: false,
      questions: [
        "Quais são minhas próximas contas a vencer?",
        "Análise dos meus gastos fixos"
      ]
    },
    {
      title: "Análises Avançadas com IA Premium",
      icon: <Crown className="h-4 w-4 text-yellow-500" />,
      isPremium: true,
      questions: [
        "Análise preditiva dos meus gastos futuros",
        "Estratégias personalizadas de investimento",
        "Otimização do meu portfólio financeiro",
        "Relatório detalhado de tendências financeiras"
      ]
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Como posso te ajudar hoje?</h3>
        <p className="text-sm text-muted-foreground">
          Clique em uma das sugestões abaixo ou digite sua própria pergunta
        </p>
      </div>
      
      {!isPremium && (
        <PremiumFeatureBanner 
          feature="Modelos de IA Avançados"
          description="Desbloqueie análises mais profundas com GPT-4 e Claude Pro"
          onUpgrade={handleUpgrade}
        />
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        {questionCategories.map((category, categoryIndex) => (
          <Card 
            key={categoryIndex} 
            className={`border-dashed ${
              category.isPremium && !isPremium 
                ? 'opacity-50 border-yellow-200 dark:border-yellow-800' 
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {category.icon}
                {category.title}
                {category.isPremium && <Crown className="h-3 w-3 text-yellow-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.questions.map((question, questionIndex) => (
                <Button
                  key={questionIndex}
                  variant="ghost"
                  size="sm"
                  disabled={category.isPremium && !isPremium}
                  className="w-full text-left justify-start h-auto whitespace-normal p-3 text-xs"
                  onClick={() => category.isPremium && !isPremium ? handleUpgrade() : onQuestionSelect(question)}
                >
                  {question}
                  {category.isPremium && !isPremium && (
                    <Crown className="h-3 w-3 text-yellow-500 ml-auto flex-shrink-0" />
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
