import type { CheckedState } from '@radix-ui/react-checkbox';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LGPDConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  voice_data_processing: boolean;
  biometric_data: boolean;
}

interface LGPDConsentFormProps {
  defaultValues?: Partial<LGPDConsentState>;
  onSubmit?: (values: LGPDConsentState) => Promise<void> | void;
  isSubmitting?: boolean;
  className?: string;
  policyUrl?: string;
  submitLabel?: string;
  errorMessage?: string;
  successMessage?: string;
}

const LGPDConsentForm = ({
  defaultValues,
  onSubmit,
  isSubmitting,
  className,
  policyUrl,
  submitLabel = 'Registrar consentimento',
  errorMessage,
  successMessage = 'Consentimento registrado com sucesso.',
}: LGPDConsentFormProps) => {
  const [consentState, setConsentState] = useState<LGPDConsentState>({
    analytics: defaultValues?.analytics ?? false,
    biometric_data: defaultValues?.biometric_data ?? false,
    essential: defaultValues?.essential ?? false,
    marketing: defaultValues?.marketing ?? false,
    voice_data_processing: defaultValues?.voice_data_processing ?? false,
  });
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  const busy = isSubmitting ?? internalSubmitting;

  const handleConsentToggle = (field: keyof LGPDConsentState) => (value: CheckedState) => {
    const isChecked = value === true;

    setConsentState((previous) => ({
      ...previous,
      [field]: isChecked,
    }));
    setStatus('idle');
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('idle');

    if (!consentState.essential) {
      setFormError('É necessário autorizar o tratamento essencial de dados para continuar.');
      setStatus('error');
      return;
    }

    setFormError(null);

    if (!onSubmit) {
      setStatus('success');
      return;
    }

    if (typeof isSubmitting === 'undefined') {
      setInternalSubmitting(true);
    }

    try {
      await onSubmit(consentState);
      setStatus('success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar o consentimento. Tente novamente.';
      setFormError(message);
      setStatus('error');
    } finally {
      if (typeof isSubmitting === 'undefined') {
        setInternalSubmitting(false);
      }
    }
  };

  return (
    <div className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-semibold text-foreground text-xl">Consentimento LGPD</h2>
          <p className="text-muted-foreground text-sm">
            A Lei Geral de Proteção de Dados (LGPD) exige que obtenhamos o seu consentimento para
            tratar informações pessoais. Revise as opções abaixo e selecione as permissões que
            deseja conceder. Você pode alterar suas preferências a qualquer momento.
          </p>
          {policyUrl && (
            <a
              href={policyUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary text-sm underline underline-offset-2 hover:text-primary/80"
            >
              Ler política de privacidade completa
            </a>
          )}
        </div>

        <fieldset className="space-y-4">
          <legend className="sr-only">Preferências de consentimento</legend>

          <label
            htmlFor="lgpd-essential"
            className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
          >
            <Checkbox
              id="lgpd-essential"
              checked={consentState.essential}
              onCheckedChange={handleConsentToggle('essential')}
              aria-describedby="lgpd-essential-description"
            />
            <div className="space-y-1">
              <Label htmlFor="lgpd-essential" className="font-medium text-base text-foreground">
                Consentimento essencial
              </Label>
              <p id="lgpd-essential-description" className="text-muted-foreground text-sm">
                Autorizo o uso dos meus dados para execução do serviço, autenticação, prevenção a
                fraudes e comunicação obrigatória. Este consentimento é necessário para utilizar a
                plataforma.
              </p>
            </div>
          </label>

          <label
            htmlFor="lgpd-analytics"
            className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
          >
            <Checkbox
              id="lgpd-analytics"
              checked={consentState.analytics}
              onCheckedChange={handleConsentToggle('analytics')}
              aria-describedby="lgpd-analytics-description"
            />
            <div className="space-y-1">
              <Label htmlFor="lgpd-analytics" className="font-medium text-base text-foreground">
                Analytics e personalização
              </Label>
              <p id="lgpd-analytics-description" className="text-muted-foreground text-sm">
                Permito o uso dos meus dados para análises de uso, melhoria contínua e
                personalização da experiência dentro do aplicativo.
              </p>
            </div>
          </label>

          <label
            htmlFor="lgpd-marketing"
            className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
          >
            <Checkbox
              id="lgpd-marketing"
              checked={consentState.marketing}
              onCheckedChange={handleConsentToggle('marketing')}
              aria-describedby="lgpd-marketing-description"
            />
            <div className="space-y-1">
              <Label htmlFor="lgpd-marketing" className="font-medium text-base text-foreground">
                Comunicação personalizada
              </Label>
              <p id="lgpd-marketing-description" className="text-muted-foreground text-sm">
                Autorizo o envio de comunicações sobre novos recursos, dicas financeiras e ofertas
                alinhadas aos meus interesses.
              </p>
            </div>
          </label>

          <label
            htmlFor="lgpd-voice"
            className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
          >
            <Checkbox
              id="lgpd-voice"
              checked={consentState.voice_data_processing}
              onCheckedChange={handleConsentToggle('voice_data_processing')}
              aria-describedby="lgpd-voice-description"
            />
            <div className="space-y-1">
              <Label htmlFor="lgpd-voice" className="font-medium text-base text-foreground">
                Processamento de voz
              </Label>
              <p id="lgpd-voice-description" className="text-muted-foreground text-sm">
                Permito o processamento dos meus comandos de voz para execução de ações financeiras
                e interação com o assistente.
              </p>
            </div>
          </label>

          <label
            htmlFor="lgpd-biometric"
            className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
          >
            <Checkbox
              id="lgpd-biometric"
              checked={consentState.biometric_data}
              onCheckedChange={handleConsentToggle('biometric_data')}
              aria-describedby="lgpd-biometric-description"
            />
            <div className="space-y-1">
              <Label htmlFor="lgpd-biometric" className="font-medium text-base text-foreground">
                Dados biométricos de voz
              </Label>
              <p id="lgpd-biometric-description" className="text-muted-foreground text-sm">
                Autorizo o armazenamento de padrões da minha voz para fins de autenticação e
                segurança (biometria por voz).
              </p>
            </div>
          </label>
        </fieldset>

        {(formError || errorMessage) && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm"
          >
            {formError ?? errorMessage}
          </div>
        )}

        {status === 'success' && (
          <div
            aria-live="polite"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm"
          >
            {successMessage}
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full md:w-auto">
          {busy ? 'Salvando...' : submitLabel}
        </Button>
      </form>
    </div>
  );
};

export default LGPDConsentForm;
