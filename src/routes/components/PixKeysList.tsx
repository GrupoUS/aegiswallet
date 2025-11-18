import { CheckCircle, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PixKey {
  type: string;
  value: string;
  label: string;
}

interface PixKeysListProps {
  pixKeys: PixKey[];
}

export default function PixKeysList({ pixKeys }: PixKeysListProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyPixKey = (key: string, type: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success(`Chave PIX ${type} copiada!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas Chaves PIX</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pixKeys.map((pixKey) => (
          <div
            key={pixKey.value}
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
          >
            <div className="flex-1">
              <div className="font-medium text-sm">{pixKey.label}</div>
              <div className="font-mono text-muted-foreground text-xs">{pixKey.value}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyPixKey(pixKey.value, pixKey.label)}
            >
              {copiedKey === pixKey.value ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}

        <div className="mt-4 rounded-lg bg-info/10 p-4 dark:bg-info/20">
          <p className="text-info text-sm">
            💡 Dica: Compartilhe qualquer uma das suas chaves PIX para receber pagamentos
            instantâneos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
