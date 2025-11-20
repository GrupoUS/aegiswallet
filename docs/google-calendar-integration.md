# Integração Google Calendar

O AegisWallet oferece uma integração robusta com o Google Calendar, permitindo sincronização bidirecional de eventos financeiros, criação de eventos via drag-and-drop e controle granular de privacidade (LGPD).

## Visão Geral

A integração funciona em três camadas:

1.  **Camada de Autenticação**: Supabase Edge Function para OAuth2 flow, armazenando tokens criptografados.
2.  **Camada de Sincronização**: Supabase Edge Function para lógica de sync (full e incremental), mapeando eventos entre os sistemas.
3.  **Camada de Interface**: Componentes React (`GoogleCalendarSettings`, `EventCalendar`) e Hooks (`useGoogleCalendarSync`) para interação do usuário.

## Configuração Inicial

Para habilitar a integração, siga os passos:

1.  **Google Cloud Console**:
    *   Crie um novo projeto.
    *   Habilite a **Google Calendar API**.
    *   Configure a tela de consentimento OAuth (escopos: `calendar.events`, `userinfo.email`).
    *   Crie credenciais de **ID do cliente OAuth 2.0**.
    *   Adicione a URI de redirecionamento: `https://seu-projeto.supabase.co/functions/v1/google-calendar-auth?action=callback`.

2.  **Variáveis de Ambiente**:
    Adicione as seguintes variáveis ao seu `.env.local` (e nas configurações do Supabase Edge Functions):

    ```bash
    VITE_GOOGLE_CLIENT_ID="seu-client-id"
    GOOGLE_CLIENT_SECRET="seu-client-secret"
    GOOGLE_REDIRECT_URI="https://seu-projeto.supabase.co/functions/v1/google-calendar-auth?action=callback"
    TOKENS_ENCRYPTION_KEY="chave-aleatoria-segura-32-chars"
    ```

3.  **Banco de Dados**:
    Execute a migration `supabase/migrations/20251120_add_google_calendar_integration.sql` para criar as tabelas necessárias.

## Funcionalidades

### Autenticação
O usuário inicia o fluxo clicando em "Conectar Google Calendar". O sistema redireciona para o Google, obtém o `code`, troca por tokens e armazena o `access_token` e `refresh_token` criptografados no banco.

### Sincronização
*   **Bidirecional**: Eventos criados no Aegis vão para o Google. Eventos do Google podem ser importados (configurável).
*   **Incremental**: Usa `syncToken` do Google para buscar apenas mudanças recentes, economizando recursos.
*   **Mapeamento**:
    *   Título -> Summary
    *   Descrição -> Description (Valores monetários opcionais)
    *   Data/Hora -> Start/End

### Privacidade (LGPD)
O usuário tem controle total sobre quais dados são enviados:
*   **Sincronizar valores**: Se desabilitado, o valor e a categoria não são enviados na descrição do evento do Google.
*   **Revogação**: O usuário pode desconectar e revogar o acesso a qualquer momento.

## Uso da API (TRPC)

O router `googleCalendar` expõe as seguintes operações:

*   `getSyncStatus`: Verifica se está conectado e status da última sincronização.
*   `getSyncSettings`: Retorna preferências do usuário.
*   `updateSyncSettings`: Atualiza preferências (ex: direção do sync).
*   `requestFullSync`: Força uma sincronização completa.
*   `requestIncrementalSync`: Executa sincronização rápida de mudanças.
*   `syncEvent`: Sincroniza um evento específico individualmente.

## Componentes

*   **`GoogleCalendarSettings`**: Painel de controle para conectar/desconectar e ajustar configurações.
*   **`EventCalendar`**: Calendário visual com suporte a Drag-and-Drop.
*   **`FinancialCalendar`**: Wrapper que integra lógica de negócios e sincronização.

## Troubleshooting

*   **Erro de Token Inválido**: Se o `refresh_token` expirar ou for revogado externamente, o usuário precisará reconectar.
*   **Eventos Duplicados**: O sistema usa tabela de mapeamento (`calendar_sync_mapping`) para evitar duplicatas. Se ocorrer, verifique a integridade dessa tabela.
*   **Erro 403/401**: Verifique se a API do Google Calendar está habilitada no console e se os escopos estão corretos.
