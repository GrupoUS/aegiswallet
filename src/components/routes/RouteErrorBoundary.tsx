import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RouteErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

/**
 * Route Error Boundary - Genérico para uso em rotas TanStack Router
 * Exibe erros de carregamento de página com opções de retry e navegação
 */
export function RouteErrorBoundary({ error, reset }: RouteErrorBoundaryProps) {
  const navigate = useNavigate();

  const handleRetry = () => {
    reset();
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Erro ao carregar página</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado ao carregar esta página
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Detalhes do erro</AlertTitle>
            <AlertDescription className="mt-2">
              {error.message || 'Erro desconhecido'}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleRetry} className="flex-1" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Página Inicial
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Se o problema persistir, entre em contato com o suporte técnico
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
