/**
 * LGPD Consent Banner Component
 *
 * Displays a cookie/consent banner for LGPD compliance.
 * Shows on first visit and allows users to accept or customize preferences.
 *
 * @example
 * ```tsx
 * <ConsentBanner onAccept={handleAccept} onCustomize={handleCustomize} />
 * ```
 */

import { Cookie, Settings, Shield, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ConsentBannerProps {
	/** Callback when user accepts all consents */
	onAccept?: () => void;
	/** Callback when user wants to customize preferences */
	onCustomize?: () => void;
	/** Callback when user rejects optional consents */
	onRejectOptional?: () => void;
	/** Whether to show the banner (controlled mode) */
	show?: boolean;
}

const CONSENT_STORAGE_KEY = 'aegis_lgpd_consent';

export function ConsentBanner({
	onAccept,
	onCustomize,
	onRejectOptional,
	show: controlledShow,
}: ConsentBannerProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Check if consent was already given
		const hasConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
		if (!hasConsent && controlledShow === undefined) {
			setIsVisible(true);
		}
	}, [controlledShow]);

	// Use controlled visibility if provided
	const showBanner = controlledShow !== undefined ? controlledShow : isVisible;

	const handleAccept = useCallback(() => {
		localStorage.setItem(
			CONSENT_STORAGE_KEY,
			JSON.stringify({
				accepted: true,
				timestamp: new Date().toISOString(),
				preferences: {
					necessary: true,
					analytics: true,
					marketing: true,
				},
			}),
		);
		setIsVisible(false);
		onAccept?.();
	}, [onAccept]);

	const handleRejectOptional = useCallback(() => {
		localStorage.setItem(
			CONSENT_STORAGE_KEY,
			JSON.stringify({
				accepted: true,
				timestamp: new Date().toISOString(),
				preferences: {
					necessary: true,
					analytics: false,
					marketing: false,
				},
			}),
		);
		setIsVisible(false);
		onRejectOptional?.();
	}, [onRejectOptional]);

	if (!showBanner) {
		return null;
	}

	return (
		<div
			className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-sm border-t"
			role="dialog"
			aria-label="Configurações de cookies e privacidade"
			data-testid="consent-banner"
		>
			<Card className="max-w-4xl mx-auto">
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Shield className="h-5 w-5 text-primary" />
							<CardTitle className="text-lg">Política de Privacidade e Cookies</CardTitle>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleRejectOptional}
							aria-label="Fechar banner"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
					<CardDescription>
						Utilizamos cookies e tecnologias similares para melhorar sua experiência. Em
						conformidade com a LGPD (Lei Geral de Proteção de Dados).
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col sm:flex-row gap-2 pt-0">
					<Button
						onClick={handleAccept}
						className="flex-1 sm:flex-none"
						data-testid="consent-accept"
					>
						<Cookie className="mr-2 h-4 w-4" />
						Aceitar todos
					</Button>
					<Button
						variant="outline"
						onClick={onCustomize}
						className="flex-1 sm:flex-none"
						data-testid="consent-customize"
					>
						<Settings className="mr-2 h-4 w-4" />
						Personalizar
					</Button>
					<Button
						variant="ghost"
						onClick={handleRejectOptional}
						className="flex-1 sm:flex-none"
						data-testid="consent-reject"
					>
						Aceitar apenas necessários
					</Button>
					<a
						href="/privacidade"
						className="text-sm text-muted-foreground hover:text-primary underline self-center"
						data-testid="privacy-policy-link"
					>
						Política de Privacidade
					</a>
				</CardContent>
			</Card>
		</div>
	);
}

export default ConsentBanner;
