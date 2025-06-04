'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ThemeProvider } from "@/hooks/useTheme"; // Assumindo que este hook/provider será adaptado/verificado
import { SubscriptionProvider } from "@/hooks/useSubscription"; // Assumindo que este hook/provider será adaptado/verificado
import { AccessLevelProvider } from "@/hooks/useAccessLevel"; // Assumindo que este hook/provider será adaptado/verificado
import AuthPage from "@/components/auth/AuthPage"; // Assumindo que este componente será adaptado/verificado
import Dashboard from "@/components/dashboard/Dashboard"; // Assumindo que este componente será adaptado/verificado
import { useToast } from "@/hooks/use-toast"; // Este hook é de shadcn/ui, precisará ser substituído por daisyUI/Horizon ou uma alternativa

// NOTA: Os componentes/hooks importados de @/hooks e @/components
// podem precisar de ajustes para funcionar corretamente no ambiente Next.js App Router.
// Especialmente se eles dependiam de react-router-dom ou tinham outras lógicas específicas do Vite.

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast(); // Este hook precisará de atenção na migração para daisyUI

  useEffect(() => {
    // Check for checkout success/cancel in URL
    // Esta lógica é específica do cliente e deve funcionar.
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');
    
    if (checkoutStatus === 'success') {
      toast({
        title: "Pagamento aprovado!",
        description: "Bem-vindo ao AegisWallet Pro! Sua assinatura está sendo processada.",
        duration: 5000,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (checkoutStatus === 'cancel') {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente a qualquer momento.",
        variant: "destructive", // Shadcn/ui specific
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    // Estes provedores podem precisar ser Client Components também,
    // ou sua lógica interna adaptada.
    <ThemeProvider>
      <SubscriptionProvider user={user}>
        <AccessLevelProvider user={user}>
          {user ? <Dashboard /> : <AuthPage />}
        </AccessLevelProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  );
}
