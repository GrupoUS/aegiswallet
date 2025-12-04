import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { AI_CONSENT_INFO } from '@/lib/ai/consent/constants';

interface AIConsentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConsentGranted: () => void;
}

export function AIConsentModal({ open, onOpenChange, onConsentGranted }: AIConsentModalProps) {
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(false);

	const handleGrantConsent = async () => {
		if (!user) return;

		setIsLoading(true);
		try {
			const response = await fetch('/api/v1/ai/consent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Falha ao registrar consentimento');
			}

			toast.success('Consentimento registrado com sucesso!');
			onConsentGranted();
			onOpenChange(false);
		} catch {
			toast.error('Erro ao registrar consentimento. Tente novamente.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="mx-auto bg-primary/10 p-3 rounded-full mb-2 w-fit">
						<ShieldCheck className="w-6 h-6 text-primary" />
					</div>
					<DialogTitle className="text-center">{AI_CONSENT_INFO.title}</DialogTitle>
					<DialogDescription className="text-center">
						{AI_CONSENT_INFO.description}
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-[60vh] pr-4">
					<div className="space-y-4 py-4 text-sm">
						<div className="space-y-2">
							<h4 className="font-medium text-foreground">Dados que serão analisados:</h4>
							<ul className="list-disc pl-5 space-y-1 text-muted-foreground">
								{AI_CONSENT_INFO.dataAccessed.map((item, index) => (
									<li key={index}>{item}</li>
								))}
							</ul>
						</div>

						<div className="bg-muted/50 p-3 rounded-lg space-y-2">
							<h4 className="font-medium text-foreground">Seus direitos e privacidade:</h4>
							<ul className="list-check pl-5 space-y-1 text-muted-foreground">
								{AI_CONSENT_INFO.userRights.map((item, index) => (
									<li key={index} className="flex items-start gap-2">
										<span className="text-green-500 mt-0.5">✓</span>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>

						<p className="text-xs text-muted-foreground text-center pt-2">
							Ao continuar, você concorda com a versão {AI_CONSENT_INFO.version} dos termos de uso
							da IA.
						</p>
					</div>
				</ScrollArea>

				<DialogFooter className="flex-col sm:flex-row gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
						className="w-full sm:w-auto"
					>
						Cancelar
					</Button>
					<Button onClick={handleGrantConsent} disabled={isLoading} className="w-full sm:w-auto">
						{isLoading ? 'Registrando...' : 'Concordar e Continuar'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
