import { createLazyFileRoute } from '@tanstack/react-router'
import { ConfiguracoesPage } from '@/components/routes/configuracoes/ConfiguracoesPage';

export const Route = createLazyFileRoute('/configuracoes')({
  component: ConfiguracoesPage,
});
