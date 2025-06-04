'use client';

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Garante que o QueryClient seja criado apenas uma vez por sessão do usuário no lado do cliente.
// Para Server Components, o data fetching é diferente.
// Este setup é principalmente para mutações e queries no lado do cliente.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Opções padrão para queries, se necessário
        staleTime: 60 * 1000, // 1 minuto
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Lado do Servidor: crie uma nova instância
    return makeQueryClient();
  } else {
    // Lado do Navegador: use a instância existente ou crie uma nova
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTA: Evite useState para o queryClient, pois isso pode causar
  // a recriação do cliente em re-renders, perdendo o cache.
  // Em vez disso, use a função getQueryClient para garantir uma única instância no browser.
  const queryClient = getQueryClient();

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  );
}
