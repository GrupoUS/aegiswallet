import { createContext, useContext, useEffect, useState } from 'react';

export interface SidebarState {
	isOpen: boolean;
	isCollapsed: boolean;
	activeItem?: string;
}

export interface SidebarContextType {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	animate?: boolean;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar(initialState?: Partial<SidebarState>) {
	const [isOpen, setIsOpen] = useState(initialState?.isOpen ?? false);
	const [isCollapsed, setIsCollapsed] = useState(initialState?.isCollapsed ?? false);
	const [activeItem, setActiveItem] = useState<string | undefined>(initialState?.activeItem);

	const toggle = () => setIsOpen(!isOpen);
	const openSidebar = () => setIsOpen(true);
	const close = () => setIsOpen(false);
	const collapse = () => setIsCollapsed(!isCollapsed);
	const expand = () => setIsCollapsed(false);
	const setActive = (item: string) => setActiveItem(item);

	// Auto-close sidebar on mobile when window resizes
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 768) {
				setIsCollapsed(true);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// For sidebar components that use SidebarContext
	const context = useContext(SidebarContext);
	if (context) {
		return {
			open: context.open,
			isCollapsed,
			activeItem,
			animate: context.animate ?? true, // Default to true if undefined
			setOpen: context.setOpen,
			toggle,
			openSidebar,
			close,
			collapse,
			expand,
			setActive,
		};
	}

	return {
		// State
		open: isOpen,
		isCollapsed,
		activeItem,
		animate: true, // Default to true for non-context usage
		setOpen: setIsOpen, // Use local setter for non-context usage
		toggle,
		openSidebar,
		close,
		collapse,
		expand,
		setActive,
	};
}
