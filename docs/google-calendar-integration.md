# Google Calendar Integration

## Visão Geral
A integração com Google Calendar permite sincronização bidirecional de eventos financeiros, facilitando o planejamento e visualização de compromissos.

## Configuração
1. **Google Cloud Console**:
   - Crie um projeto.
   - Habilite a "Google Calendar API".
   - Configure a tela de consentimento OAuth.
   - Crie credenciais OAuth 2.0 (Web Application).
   - Adicione URI de redirecionamento: `https://<PROJECT_REF>.supabase.co/functions/v1/google-calendar-auth?action=callback`.

2. **Variáveis de Ambiente**:
   Adicione ao `.env.local` (e nas Edge Functions secrets):
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=...
   TOKENS_ENCRYPTION_KEY=...
   ```

## Funcionalidades
- **Autenticação**: OAuth2 seguro com armazenamento criptografado de tokens.
- **Sincronização**:
  - Bidirecional ou Unidirecional.
  - Suporte a valores monetários (opcional, LGPD).
  - Mapeamento de categorias.
- **Interface**:
  - Configurações integradas no calendário.
  - Indicadores de status de sync.

## Privacidade (LGPD)
O usuário tem controle total sobre quais dados são enviados. A sincronização de valores monetários é desativada por padrão e requer consentimento explícito.

## Troubleshooting
- **Erro de Token**: Se a sincronização falhar, tente desconectar e reconectar a conta.
- **Conflitos**: Edições simultâneas podem gerar conflitos, resolvidos priorizando a mudança mais recente.
