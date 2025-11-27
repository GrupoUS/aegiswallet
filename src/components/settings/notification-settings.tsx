/**
 * Notification Settings Component
 *
 * Configure notification preferences including:
 * - Notification channels (email, push, SMS)
 * - Notification types
 * - Quiet hours
 */

import { Bell, Clock, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { useId } from 'react';

import { SettingsCard } from './settings-card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useProfile } from '@/hooks/useProfile';

// =============================================================================
// Loading Skeleton
// =============================================================================

function NotificationSettingsSkeleton() {
	return (
		<div className="space-y-6" data-testid="notification-settings-skeleton">
			<div className="rounded-xl border bg-card p-6 space-y-4">
				<Skeleton className="h-6 w-48" />
				<div className="space-y-3">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
			</div>
		</div>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function NotificationSettings() {
	const { profile, isLoading, updatePreferences, isUpdatingPreferences } =
		useProfile();
	const preferences = profile?.user_preferences?.[0];
	const quietStartId = useId();
	const quietEndId = useId();

	const handleSwitchChange = (key: string, value: boolean) => {
		updatePreferences({ [key]: value });
	};

	if (isLoading) {
		return <NotificationSettingsSkeleton />;
	}

	return (
		<div className="space-y-6" data-testid="notification-settings">
			{/* Notification Channels */}
			<SettingsCard
				title="Canais de Notificação"
				description="Escolha como deseja receber suas notificações"
				icon={Bell}
				testId="channels-section"
			>
				<div className="space-y-4">
					{/* Email Notifications */}
					<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
						<div className="flex items-center gap-4">
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
								<Mail className="h-5 w-5 text-primary" />
							</div>
							<div className="space-y-0.5">
								<Label className="text-base font-medium">Email</Label>
								<p className="text-sm text-muted-foreground">
									Receba resumos e alertas importantes por email
								</p>
							</div>
						</div>
						<Switch
							checked={preferences?.email_notifications ?? true}
							onCheckedChange={(checked) =>
								handleSwitchChange('email_notifications', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Notificações por email"
						/>
					</div>

					{/* Push Notifications */}
					<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
						<div className="flex items-center gap-4">
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
								<Smartphone className="h-5 w-5 text-primary" />
							</div>
							<div className="space-y-0.5">
								<Label className="text-base font-medium">
									Push (navegador)
								</Label>
								<p className="text-sm text-muted-foreground">
									Notificações em tempo real no seu navegador
								</p>
							</div>
						</div>
						<Switch
							checked={preferences?.push_notifications ?? true}
							onCheckedChange={(checked) =>
								handleSwitchChange('push_notifications', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Notificações push"
						/>
					</div>

					{/* SMS Notifications */}
					<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
						<div className="flex items-center gap-4">
							<div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
								<MessageSquare className="h-5 w-5 text-amber-500" />
							</div>
							<div className="space-y-0.5">
								<div className="flex items-center gap-2">
									<Label className="text-base font-medium">SMS</Label>
									<Badge variant="secondary" className="text-xs">
										Premium
									</Badge>
								</div>
								<p className="text-sm text-muted-foreground">
									Alertas críticos por mensagem de texto
								</p>
							</div>
						</div>
						<Switch
							checked={preferences?.notifications_enabled ?? false}
							onCheckedChange={(checked) =>
								handleSwitchChange('notifications_enabled', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Notificações por SMS"
						/>
					</div>
				</div>
			</SettingsCard>

			{/* Notification Types */}
			<SettingsCard
				title="Tipos de Notificação"
				description="Personalize quais alertas você deseja receber"
				icon={Bell}
				testId="types-section"
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="flex items-center justify-between p-3 rounded-lg border">
						<Label className="text-sm">Transações</Label>
						<Switch
							checked={true}
							onCheckedChange={(checked) =>
								handleSwitchChange('notify_transactions', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Notificações de transações"
						/>
					</div>

					<div className="flex items-center justify-between p-3 rounded-lg border">
						<Label className="text-sm">Orçamento excedido</Label>
						<Switch
							checked={true}
							onCheckedChange={(checked) =>
								handleSwitchChange('notify_budget_exceeded', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Notificações de orçamento excedido"
						/>
					</div>

					<div className="flex items-center justify-between p-3 rounded-lg border">
						<Label className="text-sm">Lembrete de contas</Label>
						<Switch
							checked={true}
							onCheckedChange={(checked) =>
								handleSwitchChange('notify_bill_reminders', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Lembretes de contas"
						/>
					</div>

					<div className="flex items-center justify-between p-3 rounded-lg border">
						<Label className="text-sm">Alertas de segurança</Label>
						<Switch
							checked={true}
							onCheckedChange={(checked) =>
								handleSwitchChange('notify_security', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Alertas de segurança"
						/>
					</div>

					<div className="flex items-center justify-between p-3 rounded-lg border">
						<Label className="text-sm">Resumo semanal</Label>
						<Switch
							checked={true}
							onCheckedChange={(checked) =>
								handleSwitchChange('notify_weekly_summary', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Resumo semanal"
						/>
					</div>

					<div className="flex items-center justify-between p-3 rounded-lg border">
						<Label className="text-sm">Dicas financeiras</Label>
						<Switch
							checked={false}
							onCheckedChange={(checked) =>
								handleSwitchChange('notify_tips', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Dicas financeiras"
						/>
					</div>
				</div>
			</SettingsCard>

			{/* Quiet Hours */}
			<SettingsCard
				title="Horários Silenciosos"
				description="Defina períodos sem notificações"
				icon={Clock}
				testId="quiet-hours-section"
			>
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label className="text-base">Modo silencioso</Label>
							<p className="text-sm text-muted-foreground">
								Pausar notificações durante horários específicos
							</p>
						</div>
						<Switch
							checked={false}
							onCheckedChange={(checked) =>
								handleSwitchChange('quiet_hours_enabled', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Ativar modo silencioso"
						/>
					</div>

					<Separator />

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor={quietStartId}>Início</Label>
							<input
								type="time"
								id={quietStartId}
								defaultValue="22:00"
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isUpdatingPreferences}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={quietEndId}>Fim</Label>
							<input
								type="time"
								id={quietEndId}
								defaultValue="08:00"
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isUpdatingPreferences}
							/>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						Alertas de segurança críticos ainda serão enviados durante o período
						silencioso.
					</p>
				</div>
			</SettingsCard>
		</div>
	);
}
