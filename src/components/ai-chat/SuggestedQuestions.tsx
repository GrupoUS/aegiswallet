
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, PiggyBank, Bell } from "lucide-react";

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void;
}

const SuggestedQuestions = ({ onQuestionSelect }: SuggestedQuestionsProps) => {
  const questionCategories = [
    {
      title: "Sobre o Assistente IA",
      icon: <Bot className="h-4 w-4" />,
      questions: [
        "O que você pode fazer por mim?",
        "Como você analisa minhas finanças?",
        "Quais dados meus você acessa?"
      ]
    },
    {
      title: "Análise Financeira",
      icon: <TrendingUp className="h-4 w-4" />,
      questions: [
        "Como está minha saúde financeira este mês?",
        "Quais foram minhas maiores despesas recentemente?",
        "Resumo dos gastos por categoria"
      ]
    },
    {
      title: "Orçamento e Planejamento",
      icon: <PiggyBank className="h-4 w-4" />,
      questions: [
        "Dicas para economizar dinheiro",
        "Como posso reduzir meus gastos?",
        "Sugestões de orçamento mensal"
      ]
    },
    {
      title: "Contas e Lembretes",
      icon: <Bell className="h-4 w-4" />,
      questions: [
        "Quais são minhas próximas contas a vencer?",
        "Análise dos meus gastos fixos"
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
      
      <div className="grid gap-4 md:grid-cols-2">
        {questionCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {category.icon}
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.questions.map((question, questionIndex) => (
                <Button
                  key={questionIndex}
                  variant="ghost"
                  size="sm"
                  className="w-full text-left justify-start h-auto whitespace-normal p-3 text-xs"
                  onClick={() => onQuestionSelect(question)}
                >
                  {question}
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
