import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Loader2, Lock, RefreshCw, Settings } from "lucide-react";
import { useGoogleCalendarSync } from "../../hooks/use-google-calendar-sync";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";

export function GoogleCalendarSettings() {
  const {
    syncStatus,
    settings,
    isLoading,
    isSyncing,
    startOAuthFlow,
    updateSettings,
    syncNow,
  } = useGoogleCalendarSync();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isConnected = syncStatus?.isConnected;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Integração Google Calendar
            </div>
            {isConnected ? (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-200"
              >
                Conectado
              </Badge>
            ) : (
              <Badge variant="outline">Não conectado</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sincronize seus eventos financeiros com sua agenda do Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Conta conectada</span>
                <span className="text-sm text-muted-foreground">
                  {syncStatus?.googleEmail}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startOAuthFlow()}
              >
                Reconectar
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">Conecte sua conta</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Permita que o AegisWallet acesse seu calendário para
                  sincronizar eventos.
                </p>
              </div>
              <Button
                onClick={() => startOAuthFlow()}
                className="w-full max-w-xs"
              >
                Conectar Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sincronização Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Sincronizar eventos periodicamente
                </p>
              </div>
              <Switch
                checked={settings.sync_enabled}
                onCheckedChange={(c) => updateSettings({ sync_enabled: c })}
              />
            </div>

            <div className="space-y-2">
              <Label>Direção da Sincronização</Label>
              <Select
                value={settings.sync_direction}
                onValueChange={(
                  v:
                    | "bidirectional"
                    | "one_way_to_google"
                    | "one_way_from_google",
                ) => updateSettings({ sync_direction: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bidirectional">
                    Bidirecional (Ambos os sentidos)
                  </SelectItem>
                  <SelectItem value="one_way_to_google">
                    Apenas Aegis → Google
                  </SelectItem>
                  <SelectItem value="one_way_from_google">
                    Apenas Google → Aegis
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 border p-4 rounded-lg border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-yellow-600" />
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Privacidade e LGPD
                </h4>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="sync_amounts"
                  checked={settings.sync_financial_amounts}
                  onCheckedChange={(c) =>
                    updateSettings({ sync_financial_amounts: c as boolean })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="sync_amounts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sincronizar valores financeiros
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Se desmarcado, os valores monetários não serão enviados para
                    o Google Calendar. Apenas título e data serão sincronizados.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Última sincronização completa
                </span>
                <span className="text-sm font-medium">
                  {syncStatus?.lastSyncAt
                    ? format(
                        new Date(syncStatus.lastSyncAt),
                        "dd/MM/yyyy HH:mm",
                        { locale: ptBR },
                      )
                    : "Nunca"}
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => syncNow()}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sincronizar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
