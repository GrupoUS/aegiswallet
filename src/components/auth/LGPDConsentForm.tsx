import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info, Clock } from 'lucide-react';

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
}

export const LGPDConsentForm: React.FC<LGPDConsentFormProps> = ({
  userId,
  onConsentComplete,
  requiredOnly = false
}) => {
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

  useEffect(() => {
    loadExistingConsents();
  }, [userId]);

  const loadExistingConsents = async () => {
    try {
      const { data, error } = await supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        const latestConsents: ConsentData = data.reduce((acc, consent) => {
          acc[consent.consent_type as keyof ConsentData] = consent.granted;
          return acc;
        }, {} as ConsentData);

        setExistingConsents(latestConsents);
        setConsents(latestConsents);
      }
    } catch (err) {
      console.error('Error loading consents:', err);
    }
  };

  const handleConsentChange = (consentType: keyof ConsentData, granted: boolean) => {
    setConsents(prev => ({
      ...prev,
      [consentType]: granted
    }));
  };

  const validateRequiredConsents = (): boolean => {
    // Required consents for core functionality
    const required = ['voice_data_processing', 'audio_recording'];
    return required.every(consent => consents[consent as keyof ConsentData]);
  };

  const handleSubmit = async () => {
    if (!validateRequiredConsents()) {
      setError('Você deve consentir com o processamento de dados de voz e gravação de áudio para usar os recursos principais.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const consentVersion = '1.0.0';
      const consentTypes = Object.keys(consents) as (keyof ConsentData)[];

      // Insert or update each consent type
      for (const consentType of consentTypes) {
        if (!requiredOnly || consentType === 'voice_data_processing' || consentType === 'audio_recording') {
          await supabase
            .from('user_consent')
            .upsert({
              user_id: userId,
              consent_type: consentType,
              granted: consents[consentType],
              consent_version,
              consent_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,consent_type'
            });
        }
      }

      // Log consent activity for audit
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'lgpd_consent_updated',
          resource_type: 'user_consent',
          details: {
            consent_version,
            consents_granted: Object.entries(consents)
              .filter(([_, granted]) => granted)
              .map(([type]) => type),
            timestamp: new Date().toISOString()
          }
        });

      onConsentComplete?.();
    } catch (err) {
      console.error('Error saving consents:', err);
      setError('Erro ao salvar suas preferências. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const consentDefinitions = [
    {
      key: 'voice_data_processing' as keyof ConsentData,
      title: 'Processamento de Dados de Voz',
      description: 'Permito o processamento dos meus dados de voz para comandos financeiros',
      required: true,
      icon: <Shield className="h-4 w-4" />,
      retention: '2 anos após inatividade',
      purpose: 'Processar comandos de voz para operações financeiras'
    },
    {
      key: 'biometric_data' as keyof ConsentData,
      title: 'Dados Biométricos',
      description: 'Permito armazenamento de padrões de voz biométricos para autenticação',
      required: false,
      icon: <Shield className="h-4 w-4" />,
      retention: '2 anos após inatividade',
      purpose: 'Autenticação biométrica por voz'
    },
    {
      key: 'audio_recording' as keyof ConsentData,
      title: 'Gravação de Áudio',
      description: 'Permito gravação temporária de áudio para processamento de comandos',
      required: true,
      icon: <Info className="h-4 w-4" />,
      retention: '30 dias',
      purpose: 'Processamento e melhoria do reconhecimento de voz'
    },
    {
      key: 'data_retention' as keyof ConsentData,
      title: 'Política de Retenção',
      description: 'Concordo com as políticas de retenção e exclusão de dados',
      required: false,
      icon: <Clock className="h-4 w-4" />,
      retention: 'Conforme política interna',
      purpose: 'Manter conformidade com LGPD'
    },
    {
      key: 'marketing_communications' as keyof ConsentData,
      title: 'Comunicações de Marketing',
      description: 'Desejo receber comunicações sobre produtos e serviços',
      required: false,
      icon: <Info className="h-4 w-4" />,
      retention: 'Até revogação',
      purpose: 'Marketing e comunicação com cliente'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Conformidade LGPD - Suas Preferências
          </CardTitle>
          <CardDescription>
            De acordo com a Lei Geral de Proteção de Dados (LGPD), precisamos do seu consentimento
            explícito para processar seus dados. Todos os dados são tratados com máxima segurança e
            conformidade com a legislação brasileira.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {existingConsents && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Você já possui preferências salvas. Você pode atualizá-las abaixo.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Consentimentos Obrigatórios</h3>

            {consentDefinitions
              .filter(consent => consent.required)
              .map(consent => (
                <Card key={consent.key} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={consent.key}
                        checked={consents[consent.key]}
                        onCheckedChange={(checked) =>
                          handleConsentChange(consent.key, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={consent.key}
                          className="flex items-center gap-2 font-medium cursor-pointer"
                        >
                          {consent.icon}
                          {consent.title}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {consent.description}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Finalidade:</span> {consent.purpose} |
                          <span className="font-medium"> Retenção:</span> {consent.retention}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {!requiredOnly && (
              <>
                <h3 className="font-semibold text-lg mt-6">Consentimentos Opcionais</h3>

                {consentDefinitions
                  .filter(consent => !consent.required)
                  .map(consent => (
                    <Card key={consent.key} className="border-l-4 border-l-gray-300">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={consent.key}
                            checked={consents[consent.key]}
                            onCheckedChange={(checked) =>
                              handleConsentChange(consent.key, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={consent.key}
                              className="flex items-center gap-2 font-medium cursor-pointer"
                            >
                              {consent.icon}
                              {consent.title}
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                              {consent.description}
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="font-medium">Finalidade:</span> {consent.purpose} |
                              <span className="font-medium"> Retenção:</span> {consent.retention}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Seus Direitos LGPD:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Acesso aos seus dados a qualquer momento</li>
              <li>• Correção de dados incorretos</li>
              <li>• Eliminação de dados (direito ao esquecimento)</li>
              <li>• Revogação do consentimento a qualquer momento</li>
              <li>• Portabilidade dos dados</li>
              <li>• Informação sobre compartilhamento de dados</li>
            </ul>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !validateRequiredConsents()}
            className="w-full"
          >
            {loading ? 'Salvando...' : 'Salvar Preferências de Privacidade'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
