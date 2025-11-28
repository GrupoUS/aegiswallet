import { useState } from 'react';

import { PaywallModal } from './PaywallModal';

/**
 * Hook to control paywall modal
 */
export function usePaywall() {
	const [isOpen, setIsOpen] = useState(false);
	const [feature, setFeature] = useState<string>();

	const showPaywall = (featureName?: string) => {
		setFeature(featureName);
		setIsOpen(true);
	};

	const hidePaywall = () => {
		setIsOpen(false);
		setFeature(undefined);
	};

	return {
		isOpen,
		feature,
		showPaywall,
		hidePaywall,
		PaywallModal: () => (
			<PaywallModal open={isOpen} onOpenChange={setIsOpen} feature={feature} />
		),
	};
}
