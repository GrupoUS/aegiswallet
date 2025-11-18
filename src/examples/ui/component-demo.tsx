import { Calendar, CreditCard, Home, Settings, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { MagicCard } from '../../components/ui/magic-card';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '../../components/ui/sidebar';

export function ComponentDemo() {
  const [demoData] = useState([
    {
      title: 'Saldo em Conta',
      value: 'R$ 12.450,00',
      change: '+5.2%',
      icon: Wallet,
      color: 'text-green-600',
    },
    {
      title: 'Investimentos',
      value: 'R$ 45.320,00',
      change: '+12.8%',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'PIX Enviados',
      value: 'R$ 3.240,00',
      change: 'Hoje',
      icon: CreditCard,
      color: 'text-purple-600',
    },
    {
      title: 'Próximo Agendamento',
      value: '15 Jan 2024',
      change: 'Pagamento',
      icon: Calendar,
      color: 'text-orange-600',
    },
  ]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="font-bold">AW</span>
              </div>
              <div>
                <h1 className="font-semibold text-lg">AegisWallet</h1>
                <p className="text-sm text-muted-foreground">Assistente Financeiro</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Wallet className="h-4 w-4" />
                  <span>Contas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <CreditCard className="h-4 w-4" />
                  <span>PIX</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Calendar className="h-4 w-4" />
                  <span>Calendário</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <TrendingUp className="h-4 w-4" />
                  <span>Investimentos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Component Showcase</h1>
                <p className="text-muted-foreground">
                  Demonstração dos componentes MagicCard e Sidebar
                </p>
              </div>
              <SidebarTrigger asChild>
                <Button variant="outline" size="sm">
                  Menu
                </Button>
              </SidebarTrigger>
            </div>

            {/* Magic Cards Grid */}
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">MagicCard Components</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {demoData.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <MagicCard key={index} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className={`text-sm ${item.color}`}>{item.change}</p>
                        </div>
                        <Icon className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    </MagicCard>
                  );
                })}
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="grid gap-6 md:grid-cols-2">
              <MagicCard className="p-6">
                <h3 className="mb-4 text-xl font-semibold">✨ MagicCard Features</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Efeito hover com gradiente animado</li>
                  <li>• Cores personalizadas AegisWallet (Ouro #AC9469)</li>
                  <li>• Destaque de borda interativo</li>
                  <li>• Reage ao movimento do mouse</li>
                  <li>• Totalmente responsivo</li>
                </ul>
              </MagicCard>

              <MagicCard className="p-6">
                <h3 className="mb-4 text-xl font-semibold">📱 Sidebar Features</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Navegação com TanStack Router</li>
                  <li>• Totalmente responsivo</li>
                  <li>• Integração com tema AegisWallet</li>
                  <li>• Suporte a atalhos de teclado</li>
                  <li>• Estados colapsáveis</li>
                </ul>
              </MagicCard>
            </div>

            {/* Integration Test */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Teste de Integração</CardTitle>
                  <CardDescription>
                    Verificação de compatibilidade entre os componentes e o sistema AegisWallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <MagicCard className="p-4 text-center">
                      <div className="text-green-600">✅</div>
                      <p className="text-sm font-medium">MagicCard Integrado</p>
                    </MagicCard>
                    <MagicCard className="p-4 text-center">
                      <div className="text-green-600">✅</div>
                      <p className="text-sm font-medium">Sidebar Funcional</p>
                    </MagicCard>
                    <MagicCard className="p-4 text-center">
                      <div className="text-green-600">✅</div>
                      <p className="text-sm font-medium">Tema AegisWallet</p>
                    </MagicCard>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
