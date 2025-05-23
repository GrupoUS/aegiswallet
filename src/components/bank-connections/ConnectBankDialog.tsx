
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConnectBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Mock data for Brazilian banks - in a real implementation, this would come from the Open Finance provider
const mockBanks = [
  { id: "001", name: "Banco do Brasil", logo: "🏦" },
  { id: "237", name: "Bradesco", logo: "🏪" },
  { id: "341", name: "Itaú Unibanco", logo: "🏛️" },
  { id: "104", name: "Caixa Econômica Federal", logo: "🏢" },
  { id: "033", name: "Santander", logo: "🏬" },
  { id: "212", name: "Banco Original", logo: "💳" },
  { id: "260", name: "Nu Pagamentos", logo: "💜" },
  { id: "077", name: "Banco Inter", logo: "🧡" },
];

const ConnectBankDialog = ({ open, onOpenChange, onSuccess }: ConnectBankDialogProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBankConnect = async (bank: { id: string; name: string }) => {
    setConnecting(bank.id);

    try {
      // In a real implementation, this would:
      // 1. Call the Open Finance provider's API to initiate OAuth flow
      // 2. Open a secure popup/redirect for user authentication
      // 3. Handle the callback with access tokens
      // 4. Store the encrypted tokens in Supabase
      
      // For now, we'll simulate the process with a mock connection
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate OAuth flow

      // Mock successful connection
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from('bank_connections').insert({
        user_id: user.id,
        provider_name: 'Open Finance Brasil',
        institution_id: bank.id,
        institution_name: bank.name,
        provider_connection_id: `mock_${bank.id}_${Date.now()}`,
        encrypted_access_token: 'encrypted_mock_token',
        sync_status: 'idle'
      });

      if (error) throw error;

      toast({
        title: "Conta conectada com sucesso!",
        description: `${bank.name} foi conectado à sua conta AegisWallet.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro na conexão",
        description: `Não foi possível conectar com ${bank.name}. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conectar Conta Bancária</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ⚡ Conexão Segura via Open Finance
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Sua conexão é protegida pelo padrão Open Finance do Banco Central do Brasil. 
              Seus dados bancários ficam seguros e você pode revogar o acesso a qualquer momento.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Selecione seu banco:</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {mockBanks.map((bank) => (
                <Card 
                  key={bank.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleBankConnect(bank)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{bank.logo}</span>
                        <div>
                          <p className="font-medium">{bank.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Código: {bank.id}
                          </p>
                        </div>
                      </div>
                      {connecting === bank.id ? (
                        <Badge variant="secondary">
                          Conectando...
                        </Badge>
                      ) : (
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium mb-2">📋 O que acontece quando eu conectar?</h4>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
              <li>• Você será redirecionado para o site oficial do seu banco</li>
              <li>• Autenticação segura com suas credenciais bancárias</li>
              <li>• Autorização para leitura das suas transações</li>
              <li>• Importação automática das suas movimentações financeiras</li>
              <li>• Sincronização periódica de novas transações</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectBankDialog;
