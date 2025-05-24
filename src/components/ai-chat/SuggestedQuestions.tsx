
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, PiggyBank, Bell, Crown, Zap } from "lucide-react";
import { useAccessLevel } from "@/hooks/useAccessLevel";
import PremiumFeatureBanner from "@/components/subscription/PremiumFeatureBanner";
import { useNavigate } from "react-router-dom";

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void;
}

const SuggestedQuestions = ({ onQuestionSelect }: SuggestedQuestionsProps) => {
  const { accessLevel } = useAccessLevel();
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
      title: "Ações com IA - Lembretes",
      icon: <Zap className="h-4 w-4 text-blue-500" />,
      isPremium: false,
      questions: [
        "Crie um lembrete para pagar a conta de luz no dia 15",
        "Adicione um lembrete para renovar o seguro em dezembro",
        "Lembre-me de revisar meus investimentos no próximo mês"
      ]
    },
    {
      title: "Ações com IA - Transações",
      icon: <Zap className="h-4 w-4 text-green-500" />,
      isPremium: false,
      questions: [
        "Registre um gasto de R$ 50 no supermercado hoje",
        "Adicione meu salário de R$ 3000 que recebi hoje",
        "Anote uma despesa de R$ 25 com transporte ontem"
      ]
    }
  ];

  // Add premium features for Pro/Trial users
  if (accessLevel === 'pro' || accessLevel === 'trial') {
    questionCategories.push({
      title: "Análises Avançadas com IA Premium",
      icon: <Crown className="h-4 w-4 text-yellow-500" />,
      isPremium: true,
      questions: [
        "Análise preditiva dos meus gastos futuros",
        "Estratégias personalizadas de investimento",
        "Otimização do meu portfólio financeiro",
        "Relatório detalhado de tendências financeiras"
      ]
    });
  } else {
    // For free users, show what premium offers
    questionCategories.push({
      title: "Recursos Pro - Análises Avançadas",
      icon: <Crown className="h-4 w-4 text-yellow-500" />,
      isPremium: true,
      questions: [
        "Análises preditivas avançadas",
        "Acesso a modelos de IA premium",
        "Relatórios detalhados personalizados",
        "Estratégias de investimento avançadas"
      ]
    });
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Como posso te ajudar hoje?</h3>
        <p className="text-sm text-muted-foreground">
          Clique em uma sugestão ou peça para eu criar lembretes e registrar transações!
        </p>
      </div>
      
      {accessLevel === 'free' && (
        <PremiumFeatureBanner 
          feature="IA com Modelos Avançados"
          description="Desbloqueie modelos de IA premium e análises avançadas com o AegisWallet Pro"
          onUpgrade={handleUpgrade}
        />
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        {questionCategories.map((category, categoryIndex) => (
          <Card 
            key={categoryIndex} 
            className={`border-dashed ${
              category.isPremium && accessLevel === 'free'
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
                  disabled={category.isPremium && accessLevel === 'free'}
                  className="w-full text-left justify-start h-auto whitespace-normal p-3 text-xs"
                  onClick={() => category.isPremium && accessLevel === 'free' ? handleUpgrade() : onQuestionSelect(question)}
                >
                  {question}
                  {category.isPremium && accessLevel === 'free' && (
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
