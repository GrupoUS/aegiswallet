/**
 * Accessibility Settings - Story 04.05
 */

import { useId } from 'react';

import { Switch } from '@/components/ui/switch';

export function AccessibilitySettings() {
	const highContrastId = useId();
	const largeTextId = useId();
	const screenReaderId = useId();
	const textOnlyId = useId();

	return (
		<div className="space-y-4">
			<h3 className="font-semibold text-lg">Configurações de Acessibilidade</h3>
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<label htmlFor={highContrastId}>Modo Alto Contraste</label>
					<Switch id={highContrastId} />
				</div>
				<div className="flex items-center justify-between">
					<label htmlFor={largeTextId}>Aumentar Fonte</label>
					<Switch id={largeTextId} />
				</div>
				<div className="flex items-center justify-between">
					<label htmlFor={screenReaderId}>Leitor de Tela</label>
					<Switch id={screenReaderId} />
				</div>
				<div className="flex items-center justify-between">
					<label htmlFor={textOnlyId}>Apenas Texto (sem voz)</label>
					<Switch id={textOnlyId} />
				</div>
			</div>
		</div>
	);
}
