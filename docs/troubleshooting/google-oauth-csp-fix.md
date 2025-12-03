# Correção: Erro ERR_BLOCKED_BY_CLIENT no Google OAuth

## Problema

Ao tentar criar uma conta usando Google Account, o navegador retorna o erro:
```
ERR_BLOCKED_BY_CLIENT
GET https://accounts.google.com/generate_204?A9odXw
POST https://play.google.com/log?...
```

## Causa

O Content Security Policy (CSP) estava bloqueando requisições para os domínios do Google necessários para OAuth:
- `accounts.google.com` - Autenticação OAuth
- `play.google.com` - Serviços do Google Play
- `*.google.com` - Outros serviços do Google

## Solução Implementada

### 1. Atualização do CSP no Servidor

Arquivo: `src/lib/security/security-middleware.ts`

Adicionados os seguintes domínios ao CSP:

**connectSrc** (requisições de rede):
- `https://accounts.google.com`
- `https://*.google.com`
- `https://play.google.com`

**frameSrc** (iframes):
- `https://accounts.google.com`
- `https://*.google.com`

**formAction** (formulários):
- `https://accounts.google.com`

**scriptSrc** (scripts):
- `https://accounts.google.com`
- `https://*.google.com`

### 2. Meta Tag CSP no HTML

Arquivo: `index.html`

Adicionado meta tag CSP diretamente no HTML para garantir que seja aplicado no cliente, mesmo se os headers HTTP não forem aplicados corretamente.

## Verificação

Após o deploy, verifique:

1. **Console do Navegador**: Não deve mais aparecer erros `ERR_BLOCKED_BY_CLIENT` relacionados ao Google
2. **Network Tab**: Requisições para `accounts.google.com` e `play.google.com` devem ser bem-sucedidas
3. **Login com Google**: O fluxo de OAuth deve funcionar corretamente

## Configuração Adicional Necessária

### Clerk Dashboard

Certifique-se de que o Google OAuth está configurado no Clerk Dashboard:

1. Acesse: https://dashboard.clerk.com
2. Vá em: **User & Authentication > Social Connections**
3. Ative: **Google**
4. Configure as credenciais OAuth do Google (Client ID e Client Secret)

### Variáveis de Ambiente

Não são necessárias variáveis de ambiente adicionais para o Google OAuth via Clerk, pois o Clerk gerencia a autenticação OAuth diretamente.

## Troubleshooting Adicional

Se o problema persistir após o deploy:

1. **Verifique Extensões do Navegador**: Alguns bloqueadores de anúncios podem bloquear requisições do Google
   - Teste em modo anônimo
   - Desative extensões temporariamente

2. **Verifique Headers HTTP**: Confirme que os headers CSP estão sendo aplicados corretamente
   ```bash
   curl -I https://aegiswallet.vercel.app | grep -i "content-security-policy"
   ```

3. **Console do Navegador**: Verifique se há outros erros relacionados a CSP
   - Procure por mensagens como "Refused to connect to..." ou "Refused to frame..."

4. **Clerk Dashboard**: Verifique se o Google OAuth está ativado e configurado corretamente

## Referências

- [Clerk Google OAuth Documentation](https://clerk.com/docs/authentication/social-connections/google)
- [Content Security Policy MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

