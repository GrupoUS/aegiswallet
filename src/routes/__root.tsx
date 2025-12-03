import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import {
	Building,
	Calendar,
	CreditCard,
	FileText,
	Home,
	LogOut,
	Settings,
	Sparkles,
	Wallet,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { CalendarProvider } from '@/components/calendar/calendar-context';
import { ConsentBanner } from '@/components/privacy';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { ChatProvider, ChatWidget } from '@/features/ai-chat/components';
import { cn } from '@/lib/utils';

function ErrorBoundary({ error }: ErrorComponentProps) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-destructive/10 p-4 text-destructive">
			<div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
				<h2 className="mb-4 font-bold text-2xl text-destructive">Oops, something went wrong!</h2>
				<p className="mb-4 text-destructive">
					We encountered an unexpected error. Please try again later.
				</p>
				<pre className="overflow-auto rounded-md bg-destructive/10 p-4 text-destructive text-sm">
					<code>{error.message}</code>
					{error.stack && <div className="mt-4 text-xs">{error.stack}</div>}
				</pre>
			</div>
		</div>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
	errorComponent: ErrorBoundary,
});

// Stable array of public pages (defined outside component to prevent re-creation)
const PUBLIC_PAGES = [
	'/login',
	'/login/sso-callback',
	'/signup',
	'/signup/sso-callback',
	'/privacidade',
	'/politica-de-privacidade',
	'/termos-de-uso',
];

function RootComponent() {
	const location = useLocation();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const { isLoading, signOut } = useAuth();

	const isPublicPage = useMemo(
		() => PUBLIC_PAGES.some((page) => location.pathname.startsWith(page)),
		[location.pathname],
	);

	// Memoize navigation items to prevent re-creation on every render
	const navigationItems = useMemo(
		() => [
			{
				href: '/dashboard',
				icon: <Home className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
				label: 'Dashboard',
			},
			{
				href: '/saldo',
				icon: <Wallet className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
				label: 'Saldo',
			},
			{
				href: '/calendario',
				icon: <Calendar className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
				label: 'Calendário',
			},
			{
				href: '/contas',
				icon: <FileText className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
				label: 'Contas',
			},
			{
				href: '/contas-bancarias',
				icon: <Building className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
				label: 'Contas Bancárias',
			},
			{
				href: '/billing',
				icon: <CreditCard className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
				label: 'Planos',
			},
			{
				href: '/configuracoes',
				icon: <Settings className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
				label: 'Configurações',
			},
		],
		[],
	);

	const handleLogout = useCallback(async () => {
		await signOut();
		await navigate({
			search: { error: undefined, redirect: '/dashboard' },
			to: '/login',
		});
	}, [signOut, navigate]);

	// Handle customize consent preferences - navigate to settings
	const handleCustomizeConsent = useCallback(() => {
		void navigate({ to: '/configuracoes' });
	}, [navigate]);

	// Show loading while checking auth
	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	// Public pages: NO CalendarProvider/ChatProvider (they depend on authenticated user)
	// This prevents infinite re-render loops when Clerk auth state changes
	if (isPublicPage) {
		return (
			<div className="min-h-screen bg-background">
				<Outlet />
				<ConsentBanner onCustomize={handleCustomizeConsent} />
			</div>
		);
	}

	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<CalendarProvider>
					<ChatProvider>
						<div
							className={cn(
								'mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-border bg-background md:flex-row',
								'h-screen',
							)}
						>
							<Sidebar open={open} setOpen={setOpen}>
								<SidebarBody className="justify-between gap-10">
									<div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
										<div className="flex flex-col gap-4">
											<Logo />
											{navigationItems.map((item) => (
												<SidebarLink key={item.href} link={item} />
											))}
										</div>
									</div>
									<div className="flex flex-col gap-2">
										<SidebarLink
											link={{
												href: '/ai-chat',
												icon: <Sparkles className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
												label: 'Assistente IA',
											}}
										/>
										<button
											type="button"
											onClick={handleLogout}
											className="w-full cursor-pointer"
											aria-label="Sair"
										>
											<SidebarLink
												link={{
													href: '#',
													icon: <LogOut className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
													label: 'Sair',
												}}
											/>
										</button>
										<div className="mt-2 pl-1">
											<AnimatedThemeToggler />
										</div>
									</div>
								</SidebarBody>
							</Sidebar>
							<div className="flex flex-1">
								<div className="flex h-full w-full flex-1 flex-col gap-2 overflow-y-auto rounded-tl-2xl border border-border bg-background p-2 md:p-10">
									<Outlet />
								</div>
							</div>
							<ChatWidget />
							<ConsentBanner onCustomize={handleCustomizeConsent} />
						</div>
					</ChatProvider>
				</CalendarProvider>
			</SignedIn>
		</>
	);
}

export const Logo = () => {
	return (
		<div className="relative z-20 flex items-center space-x-2 py-1 font-normal text-foreground text-sm">
			<div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
			<span className="whitespace-pre font-medium text-foreground opacity-100">AegisWallet</span>
		</div>
	);
};
