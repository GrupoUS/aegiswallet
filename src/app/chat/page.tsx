'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ThemeProvider } from "@/hooks/useTheme";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { AccessLevelProvider } from "@/hooks/useAccessLevel";
import ChatPage from "@/components/ai-chat/ChatPage";

// Esta página atuará como a rota /chat
// Ela precisa buscar o usuário e fornecer os contextos necessários para ChatPage.

export default function ChatRoute() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        // Não definir loading para false aqui novamente pode evitar piscadas se a sessão mudar
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Carregando informações do chat...</div>
      </div>
    );
  }
  
  // Se não houver usuário, idealmente redirecionar para login ou mostrar mensagem.
  // Por enquanto, vamos passar o usuário (que pode ser null) para os provedores.
  // O ChatPage ou os provedores podem ter sua própria lógica para lidar com user null.

  return (
    <ThemeProvider>
      <SubscriptionProvider user={user}>
        <AccessLevelProvider user={user}>
          <ChatPage />
        </AccessLevelProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  );
}
