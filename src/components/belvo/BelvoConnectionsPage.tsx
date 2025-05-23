
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RefreshCw, Building2, CreditCard, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BelvoConnectDialog from "./BelvoConnectDialog";
import BelvoStatusIndicator from "./BelvoStatusIndicator";
import { belvoService, BelvoConnection, BelvoAccount } from "@/services/belvoService";

const BelvoConnectionsPage = () => {
  const [connections, setConnections] = useState<BelvoConnection[]>([]);
  const [accounts, setAccounts] = useState<BelvoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [connectionsData, accountsData] = await Promise.all([
        belvoService.getBelvoConnections(),
        belvoService.getBelvoAccounts()
      ]);
      
      setConnections(connectionsData);
      setAccounts(accountsData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar suas conexões Belvo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string, institutionName: string) => {
    if (!confirm(`Tem certeza que deseja desconectar ${institutionName}?`)) {
      return;
    }

    try {
      await belvoService.deleteBelvoConnection(connectionId);

      toast({
        title: "Conta desconectada",
        description: `${institutionName} foi desconectado com sucesso.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao desconectar",
        description: "Não foi possível desconectar a conta bancária.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (linkId: string, institutionName: string) => {
    try {
      await belvoService.syncBelvoData(linkId);

      toast({
        title: "Sincronização iniciada",
        description: `Sincronizando dados de ${institutionName}...`,
      });

      // Refresh data after a short delay
      setTimeout(fetchData, 2000);
    } catch (error: any) {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os dados.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid_token': return 'bg-green-500';
      case 'login_error': 
      case 'suspended': return 'bg-red-500';
      case 'token_required': return 'bg-orange-500';
      case 'syncing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getAccountsForConnection = (linkId: string) => {
    return accounts.filter(account => account.belvo_link_id === linkId);
  };

  const formatBalance = (balance: number | null) => {
    if (balance === null) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(balance);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking_account':
      case 'conta_corrente':
        return <Wallet className="h-4 w-4" />;
      case 'credit_card':
      case 'cartao_credito':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getAccountTypeName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking_account':
      case 'conta_corrente':
        return 'Conta Corrente';
      case 'savings_account':
      case 'poupanca':
        return 'Poupança';
      case 'credit_card':
      case 'cartao_credito':
        return 'Cartão de Crédito';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando conexões Belvo...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas Bancárias - Belvo</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie suas conexões bancárias via Belvo e sincronize transações automaticamente
          </p>
        </div>
        <Button onClick={() => setShowConnectDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Conectar Nova Conta via Belvo
        </Button>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conta conectada via Belvo</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Conecte suas contas bancárias via Belvo para importar transações automaticamente
            </p>
            <Button onClick={() => setShowConnectDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Conectar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => {
            const connectionAccounts = getAccountsForConnection(connection.belvo_link_id);
            
            return (
              <Card key={connection.connection_id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Building2 className="h-5 w-5" />
                        <span>{connection.institution_name}</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Conectado via Belvo • {connection.access_mode}
                      </p>
                    </div>
                    <BelvoStatusIndicator status={connection.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Connection Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Status da conexão:</p>
                        <Badge className={getStatusColor(connection.status)}>
                          {connection.status === 'valid_token' && 'Ativo'}
                          {connection.status === 'login_error' && 'Erro de login'}
                          {connection.status === 'suspended' && 'Suspenso'}
                          {connection.status === 'token_required' && 'Requer autenticação'}
                          {connection.status === 'syncing' && 'Sincronizando'}
                          {connection.status === 'unconfirmed' && 'Não confirmado'}
                        </Badge>
                      </div>
                      
                      {connection.last_accessed_at && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Último acesso:</p>
                          <p className="text-sm">
                            {new Date(connection.last_accessed_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Accounts List */}
                    {connectionAccounts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Contas vinculadas:</p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {connectionAccounts.map((account) => (
                            <div key={account.account_id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {getAccountTypeIcon(account.type)}
                                  <span className="font-medium text-sm">{account.name}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {getAccountTypeName(account.type)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-600 dark:text-gray-300">Saldo atual:</p>
                                  <p className="font-medium">{formatBalance(account.balance_current)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 dark:text-gray-300">Saldo disponível:</p>
                                  <p className="font-medium">{formatBalance(account.balance_available)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2 border-t">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSync(connection.belvo_link_id, connection.institution_name)}
                        disabled={connection.status === 'syncing'}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sincronizar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDisconnect(connection.connection_id, connection.institution_name)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Desconectar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BelvoConnectDialog 
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onSuccess={() => {
          setShowConnectDialog(false);
          fetchData();
        }}
      />
    </div>
  );
};

export default BelvoConnectionsPage;
