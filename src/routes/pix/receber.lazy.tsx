import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { type PixKey, pixClient } from '@/lib/banking/pixApi';

// Lazy loading components
const PixQRCodeGenerator = lazy(() => import('../components/PixQRCodeGenerator'));
const PixKeysList = lazy(() => import('../components/PixKeysList'));

// Loading placeholder components
function QRCodeGeneratorLoader() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
          <Skeleton className="h-16 w-16" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mx-auto h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function PixKeysListLoader() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
        <div className="mt-4 rounded-lg bg-info/10 p-4 dark:bg-info/20">
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PixReceivePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({
        to: '/login',
        search: { redirect: '/pix/receber', error: undefined },
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const keys = await pixClient.getPixKeys(user.id);
          setPixKeys(keys);
        }
      } catch (_error) {
      } finally {
        setIsLoadingKeys(false);
      }
    };

    if (isAuthenticated) {
      fetchKeys();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-financial-positive border-b-2"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/pix' })} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard PIX
        </Button>
        <h1 className="font-bold text-3xl">Receber via PIX</h1>
        <p className="mt-2 text-muted-foreground">
          Compartilhe suas chaves PIX ou gere um QR Code para receber pagamentos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Code Generator */}
        <Suspense fallback={<QRCodeGeneratorLoader />}>
          <PixQRCodeGenerator
            amount={amount}
            description={description}
            onAmountChange={setAmount}
            onDescriptionChange={setDescription}
          />
        </Suspense>

        {/* PIX Keys List */}
        <Suspense fallback={<PixKeysListLoader />}>
          {isLoadingKeys ? <PixKeysListLoader /> : <PixKeysList pixKeys={pixKeys} />}
        </Suspense>
      </div>

      {/* Recent Received Transactions */}
      <Card className="mt-6" variant="glass">
        <CardHeader>
          <CardTitle>Últimas Transações Recebidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma transação recebida recentemente
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
