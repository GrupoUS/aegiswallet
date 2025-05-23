
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RefreshCw, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_connections')
        .select('id, institution_name, provider_name, sync_status, last_successful_sync_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar conexões",
        description: "Não foi possível carregar suas contas bancárias conectadas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Tem certeza que deseja desconectar esta conta bancária?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bank_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: "Conta desconectada",
        description: "A conexão com a conta bancária foi removida com sucesso.",
      });

      fetchConnections();
    } catch (error: any) {
      toast({
        title: "Erro ao desconectar",
        description: "Não foi possível desconectar a conta bancária.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      // Update status to syncing
      await supabase
        .from('bank_connections')
        .update({ sync_status: 'syncing' })
        .eq('id', connectionId);

      // Call edge function to sync transactions
      const { error } = await supabase.functions.invoke('sync-bank-transactions', {
        body: { connectionId }
      });

      if (error) throw error;

      toast({
        title: "Sincronização iniciada",
        description: "A sincronização das transações foi iniciada com sucesso.",
      });

      fetchConnections();
    } catch (error: any) {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar as transações.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'syncing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando conexões...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas Bancárias</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie suas conexões bancárias e sincronize transações automaticamente
          </p>
        </div>
        <Button onClick={() => setShowConnectDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Nova Conta Bancária
        </Button>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conta conectada</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Conecte suas contas bancárias para importar transações automaticamente
            </p>
            <Button onClick={() => setShowConnectDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Conectar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{connection.institution_name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {connection.provider_name}
                    </p>
                  </div>
                  <SyncStatusIndicator status={connection.sync_status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Status:</p>
                    <Badge className={getStatusColor(connection.sync_status)}>
                      {connection.sync_status === 'success' && 'Sincronizado'}
                      {connection.sync_status === 'error' && 'Erro'}
                      {connection.sync_status === 'syncing' && 'Sincronizando'}
                      {connection.sync_status === 'idle' && 'Ocioso'}
                    </Badge>
                  </div>
                  
                  {connection.last_successful_sync_at && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Última sincronização:</p>
                      <p className="text-sm">
                        {new Date(connection.last_successful_sync_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSync(connection.id)}
                      disabled={connection.sync_status === 'syncing'}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Sincronizar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDisconnect(connection.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Desconectar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConnectBankDialog 
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onSuccess={() => {
          setShowConnectDialog(false);
          fetchConnections();
        }}
      />
    </div>
  );
};

export default BankConnectionsPage;
