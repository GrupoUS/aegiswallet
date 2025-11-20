import { CreditCard, Home, PiggyBank, Settings } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { MagicCard } from '../../components/ui/magic-card';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '../../components/ui/sidebar';

export function ComponentDemo() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarMenuButton size="lg" className="font-semibold">
              <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                A
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">AegisWallet</span>
                <span className="truncate text-xs">Assistente Financeiro</span>
              </div>
            </SidebarMenuButton>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <CreditCard className="h-4 w-4" />
                    <span>Contas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <PiggyBank className="h-4 w-4" />
                    <span>PIX</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <h1 className="font-semibold text-xl">Componentes shadcn/ui</h1>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="grid gap-4">
              <h2 className="font-semibold text-lg">Magic Card Component</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <MagicCard className="p-6">
                  <h3 className="mb-2 font-semibold">Dashboard Financeiro</h3>
                  <p className="text-muted-foreground text-sm">
                    Visualize suas finanças em tempo real com gráficos interativos e insights
                    personalizados.
                  </p>
                </MagicCard>

                <MagicCard className="p-6" gradientFrom="#d2aa60ff" gradientTo="#112031">
                  <h3 className="mb-2 font-semibold">Transferências PIX</h3>
                  <p className="text-muted-foreground text-sm">
                    Envie e receba dinheiro instantaneamente usando o sistema PIX do Banco Central.
                  </p>
                </MagicCard>

                <MagicCard className="p-6" gradientSize={300} gradientOpacity={1}>
                  <h3 className="mb-2 font-semibold">Contas Bancárias</h3>
                  <p className="text-muted-foreground text-sm">
                    Gerencie todas as suas contas em um único lugar com segurança e praticidade.
                  </p>
                </MagicCard>
              </div>
            </div>

            <div className="grid gap-4">
              <h2 className="font-semibold text-lg">Exemplo de Uso</h2>
              <MagicCard className="p-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">AegisWallet x shadcn/ui</h3>
                    <p className="text-muted-foreground">
                      Componentes instalados e personalizados para o mercado brasileiro:
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">Magic Card: Efeitos visuais interativos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">Sidebar: Navegação responsiva e colapsável</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">
                        Cores personalizadas: Dourado (#AC9469) e Azul (#112031)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">Totalmente integrado com TanStack Router</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button className="bg-[#AC9469] hover:bg-[#AC9469]/90">Começar a Usar</Button>
                  </div>
                </div>
              </MagicCard>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
