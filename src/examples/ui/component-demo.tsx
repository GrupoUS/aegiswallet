import { Calendar, CreditCard, Home, Settings, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { MagicCard } from '../../components/ui/magic-card';
import { Sidebar, SidebarBody, SidebarLink } from '../../components/ui/sidebar';

export function ComponentDemo() {
  const [open, setOpen] = useState(false);
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

  const links = [
    {
      label: 'Dashboard',
      href: '#',
      icon: <Home className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Contas',
      href: '#',
      icon: <Wallet className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'PIX',
      href: '#',
      icon: <CreditCard className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Calendário',
      href: '#',
      icon: <Calendar className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Investimentos',
      href: '#',
      icon: <TrendingUp className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Configurações',
      href: '#',
      icon: <Settings className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />,
    },
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col gap-4">
              <div className="relative z-20 flex items-center space-x-2 py-1 font-normal text-black text-sm">
                <div className="h-5 w-6 flex-shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
                <span className="whitespace-pre font-medium text-black opacity-100 dark:text-white">
                  AegisWallet
                </span>
              </div>
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link) => (
                  <SidebarLink key={link.label} link={link} />
                ))}
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl">Component Showcase</h1>
              <p className="text-muted-foreground">
                Demonstração dos componentes MagicCard e Sidebar
              </p>
            </div>
          </div>

          {/* Magic Cards Grid */}
          <div className="mb-8">
            <h2 className="mb-4 font-semibold text-2xl">MagicCard Components</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {demoData.map((item) => {
                const Icon = item.icon;
                return (
                  <MagicCard key={item.title} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-muted-foreground text-sm">{item.title}</p>
                        <p className="font-bold text-2xl">{item.value}</p>
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
              <h3 className="mb-4 font-semibold text-xl">✨ MagicCard Features</h3>
              <ul className="space-y-2 text-sm">
                <li>• Efeito hover com gradiente animado</li>
                <li>• Cores personalizadas AegisWallet (Ouro #AC9469)</li>
                <li>• Destaque de borda interativo</li>
                <li>• Reage ao movimento do mouse</li>
                <li>• Totalmente responsivo</li>
              </ul>
            </MagicCard>

            <MagicCard className="p-6">
              <h3 className="mb-4 font-semibold text-xl">📱 Sidebar Features</h3>
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
            <Card variant="glass">
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
                    <p className="font-medium text-sm">MagicCard Integrado</p>
                  </MagicCard>
                  <MagicCard className="p-4 text-center">
                    <div className="text-green-600">✅</div>
                    <p className="font-medium text-sm">Sidebar Funcional</p>
                  </MagicCard>
                  <MagicCard className="p-4 text-center">
                    <div className="text-green-600">✅</div>
                    <p className="font-medium text-sm">Tema AegisWallet</p>
                  </MagicCard>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
