
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { belvoService } from "@/services/belvoService";

interface BelvoConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Mock data for Brazilian banks supported by Belvo
const belvoSupportedBanks = [
  { id: "001", name: "Banco do Brasil", logo: "🏦", supported: true },
  { id: "237", name: "Bradesco", logo: "🏪", supported: true },
  { id: "341", name: "Itaú Unibanco", logo: "🏛️", supported: true },
  { id: "104", name: "Caixa Econômica Federal", logo: "🏢", supported: true },
  { id: "033", name: "Santander", logo: "🏬", supported: true },
  { id: "260", name: "Nu Pagamentos (Nubank)", logo: "💜", supported: true },
  { id: "077", name: "Banco Inter", logo: "🧡", supported: true },
  { id: "336", name: "Banco C6", logo: "💙", supported: true },
  { id: "290", name: "PagSeguro", logo: "💳", supported: true },
  { id: "212", name: "Banco Original", logo: "🔶", supported: true },
];

const BelvoConnectDialog = ({ open, onOpenChange, onSuccess }: BelvoConnectDialogProps) => {
  const [connecting, setConnecting] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBelvoConnect = async () => {
    if (!selectedBank) {
      toast({
        title: "Selecione um banco",
        description: "Por favor, selecione uma instituição bancária para conectar.",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);

    try {
      // In a real implementation, this would:
      // 1. Initialize the Belvo Connect widget
      // 2. Handle the authentication flow
      // 3. Receive the link_id and institution data
      
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate connection process

      const bank = belvoSupportedBanks.find(b => b.id === selectedBank);
      
      // Simulate successful connection with mock data
      const mockLinkId = `link_${Date.now()}_${selectedBank}`;
      
      await belvoService.handleBelvoCallback(mockLinkId, {
        name: bank?.name || 'Banco Conectado'
      });

      toast({
        title: "Conta conectada com sucesso!",
        description: `${bank?.name} foi conectado via Belvo ao AegisWallet.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro na conexão",
        description: `Não foi possível conectar com o banco selecionado. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
      setSelectedBank(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Conectar Conta Bancária via Belvo</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Belvo Benefits Section */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 p-6 rounded-lg">
            <div className="flex items-start space-x-4">
              <Zap className="h-8 w-8 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  🔒 Conexão Segura via Belvo
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  Belvo é uma plataforma líder em Open Finance na América Latina, 
                  certificada pelo Banco Central e utilizada por centenas de fintechs.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Criptografia bancária</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Certificado BACEN</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Sem armazenamento de senhas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Selection */}
          <div>
            <h3 className="font-semibold mb-4">Selecione seu banco:</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {belvoSupportedBanks.map((bank) => (
                <Card 
                  key={bank.id} 
                  className={`cursor-pointer transition-all ${
                    selectedBank === bank.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedBank(bank.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{bank.logo}</span>
                        <div>
                          <p className="font-medium text-sm">{bank.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            Código: {bank.id}
                          </p>
                        </div>
                      </div>
                      {bank.supported && (
                        <Badge variant="secondary" className="text-xs">
                          Suportado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Connect Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleBelvoConnect}
              disabled={!selectedBank || connecting}
              size="lg"
              className="min-w-[200px]"
            >
              {connecting ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Conectar via Belvo
                </>
              )}
            </Button>
          </div>

          {/* Information Section */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium mb-3">📋 Como funciona a conexão?</h4>
            <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
              <li>• Você será redirecionado para a plataforma segura da Belvo</li>
              <li>• Selecione seu banco e insira suas credenciais de forma segura</li>
              <li>• Autorize o AegisWallet a acessar seus dados via Open Finance</li>
              <li>• Suas transações serão importadas automaticamente</li>
              <li>• Sincronização contínua via webhooks da Belvo</li>
            </ul>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h5 className="font-medium mb-2">🔐 Segurança garantida:</h5>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                <li>• Belvo é regulamentada pelo Banco Central do Brasil</li>
                <li>• Credenciais processadas diretamente no ambiente do seu banco</li>
                <li>• AegisWallet nunca tem acesso às suas senhas bancárias</li>
                <li>• Conexão pode ser revogada a qualquer momento</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BelvoConnectDialog;
