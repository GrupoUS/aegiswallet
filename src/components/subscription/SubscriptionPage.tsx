
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAccessLevel } from "@/hooks/useAccessLevel";
import { Crown, CreditCard, Calendar, CheckCircle, Clock } from "lucide-react";

interface SubscriptionData {
  subscribed: boolean;
  status: string;
  current_period_end: string | null;
}

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const { accessLevel, daysLeft } = useAccessLevel();

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status da assinatura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      window.open(data.url, '_blank');
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o processo de assinatura",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      window.open(data.url, '_blank');
    } catch (error) {
      console.error("Erro ao abrir portal do cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de gerenciamento",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativa", variant: "default" },
      inactive: { label: "Inativa", variant: "secondary" },
      canceled: { label: "Cancelada", variant: "destructive" },
      past_due: { label: "Vencida", variant: "destructive" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando informações da assinatura...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Assinatura
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Gerencie sua assinatura do AegisWallet Pro
        </p>
      </div>

      {/* Trial Status Card */}
      {accessLevel === 'trial' && daysLeft !== null && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Período de Teste Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-semibold">
                  {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Aproveite todos os recursos premium gratuitamente
                </p>
              </div>
              <Button onClick={handleSubscribe} disabled={actionLoading}>
                Assinar Agora e Economizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Status */}
      {subscription?.subscribed ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Sua Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">Plano</div>
                <div className="font-semibold">AegisWallet Pro</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                <div>{getStatusBadge(subscription.status)}</div>
              </div>
              {subscription.current_period_end && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Próxima Cobrança</div>
                  <div className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(subscription.current_period_end)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleManageSubscription}
                disabled={actionLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {actionLoading ? "Carregando..." : "Gerenciar Assinatura"}
              </Button>
              <Button 
                onClick={checkSubscription}
                variant="outline"
              >
                Atualizar Status
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
              <Crown className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">AegisWallet Pro</CardTitle>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              R$ 19,90<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Recursos Premium:</h3>
              <div className="space-y-2">
                {[
                  "Conexão automática com bancos",
                  "Sincronização de transações em tempo real",
                  "Análises financeiras avançadas com IA",
                  "Modelos de IA premium (GPT-4, Claude)",
                  "Relatórios detalhados e insights personalizados",
                  "Suporte prioritário",
                  "Sem limites de transações",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {accessLevel === 'free' && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Seu período de teste expirou.</strong> Assine agora para continuar aproveitando todos os recursos premium.
                </p>
              </div>
            )}

            <Button 
              onClick={handleSubscribe} 
              disabled={actionLoading}
              size="lg" 
              className="w-full"
            >
              {actionLoading ? "Processando..." : 
               accessLevel === 'trial' ? "Assinar e Economizar" : "Assinar Agora"}
            </Button>

            {accessLevel === 'trial' && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Continue aproveitando todos os recursos sem interrupção
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionPage;
