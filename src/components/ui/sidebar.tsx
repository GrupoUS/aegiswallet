'use client';

import { IconMenu2, IconX } from '@tabler/icons-react';
import type { LinkProps } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useId, useState } from 'react';

import { SidebarContext, useSidebar } from './use-sidebar';
import { cn } from '@/lib/utils';

interface Links {
	label: string;
	href: string;
	icon: React.JSX.Element | React.ReactNode;
}

export const SidebarProvider = ({
	children,
	open: openProp,
	setOpen: setOpenProp,
	animate = true,
}: {
	children: React.ReactNode;
	open?: boolean;
	setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
	animate?: boolean;
}) => {
	const [openState, setOpenState] = useState(false);

	const open = openProp !== undefined ? openProp : openState;
	const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

	return (
		<SidebarContext.Provider value={{ animate, open, setOpen }}>
			{children}
		</SidebarContext.Provider>
	);
};

export const Sidebar = ({
	children,
	open,
	setOpen,
	animate,
}: {
	children: React.ReactNode;
	open?: boolean;
	setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
	animate?: boolean;
}) => {
	return (
		<SidebarProvider open={open} setOpen={setOpen} animate={animate}>
			{children}
		</SidebarProvider>
	);
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
	return (
		<>
			<DesktopSidebar {...props} />
			<MobileSidebar {...(props as React.ComponentProps<'div'>)} />
		</>
	);
};

export const DesktopSidebar = ({
	className,
	children,
	...props
}: React.ComponentProps<typeof motion.div>) => {
	const { open, setOpen, animate } = useSidebar();
	return (
		<motion.div
			className={cn(
				'hidden h-full w-[300px] shrink-0 bg-sidebar-background px-4 py-4 md:flex md:flex-col',
				'glass-dark border-white/10 border-r',
				className,
			)}
			animate={{
				width: animate ? (open ? '300px' : '60px') : '300px',
			}}
			onMouseEnter={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			{...props}
		>
			{children}
		</motion.div>
	);
};

export const MobileSidebar = ({
	className,
	children,
	...props
}: React.ComponentProps<'div'>) => {
	const { open, setOpen } = useSidebar();
	const sidebarContentId = useId();

	return (
		<div
			className={cn(
				'flex h-10 w-full flex-row items-center justify-between bg-sidebar-background px-4 py-4 md:hidden',
				'glass-dark border-white/10 border-b',
				className,
			)}
			{...props}
		>
			<div className="z-20 flex w-full justify-end">
				<button
					type="button"
					className="p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring transition-colors"
					onClick={() => setOpen(!open)}
					aria-label="Abrir menu lateral"
					aria-expanded={open}
				>
					<IconMenu2 className="h-6 w-6" />
				</button>
			</div>
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, x: '-100%' }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: '-100%' }}
						transition={{
							duration: 0.3,
							ease: 'easeInOut',
						}}
						id={sidebarContentId}
						className={cn(
							'fixed inset-0 z-100 flex h-full w-full flex-col justify-between bg-sidebar-background p-10',
							'glass-dark backdrop-blur-xl',
							className,
						)}
						role="navigation"
						aria-label="Menu de navegação principal"
					>
						<button
							type="button"
							className="absolute right-10 top-10 z-50 rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
							onClick={() => setOpen(!open)}
							aria-label="Fechar menu lateral"
							aria-expanded={open}
						>
							<IconX className="h-6 w-6" />
						</button>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export const SidebarLink = ({
	link,
	className,
	...props
}: {
	link: Links;
	className?: string;
	props?: LinkProps;
}) => {
	const { open, animate } = useSidebar();
	return (
		<Link
			to={link.href}
			className={cn(
				'group/sidebar flex items-center justify-start gap-2 py-2',
				'rounded-lg px-2 transition-colors duration-200 hover:bg-sidebar-accent/50',
				className,
			)}
			{...props}
		>
			{link.icon}

			<motion.span
				animate={{
					display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
					opacity: animate ? (open ? 1 : 0) : 1,
				}}
				className="m-0! inline-block p-0! whitespace-pre text-sidebar-foreground text-sm transition duration-150 group-hover/sidebar:translate-x-1"
			>
				{link.label}
			</motion.span>
		</Link>
	);
};

export const SidebarHeader = ({
	className,
	children,
	...props
}: React.ComponentProps<'div'>) => {
	return (
		<div
			className={cn(
				'flex h-16 shrink-0 items-center gap-2 px-4',
				'border-b border-sidebar-border',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

export const SidebarContent = ({
	className,
	children,
	...props
}: React.ComponentProps<'div'>) => {
	return (
		<div
			className={cn(
				'flex flex-1 flex-col gap-2 overflow-y-auto py-2',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

export const SidebarGroup = ({
	className,
	children,
	...props
}: React.ComponentProps<'div'>) => {
	return (
		<div className={cn('flex flex-col gap-2 px-2', className)} {...props}>
			{children}
		</div>
	);
};

export const SidebarGroupLabel = ({
	className,
	children,
	...props
}: React.ComponentProps<'div'>) => {
	return (
		<div
			className={cn(
				'px-2 text-xs font-medium text-sidebar-foreground/70',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

export const SidebarMenu = ({
	className,
	children,
	...props
}: React.ComponentProps<'ul'>) => {
	return (
		<ul className={cn('flex flex-col gap-1', className)} {...props}>
			{children}
		</ul>
	);
};

export const SidebarMenuItem = ({
	className,
	children,
	...props
}: React.ComponentProps<'li'>) => {
	return (
		<li className={cn('list-none', className)} {...props}>
			{children}
		</li>
	);
};

export const SidebarMenuButton = ({
	className,
	children,
	size = 'default',
	...props
}: {
	className?: string;
	children: React.ReactNode;
	size?: 'default' | 'sm' | 'lg';
	props?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) => {
	const sizeClasses = {
		default: 'h-8 px-2 text-sm',
		lg: 'h-10 px-3 text-base',
		sm: 'h-7 px-1.5 text-xs',
	};

	return (
		<button
			type="button"
			className={cn(
				'flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors',
				'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
				'disabled:pointer-events-none disabled:opacity-50',
				sizeClasses[size],
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
};

export const SidebarInset = ({
	className,
	children,
	...props
}: React.ComponentProps<'main'>) => {
	return (
		<main
			className={cn('flex flex-1 flex-col', 'bg-background', className)}
			{...props}
		>
			{children}
		</main>
	);
};

export const SidebarTrigger = ({
	className,
	...props
}: React.ComponentProps<'button'>) => {
	const { open, setOpen } = useSidebar();

	return (
		<button
			type="button"
			onClick={() => setOpen(!open)}
			className={cn(
				'inline-flex items-center justify-center rounded-md p-2',
				'text-sidebar-foreground transition-colors',
				'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
				'md:hidden',
				className,
			)}
			aria-label="Alternar menu lateral"
			aria-expanded={open}
			aria-controls="sidebar-content"
			{...props}
		>
			<IconMenu2 className="h-4 w-4" />
		</button>
	);
};
