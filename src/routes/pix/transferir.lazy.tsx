import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { lazy, Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

// Lazy loaded components
const LazyPixTransfer = lazy(() =>
  import('@/components/financial/PixTransfer').then((mod) => ({
    default: mod.PixTransfer,
  }))
);

// Loading component for PixTransfer
const PixTransferLoader = () => (
  <Card variant="glass">
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

export function PixTransferPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({
        search: { error: undefined, redirect: '/pix/transferir' },
        to: '/login',
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-financial-positive border-b-2" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/pix' })} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard PIX
        </Button>
        <h1 className="font-bold text-3xl">Transferir via PIX</h1>
        <p className="mt-2 text-muted-foreground">
          Envie dinheiro instantaneamente usando chave PIX, QR Code ou número de telefone
        </p>
      </div>

      <Suspense fallback={<PixTransferLoader />}>
        <LazyPixTransfer />
      </Suspense>
    </div>
  );
}
