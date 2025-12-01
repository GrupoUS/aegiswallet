/**
 * Configurações / Settings Page
 *
 * Complete settings page with 5 tabs:
 * - Profile: User information and regional preferences
 * - AI Assistant: AI model, voice, and autonomy settings
 * - Notifications: Channel and type preferences
 * - Accessibility: Theme, visual, and assistive technology options
 * - Privacy: LGPD compliance and data preferences
 */

import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteErrorBoundary } from '@/components/routes/RouteErrorBoundary';
import { Accessibility, Bell, Bot, Settings, Shield, User } from 'lucide-react';

import { PrivacyPreferences } from '@/components/privacy';
import {
	AccessibilitySettings,
	AIAssistantSettings,
	NotificationSettings,
	ProfileSettings,
} from '@/components/settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ConfiguracoesLoader = () => (
  <div className="container mx-auto max-w-4xl py-6 space-y-6">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-96 w-full" />
  </div>
);
export const Route = createFileRoute('/configuracoes')({
  component: lazy(() => import('./configuracoes.lazy').then(m => ({ default: m.ConfiguracoesPage }))),
  pendingComponent: ConfiguracoesLoader,
  errorComponent: RouteErrorBoundary,
});

function ConfiguracoesPage() {
	return (
		<div className="container mx-auto max-w-4xl py-6 space-y-6">
			{/* Page Header */}
			<div className="flex items-center gap-3">
				<Settings className="h-8 w-8 text-primary" />
				<div>
					<h1 className="text-2xl font-bold">Configurações</h1>
					<p className="text-muted-foreground">
						Gerencie suas preferências, perfil e configurações de privacidade
					</p>
				</div>
			</div>

			{/* Settings Tabs */}
			<Tabs defaultValue="profile" className="w-full">
				<TabsList className="grid w-full grid-cols-5 h-auto">
					<TabsTrigger
						value="profile"
						className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2"
					>
						<User className="h-4 w-4 shrink-0" />
						<span className="hidden sm:inline">Perfil</span>
					</TabsTrigger>
					<TabsTrigger
						value="ai-assistant"
						className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2"
					>
						<Bot className="h-4 w-4 shrink-0" />
						<span className="hidden sm:inline">Assistente</span>
					</TabsTrigger>
					<TabsTrigger
						value="notifications"
						className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2"
					>
						<Bell className="h-4 w-4 shrink-0" />
						<span className="hidden sm:inline">Notificações</span>
					</TabsTrigger>
					<TabsTrigger
						value="accessibility"
						className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2"
					>
						<Accessibility className="h-4 w-4 shrink-0" />
						<span className="hidden sm:inline">Acessibilidade</span>
					</TabsTrigger>
					<TabsTrigger
						value="privacy"
						className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2"
					>
						<Shield className="h-4 w-4 shrink-0" />
						<span className="hidden sm:inline">Privacidade</span>
					</TabsTrigger>
				</TabsList>

				{/* Profile Tab */}
				<TabsContent value="profile" className="mt-6">
					<ProfileSettings />
				</TabsContent>

				{/* AI Assistant Tab */}
				<TabsContent value="ai-assistant" className="mt-6">
					<AIAssistantSettings />
				</TabsContent>

				{/* Notifications Tab */}
				<TabsContent value="notifications" className="mt-6">
					<NotificationSettings />
				</TabsContent>

				{/* Accessibility Tab */}
				<TabsContent value="accessibility" className="mt-6">
					<AccessibilitySettings />
				</TabsContent>

				{/* Privacy Tab (LGPD Compliance) */}
				<TabsContent value="privacy" className="mt-6">
					<PrivacyPreferences />
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default ConfiguracoesPage;
