/**
 * LGPD Privacy Preferences Component
 *
 * Allows users to manage their privacy preferences and consent settings.
 * Provides toggles for different types of data processing.
 *
 * @example
 * ```tsx
 * <PrivacyPreferences userId={userId} />
 * ```
 */

import {
  BarChart3,
  Building2,
  Download,
  Fingerprint,
  Loader2,
  Megaphone,
  Mic,
  Shield,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  useConsentManagement,
  useCreateDeletionRequest,
  useCreateExportRequest,
} from '@/hooks/use-compliance';
import type { CollectionMethod, ConsentType } from '@/types/compliance';

interface PrivacyPreferencesProps {
  /** User ID for compliance operations (reserved for future use) */
  userId?: string;
  /** Callback when preferences are saved (reserved for future use) */
  onSave?: () => void;
}

interface ConsentOption {
  type: ConsentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  isMandatory: boolean;
}

const CONSENT_OPTIONS: ConsentOption[] = [
  {
    type: 'data_processing',
    title: 'Processamento de Dados',
    description: 'Necessário para o funcionamento básico do aplicativo.',
    icon: <Shield className="h-5 w-5" />,
    isMandatory: true,
  },
  {
    type: 'financial_data',
    title: 'Dados Financeiros',
    description: 'Permite gerenciar suas contas e transações bancárias.',
    icon: <Building2 className="h-5 w-5" />,
    isMandatory: true,
  },
  {
    type: 'voice_recording',
    title: 'Comandos de Voz',
    description: 'Permite usar comandos de voz para interagir com o aplicativo.',
    icon: <Mic className="h-5 w-5" />,
    isMandatory: false,
  },
  {
    type: 'analytics',
    title: 'Análise e Estatísticas',
    description: 'Ajuda a melhorar o aplicativo com dados de uso anônimos.',
    icon: <BarChart3 className="h-5 w-5" />,
    isMandatory: false,
  },
  {
    type: 'marketing',
    title: 'Marketing e Comunicações',
    description: 'Receber ofertas personalizadas e novidades.',
    icon: <Megaphone className="h-5 w-5" />,
    isMandatory: false,
  },
  {
    type: 'biometric',
    title: 'Biometria',
    description: 'Usar impressão digital ou reconhecimento facial para login.',
    icon: <Fingerprint className="h-5 w-5" />,
    isMandatory: false,
  },
];

export function PrivacyPreferences(_props: PrivacyPreferencesProps) {
  const { consents, isLoading, grantConsent, revokeConsent, isGranting, isRevoking } =
    useConsentManagement();
  const createExportRequest = useCreateExportRequest();
  const createDeletionRequest = useCreateDeletionRequest();
  const [pendingChanges, setPendingChanges] = useState<Partial<Record<ConsentType, boolean>>>({});

  // Check if a consent type is currently granted
  const isConsentGranted = (type: ConsentType): boolean => {
    const consent = consents?.find((c) => c.consent_type === type && c.granted && !c.revoked_at);
    return !!consent || pendingChanges[type] === true;
  };

  // Handle toggle change
  const handleToggle = (type: ConsentType, checked: boolean) => {
    setPendingChanges((prev) => ({ ...prev, [type]: checked }));

    if (checked) {
      grantConsent({
        consentType: type,
        collectionMethod: 'settings_toggle' as CollectionMethod,
      });
    } else {
      revokeConsent(type);
    }
  };

  // Handle data export request
  const handleExportData = () => {
    createExportRequest.mutate({
      requestType: 'full_export',
      format: 'json',
    });
  };

  // Handle account deletion request
  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'Tem certeza que deseja solicitar a exclusão da sua conta? Esta ação não pode ser desfeita.'
      )
    ) {
      createDeletionRequest.mutate({
        requestType: 'full_deletion',
        reason: 'Solicitação do usuário via configurações de privacidade',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="privacy-settings">
      {/* Consent Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Preferências de Privacidade
          </CardTitle>
          <CardDescription>
            Gerencie como seus dados são utilizados. Em conformidade com a LGPD.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONSENT_OPTIONS.map((option, index) => (
            <div key={option.type}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="text-muted-foreground mt-0.5">{option.icon}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`consent-${option.type}`} className="text-sm font-medium">
                        {option.title}
                      </Label>
                      {option.isMandatory && (
                        <Badge variant="secondary" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <Switch
                  id={`consent-${option.type}`}
                  checked={isConsentGranted(option.type)}
                  onCheckedChange={(checked) => handleToggle(option.type, checked)}
                  disabled={option.isMandatory || isGranting || isRevoking}
                  data-testid={`consent-toggle-${option.type}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Rights Section */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Direitos (LGPD)</CardTitle>
          <CardDescription>
            Você tem direito de acessar, exportar e solicitar a exclusão de seus dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleExportData}
            disabled={createExportRequest.isPending}
            data-testid="export-data-button"
          >
            {createExportRequest.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar meus dados
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDeleteAccount}
            disabled={createDeletionRequest.isPending}
            data-testid="delete-account-button"
          >
            {createDeletionRequest.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PrivacyPreferences;
