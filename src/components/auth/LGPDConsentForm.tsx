import { Clock, Database, Eye, Mail, Mic, Shield } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ConsentData {
  voice_data_processing: boolean;
  biometric_data: boolean;
  audio_recording: boolean;
  data_retention: boolean;
  marketing_communications: boolean;
}

interface LGPDConsentFormProps {
  userId: string;
  onConsentComplete?: () => void;
  requiredOnly?: boolean;
  className?: string;
}

export function LGPDConsentForm({
  userId,
  onConsentComplete,
  requiredOnly = false,
  className,
}: LGPDConsentFormProps) {
  const [consents, setConsents] = useState<ConsentData>({
    voice_data_processing: false,
    biometric_data: false,
    audio_recording: false,
    data_retention: false,
    marketing_communications: false,
  });

  const [loading, setLoading] = useState(false);
  const [existingConsents, setExistingConsents] = useState<ConsentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadExistingConsents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const latestConsents = data.reduce((acc, consent) => {
          acc[consent.consent_type as keyof ConsentData] = consent.granted;
          return acc;
        }, {} as ConsentData);

        setExistingConsents(latestConsents);
        setConsents(latestConsents);
      }
    } catch (err) {
      console.error('Error loading consents:', err);
    }
  }, [userId]);

  useEffect(() => {
    loadExistingConsents();
  }, [loadExistingConsents]);

  const handleConsentChange = (consentType: keyof ConsentData, granted: boolean) => {
    setConsents((prev) => ({
      ...prev,
      [consentType]: granted,
    }));
  };

  const validateRequiredConsents = (): boolean => {
    // Required consents for core functionality
    const required = ['voice_data_processing', 'audio_recording'];
    return required.every((consent) => consents[consent as keyof ConsentData]);
  };

  const handleSubmit = async () => {
    if (!validateRequiredConsents()) {
      setError(
        'Você deve consentir com o processamento de dados de voz e gravação de áudio para usar os recursos principais.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const consentVersion = '1.0.0';
      const consentTypes = Object.keys(consents) as (keyof ConsentData)[];

      // Insert or update each consent type
      for (const consentType of consentTypes) {
        if (
          !requiredOnly ||
          consentType === 'voice_data_processing' ||
          consentType === 'audio_recording'
        ) {
          await supabase.from('user_consent').upsert(
            {
              user_id: userId,
              consent_type: consentType,
              granted: consents[consentType],
              consent_version: consentVersion,
              consent_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,consent_type',
            }
          );
        }
      }

      // Log consent activity for audit
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'lgpd_consent_updated',
        resource_type: 'user_consent',
        details: {
          consent_version: consentVersion,
          consents_granted: Object.entries(consents)
            .filter(([_, granted]) => granted)
            .map(([type]) => type),
          timestamp: new Date().toISOString(),
        },
      });

      onConsentComplete?.();
    } catch (err) {
      console.error('Error saving consents:', err);
      setError('Erro ao salvar suas preferências. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const consentItems = [
    {
      key: 'voice_data_processing' as keyof ConsentData,
      title: 'Processamento de Dados de Voz',
      description: 'Permitir o processamento de comandos de voz para operações financeiras',
      icon: <Mic className="h-4 w-4" />,
      required: true,
      lgpd: {
        purpose: 'Essencial para funcionalidade principal',
        retention: 'Enquanto usuário ativo',
        sharing: 'Não compartilhado com terceiros',
      },
    },
    {
      key: 'audio_recording' as keyof ConsentData,
      title: 'Gravação de Áudio',
      description: 'Permitir gravação temporária de áudio para processamento de comandos',
      icon: <Mic className="h-4 w-4" />,
      required: true,
      lgpd: {
        purpose: 'Processamento de comandos de voz',
        retention: '48 horas após processamento',
        sharing: 'Não compartilhado',
      },
    },
    {
      key: 'biometric_data' as keyof ConsentData,
      title: 'Dados Biométricos',
      description: 'Permitir uso de dados biométricos para autenticação',
      icon: <Shield className="h-4 w-4" />,
      required: false,
      lgpd: {
        purpose: 'Autenticação e segurança',
        retention: 'Enquanto autorizado',
        sharing: 'Não compartilhado',
      },
    },
    {
      key: 'data_retention' as keyof ConsentData,
      title: 'Retenção de Dados',
      description: 'Permitir armazenamento de dados conforme políticas de retenção',
      icon: <Clock className="h-4 w-4" />,
      required: false,
      lgpd: {
        purpose: 'Conformidade com regulamentações',
        retention: 'Períodos obrigatórios legais',
        sharing: 'Autoridades quando requerido',
      },
    },
    {
      key: 'marketing_communications' as keyof ConsentData,
      title: 'Comunicações de Marketing',
      description: 'Permitir envio de comunicações sobre produtos e serviços',
      icon: <Mail className="h-4 w-4" />,
      required: false,
      lgpd: {
        purpose: 'Marketing e relacionamento',
        retention: 'Até revogação do consentimento',
        sharing: 'Não compartilhado',
      },
    },
  ];

  const filteredItems = requiredOnly ? consentItems.filter((item) => item.required) : consentItems;

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">LGPD - Lei Geral de Proteção de Dados</CardTitle>
        <CardDescription>
          {requiredOnly
            ? 'Consentimentos necessários para usar os recursos principais'
            : 'Gerencie suas preferências de privacidade e consentimento'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => (
            <div
              key={item.key}
              className={cn(
                'p-4 border rounded-lg space-y-3',
                item.required && 'border-primary/20 bg-primary/5'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{item.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{item.title}</Label>
                    {item.required && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>

              <div className="space-y-2 pl-7">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={item.key}
                    checked={consents[item.key]}
                    onCheckedChange={(checked) => handleConsentChange(item.key, checked as boolean)}
                  />
                  <Label htmlFor={item.key} className="text-sm cursor-pointer">
                    Eu concordo com o {item.title.toLowerCase()}
                  </Label>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-2 rounded">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>
                      <strong>Finalidade:</strong> {item.lgpd.purpose}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      <strong>Retenção:</strong> {item.lgpd.retention}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    <span>
                      <strong>Compartilhamento:</strong> {item.lgpd.sharing}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={loading || !validateRequiredConsents()}
            className="w-full"
          >
            {loading ? 'Salvando...' : requiredOnly ? 'Continuar' : 'Salvar Preferências'}
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>Você pode alterar suas preferências a qualquer momento nas configurações da conta.</p>
          <p className="mt-1">
            Para exercer seus direitos de acesso, correção, exclusão ou portabilidade de dados,
            entre em contato conosco.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
