import { createContext, useContext, useState } from 'react';

export interface SidebarContextType {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	animate?: boolean;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * Hook to access sidebar state and controls.
 * When used inside a SidebarProvider, it returns the context state.
 * When used outside, it creates local state (useful for standalone usage).
 */
export function useSidebar() {
	const [isOpen, setIsOpen] = useState(false);

	// For sidebar components that use SidebarContext
	const context = useContext(SidebarContext);
	if (context) {
		return {
			open: context.open,
			animate: context.animate ?? true,
			setOpen: context.setOpen,
		};
	}

	// Fallback for usage outside SidebarProvider
	return {
		open: isOpen,
		animate: true,
		setOpen: setIsOpen,
	};
}
