import type { CheckedState } from '@radix-ui/react-checkbox';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LGPDConsentState {
	essential: boolean;
	analytics: boolean;
	marketing: boolean;
	voiceDataProcessing: boolean;
	biometricData: boolean;
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
	// Generate unique IDs for form elements
	const essentialId = useId();
	const analyticsId = useId();
	const marketingId = useId();
	const voiceId = useId();
	const biometricId = useId();

	const [consentState, setConsentState] = useState<LGPDConsentState>({
		analytics: defaultValues?.analytics ?? false,
		biometricData: defaultValues?.biometricData ?? false,
		essential: defaultValues?.essential ?? false,
		marketing: defaultValues?.marketing ?? false,
		voiceDataProcessing: defaultValues?.voiceDataProcessing ?? false,
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
						htmlFor={essentialId}
						className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
					>
						<Checkbox
							id={essentialId}
							checked={consentState.essential}
							onCheckedChange={handleConsentToggle('essential')}
							aria-describedby={`${essentialId}-description`}
						/>
						<div className="space-y-1">
							<Label htmlFor={essentialId} className="font-medium text-base text-foreground">
								Consentimento essencial
							</Label>
							<p id={`${essentialId}-description`} className="text-muted-foreground text-sm">
								Autorizo o uso dos meus dados para execução do serviço, autenticação, prevenção a
								fraudes e comunicação obrigatória. Este consentimento é necessário para utilizar a
								plataforma.
							</p>
						</div>
					</label>

					<label
						htmlFor={analyticsId}
						className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
					>
						<Checkbox
							id={analyticsId}
							checked={consentState.analytics}
							onCheckedChange={handleConsentToggle('analytics')}
							aria-describedby={`${analyticsId}-description`}
						/>
						<div className="space-y-1">
							<Label htmlFor={analyticsId} className="font-medium text-base text-foreground">
								Analytics e personalização
							</Label>
							<p id={`${analyticsId}-description`} className="text-muted-foreground text-sm">
								Permito o uso dos meus dados para análises de uso, melhoria contínua e
								personalização da experiência dentro do aplicativo.
							</p>
						</div>
					</label>

					<label
						htmlFor={marketingId}
						className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
					>
						<Checkbox
							id={marketingId}
							checked={consentState.marketing}
							onCheckedChange={handleConsentToggle('marketing')}
							aria-describedby={`${marketingId}-description`}
						/>
						<div className="space-y-1">
							<Label htmlFor={marketingId} className="font-medium text-base text-foreground">
								Comunicação personalizada
							</Label>
							<p id={`${marketingId}-description`} className="text-muted-foreground text-sm">
								Autorizo o envio de comunicações sobre novos recursos, dicas financeiras e ofertas
								alinhadas aos meus interesses.
							</p>
						</div>
					</label>

					<label
						htmlFor={voiceId}
						className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
					>
						<Checkbox
							id={voiceId}
							checked={consentState.voiceDataProcessing}
							onCheckedChange={handleConsentToggle('voiceDataProcessing')}
							aria-describedby={`${voiceId}-description`}
						/>
						<div className="space-y-1">
							<Label htmlFor={voiceId} className="font-medium text-base text-foreground">
								Processamento de voz
							</Label>
							<p id={`${voiceId}-description`} className="text-muted-foreground text-sm">
								Permito o processamento dos meus comandos de voz para execução de ações financeiras
								e interação com o assistente.
							</p>
						</div>
					</label>

					<label
						htmlFor={biometricId}
						className="flex items-start gap-3 rounded-md border border-border bg-background p-4 transition-colors focus-within:border-primary"
					>
						<Checkbox
							id={biometricId}
							checked={consentState.biometricData}
							onCheckedChange={handleConsentToggle('biometricData')}
							aria-describedby={`${biometricId}-description`}
						/>
						<div className="space-y-1">
							<Label htmlFor={biometricId} className="font-medium text-base text-foreground">
								Dados biométricos de voz
							</Label>
							<p id={`${biometricId}-description`} className="text-muted-foreground text-sm">
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
