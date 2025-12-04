'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const SmoothDrawerContext = React.createContext<{
	open: boolean;
	setOpen: (open: boolean) => void;
}>({
	open: false,
	setOpen: () => undefined,
});

interface SmoothDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}

function SmoothDrawer({ open, onOpenChange, children }: SmoothDrawerProps) {
	return (
		<SmoothDrawerContext.Provider value={{ open, setOpen: onOpenChange }}>
			<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
				<AnimatePresence mode="wait">{open && children}</AnimatePresence>
			</DialogPrimitive.Root>
		</SmoothDrawerContext.Provider>
	);
}
SmoothDrawer.displayName = 'SmoothDrawer';

interface SmoothDrawerContentProps
	extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
	side?: 'left' | 'right';
	width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
	title?: string;
	description?: string;
}

const SmoothDrawerContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	SmoothDrawerContentProps
>(({ className, children, side = 'right', width = 'md', title, description, ...props }, ref) => {
	const { setOpen } = React.useContext(SmoothDrawerContext);

	const drawerVariants: Variants = {
		hidden: {
			x: side === 'right' ? '100%' : '-100%',
			opacity: 0,
			transition: {
				type: 'spring' as const,
				stiffness: 300,
				damping: 30,
			},
		},
		visible: {
			x: 0,
			opacity: 1,
			transition: {
				type: 'spring' as const,
				stiffness: 300,
				damping: 30,
				mass: 0.8,
				staggerChildren: 0.07,
				delayChildren: 0.2,
			},
		},
		exit: {
			x: side === 'right' ? '100%' : '-100%',
			opacity: 0,
			transition: {
				type: 'spring' as const,
				stiffness: 300,
				damping: 30,
			},
		},
	};

	const widthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		full: 'max-w-full',
	};

	return (
		<DialogPrimitive.Portal forceMount>
			<DialogPrimitive.Overlay asChild>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
					onClick={() => setOpen(false)}
				/>
			</DialogPrimitive.Overlay>
			<DialogPrimitive.Content asChild ref={ref} {...props}>
				<motion.div
					variants={drawerVariants}
					initial="hidden"
					animate="visible"
					exit="exit"
					className={cn(
						'fixed inset-y-0 z-50 flex h-full flex-col border-l bg-background/95 shadow-2xl backdrop-blur-xl',
						side === 'right' ? 'right-0' : 'left-0 border-r border-l-0',
						widthClasses[width],
						'w-full',
						className,
					)}
				>
					<div className="flex items-center justify-between border-b px-6 py-4">
						<div>
							{title && (
								<DialogPrimitive.Title className="font-semibold text-lg">
									{title}
								</DialogPrimitive.Title>
							)}
							{description && (
								<DialogPrimitive.Description className="text-muted-foreground text-sm">
									{description}
								</DialogPrimitive.Description>
							)}
						</div>
						<DialogPrimitive.Close asChild>
							<button
								type="button"
								className="rounded-full p-2 transition-colors hover:bg-secondary"
							>
								<X className="h-5 w-5" />
								<span className="sr-only">Close</span>
							</button>
						</DialogPrimitive.Close>
					</div>
					<div className="flex-1 overflow-y-auto p-6">{children}</div>
				</motion.div>
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
});
SmoothDrawerContent.displayName = 'SmoothDrawerContent';

const itemVariants: Variants = {
	hidden: {
		y: 20,
		opacity: 0,
		transition: {
			type: 'spring' as const,
			stiffness: 300,
			damping: 30,
		},
	},
	visible: {
		y: 0,
		opacity: 1,
		transition: {
			type: 'spring' as const,
			stiffness: 300,
			damping: 30,
			mass: 0.8,
		},
	},
};

const DrawerStaggerContainer = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<motion.div
			ref={ref}
			variants={{
				visible: {
					transition: {
						staggerChildren: 0.07,
						delayChildren: 0.1,
					},
				},
			}}
			initial="hidden"
			animate="visible"
			className={cn('space-y-4', className)}
			{...props}
		/>
	);
});
DrawerStaggerContainer.displayName = 'DrawerStaggerContainer';

const DrawerStaggerItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		return <motion.div ref={ref} variants={itemVariants} className={cn(className)} {...props} />;
	},
);
DrawerStaggerItem.displayName = 'DrawerStaggerItem';

export {
	SmoothDrawer,
	SmoothDrawerContent,
	DrawerStaggerContainer,
	DrawerStaggerItem,
	type SmoothDrawerProps,
	type SmoothDrawerContentProps,
};
