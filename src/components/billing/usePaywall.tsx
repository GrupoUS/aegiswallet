import { useState } from 'react';

/**
 * Hook to control paywall modal
 *
 * Returns props to pass to PaywallModal instead of a component,
 * avoiding React reconciliation issues from returning components in hooks.
 *
 * @example
 * ```tsx
 * const { paywallProps, showPaywall } = usePaywall();
 * return (
 *   <>
 *     <button onClick={() => showPaywall('AI Chat')}>Upgrade</button>
 *     <PaywallModal {...paywallProps} />
 *   </>
 * );
 * ```
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
		/** Props to spread onto PaywallModal component */
		paywallProps: {
			open: isOpen,
			onOpenChange: setIsOpen,
			feature,
		},
	};
}
