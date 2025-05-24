
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RefreshCw, Building2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAccessLevel } from "@/hooks/useAccessLevel";
import PremiumFeatureGate from "@/components/subscription/PremiumFeatureGate";
import ConnectBankDialog from "./ConnectBankDialog";
import SyncStatusIndicator from "./SyncStatusIndicator";

interface BankConnection {
  id: string;
  institution_name: string;
  provider_name: string;
  sync_status: string;
  last_successful_sync_at: string | null;
  created_at: string;
}

const BankConnectionsPage = () => {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const { toast } = useToast();
  const { accessLevel } = useAccessLevel();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("bank_connections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error("Erro ao buscar conexões:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conexões bancárias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("bank_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      toast({
        title: "Conexão removida",
        description: "A conexão bancária foi removida com sucesso",
      });

      fetchConnections();
    } catch (error) {
      console.error("Erro ao remover conexão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a conexão",
        variant: "destructive",
      });
    }
  };

  const hasAccess = accessLevel === 'pro' || accessLevel === 'trial';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando conexões...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Contas Bancárias
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Conecte suas contas bancárias para sincronização automática
          </p>
        </div>

        <PremiumFeatureGate
          feature="Conexão Bancária"
          description="Conecte seus bancos e automatize suas finanças com o AegisWallet Pro!"
          fallback={null}
        >
          <Button onClick={() => setShowConnectDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Nova Conta
          </Button>
        </PremiumFeatureGate>
      </div>

      {!hasAccess && (
        <PremiumFeatureGate
          feature="Conexão Bancária Automática"
          description="Conecte suas contas bancárias e sincronize suas transações automaticamente. Economize tempo e tenha controle total de suas finanças."
        >
          <div />
        </PremiumFeatureGate>
      )}

      {hasAccess && connections.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conta conectada</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Conecte suas contas bancárias para sincronizar suas transações automaticamente
            </p>
            <Button onClick={() => setShowConnectDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Conectar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      )}

      {hasAccess && connections.length > 0 && (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{connection.institution_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {connection.provider_name}
                      </Badge>
                      <SyncStatusIndicator status={connection.sync_status} />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteConnection(connection.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p>
                    Conectado em: {new Date(connection.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  {connection.last_successful_sync_at && (
                    <p>
                      Última sincronização: {new Date(connection.last_successful_sync_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConnectBankDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onSuccess={fetchConnections}
      />
    </div>
  );
};

export default BankConnectionsPage;
