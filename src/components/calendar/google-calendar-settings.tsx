/**
 * Google Calendar Settings Component - Complete Implementation
 *
 * UI component for managing Google Calendar synchronization settings
 * with LGPD consent, sync controls, and status indicators.
 *
 * @file src/components/calendar/google-calendar-settings.tsx
 */

'use client';

import {
	AlertCircle,
	Calendar,
	Check,
	ChevronDown,
	Clock,
	ExternalLink,
	Loader2,
	RefreshCw,
	Settings,
	Shield,
	Unlink,
	Zap,
} from 'lucide-react';
import { useId, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useGoogleCalendarSync } from '@/hooks/use-google-calendar-sync';
import { cn } from '@/lib/utils';

// ========================================
// LGPD CONSENT DIALOG
// ========================================

interface LgpdConsentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAccept: () => void;
	onDecline: () => void;
	includeAmounts: boolean;
	onIncludeAmountsChange: (value: boolean) => void;
	isLoading: boolean;
}

function LgpdConsentDialog({
	open,
	onOpenChange,
	onAccept,
	onDecline,
	includeAmounts,
	onIncludeAmountsChange,
	isLoading,
}: LgpdConsentDialogProps) {
	const includeAmountsId = useId();
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5 text-primary" />
						Consentimento para Sincronização
					</DialogTitle>
					<DialogDescription>
						De acordo com a Lei Geral de Proteção de Dados (LGPD)
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="text-sm text-muted-foreground space-y-3">
						<p>
							Ao habilitar a sincronização com o Google Calendar, você autoriza o AegisWallet a:
						</p>

						<ul className="list-disc list-inside space-y-1 ml-2">
							<li>Ler eventos do seu Google Calendar</li>
							<li>Criar e modificar eventos no seu Google Calendar</li>
							<li>Sincronizar seus eventos financeiros com o Google Calendar</li>
						</ul>

						<div className="bg-muted/50 p-3 rounded-lg mt-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label htmlFor="include-amounts" className="text-sm font-medium">
										Incluir valores financeiros
									</Label>
									<p className="text-xs text-muted-foreground">
										Mostrar R$ nos eventos do Google Calendar
									</p>
								</div>
								<Switch
									id={includeAmountsId}
									checked={includeAmounts}
									onCheckedChange={onIncludeAmountsChange}
								/>
							</div>

							{includeAmounts && (
								<Alert variant="destructive" className="mt-3">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription className="text-xs">
										⚠️ Os valores financeiros serão visíveis para qualquer pessoa com acesso ao seu
										Google Calendar.
									</AlertDescription>
								</Alert>
							)}
						</div>

						<p className="text-xs mt-4">
							Você pode revogar este consentimento a qualquer momento desconectando sua conta do
							Google Calendar. Seus dados serão tratados de acordo com nossa{' '}
							<a href="/privacidade" className="text-primary hover:underline">
								Política de Privacidade
							</a>
							.
						</p>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={onDecline} disabled={isLoading}>
						Não Aceito
					</Button>
					<Button onClick={onAccept} disabled={isLoading}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Aceito e Autorizo
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ========================================
// DISCONNECT CONFIRMATION DIALOG
// ========================================

interface DisconnectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isLoading: boolean;
}

function DisconnectDialog({ open, onOpenChange, onConfirm, isLoading }: DisconnectDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Desconectar Google Calendar?</DialogTitle>
					<DialogDescription>
						Você está prestes a desconectar sua conta do Google Calendar.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<p className="text-sm text-muted-foreground">Ao desconectar:</p>
					<ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
						<li>A sincronização será interrompida</li>
						<li>Os eventos já sincronizados permanecerão em ambas as plataformas</li>
						<li>Você precisará reconectar para sincronizar novamente</li>
					</ul>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
						Cancelar
					</Button>
					<Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Desconectar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ========================================
// SYNC STATUS BADGE
// ========================================

interface SyncStatusBadgeProps {
	isEnabled: boolean;
	lastSyncAt: string | null;
	isSyncing: boolean;
}

function SyncStatusBadge({ isEnabled, lastSyncAt, isSyncing }: SyncStatusBadgeProps) {
	if (isSyncing) {
		return (
			<Badge variant="outline" className="gap-1">
				<Loader2 className="h-3 w-3 animate-spin" />
				Sincronizando...
			</Badge>
		);
	}

	if (!isEnabled) {
		return (
			<Badge variant="secondary" className="gap-1">
				<Clock className="h-3 w-3" />
				Pausado
			</Badge>
		);
	}

	if (lastSyncAt) {
		const lastSync = new Date(lastSyncAt);
		const minutesAgo = Math.floor((Date.now() - lastSync.getTime()) / 60000);

		let timeText: string;
		if (minutesAgo < 1) {
			timeText = 'Agora';
		} else if (minutesAgo < 60) {
			timeText = `${minutesAgo}min atrás`;
		} else if (minutesAgo < 1440) {
			timeText = `${Math.floor(minutesAgo / 60)}h atrás`;
		} else {
			timeText = lastSync.toLocaleDateString('pt-BR');
		}

		return (
			<Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
				<Check className="h-3 w-3" />
				{timeText}
			</Badge>
		);
	}

	return (
		<Badge variant="outline" className="gap-1">
			<Zap className="h-3 w-3" />
			Ativo
		</Badge>
	);
}

// ========================================
// MAIN COMPONENT
// ========================================

export function GoogleCalendarSettings() {
	const {
		status,
		settings,
		isLoading,
		isConnected,
		isEnabled,
		isSyncing,
		hasConflicts,
		isChannelExpiringSoon,
		connect,
		disconnect,
		updateSettings,
		fullSync,
		incrementalSync,
		renewChannel,
		isConnecting,
		isDisconnecting,
		isUpdatingSettings,
	} = useGoogleCalendarSync();

	// Dialog states
	const [showConsentDialog, setShowConsentDialog] = useState(false);
	const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
	const [includeAmounts, setIncludeAmounts] = useState(false);

	// Collapsible state
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

	// Handle connect
	const handleConnect = () => {
		connect(undefined);
	};

	// Handle enable sync (shows consent dialog first)
	const handleEnableSync = () => {
		setIncludeAmounts(settings?.syncFinancialAmounts ?? false);
		setShowConsentDialog(true);
	};

	// Handle consent accept
	const handleConsentAccept = () => {
		updateSettings({
			syncEnabled: true,
			syncFinancialAmounts: includeAmounts,
			lgpdConsentGiven: true,
		});
		setShowConsentDialog(false);
	};

	// Handle disable sync
	const handleDisableSync = () => {
		updateSettings({ syncEnabled: false });
	};

	// Handle disconnect
	const handleDisconnect = () => {
		disconnect(undefined);
		setShowDisconnectDialog(false);
	};

	// Handle direction change
	const handleDirectionChange = (value: string) => {
		updateSettings({
			syncDirection: value as 'one_way_to_google' | 'one_way_from_google' | 'bidirectional',
		});
	};

	// Handle amounts toggle
	const handleAmountsChange = (checked: boolean) => {
		updateSettings({ syncFinancialAmounts: checked });
	};

	// Loading skeleton
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64 mt-1" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								Google Calendar
							</CardTitle>
							<CardDescription>
								Sincronize seus eventos financeiros com o Google Calendar
							</CardDescription>
						</div>

						{isConnected && (
							<SyncStatusBadge
								isEnabled={isEnabled}
								lastSyncAt={status?.lastSyncAt ?? null}
								isSyncing={isSyncing}
							/>
						)}
					</div>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Not Connected State */}
					{!isConnected && (
						<div className="text-center py-6">
							<Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="font-medium mb-2">Conecte seu Google Calendar</h3>
							<p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
								Sincronize automaticamente seus eventos financeiros com o Google Calendar para
								manter tudo organizado em um só lugar.
							</p>
							<Button onClick={handleConnect} disabled={isConnecting}>
								{isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								<Calendar className="mr-2 h-4 w-4" />
								Conectar Google Calendar
							</Button>
						</div>
					)}

					{/* Connected State */}
					{isConnected && (
						<>
							{/* Connection Info */}
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
										<Calendar className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="font-medium text-sm">
											{status?.googleEmail || 'Google Calendar'}
										</p>
										<p className="text-xs text-muted-foreground">Conta conectada</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowDisconnectDialog(true)}
									className="text-muted-foreground hover:text-destructive"
								>
									<Unlink className="h-4 w-4" />
								</Button>
							</div>
							{/* Warnings */}
							{isChannelExpiringSoon && (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Canal de notificações expirando</AlertTitle>
									<AlertDescription className="flex items-center justify-between">
										<span>O canal de notificações precisa ser renovado.</span>
										<Button size="sm" variant="outline" onClick={() => renewChannel()}>
											Renovar
										</Button>
									</AlertDescription>
								</Alert>
							)}
							{hasConflicts && (
								<Alert variant="default">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Conflitos detectados</AlertTitle>
									<AlertDescription>
										Alguns eventos têm conflitos de sincronização. Verifique a seção de histórico
										para mais detalhes.
									</AlertDescription>
								</Alert>
							)}{' '}
							<Separator />
							{/* Main Toggle */}
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label className="text-base font-medium">Sincronização automática</Label>
									<p className="text-sm text-muted-foreground">
										{isEnabled
											? 'Eventos são sincronizados automaticamente'
											: 'A sincronização está pausada'}
									</p>
								</div>
								<Switch
									checked={isEnabled}
									onCheckedChange={(checked) => {
										if (checked) {
											handleEnableSync();
										} else {
											handleDisableSync();
										}
									}}
									disabled={isUpdatingSettings}
								/>
							</div>
							{/* Settings (only when enabled) */}
							{isEnabled && (
								<>
									<Separator />
									{/* Sync Direction */}
									<div className="space-y-2">
										<Label>Direção da sincronização</Label>
										<Select
											value={settings?.syncDirection || 'bidirectional'}
											onValueChange={handleDirectionChange}
											disabled={isUpdatingSettings}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="bidirectional">↔️ Bidirecional (recomendado)</SelectItem>
												<SelectItem value="one_way_to_google">
													➡️ Apenas para o Google Calendar
												</SelectItem>
												<SelectItem value="one_way_from_google">
													⬅️ Apenas do Google Calendar
												</SelectItem>
											</SelectContent>
										</Select>
										<p className="text-xs text-muted-foreground">
											{settings?.syncDirection === 'bidirectional' &&
												'Mudanças em qualquer lugar serão sincronizadas'}
											{settings?.syncDirection === 'one_way_to_google' &&
												'Apenas eventos do AegisWallet vão para o Google'}
											{settings?.syncDirection === 'one_way_from_google' &&
												'Apenas eventos do Google vêm para o AegisWallet'}
										</p>
									</div>
									{/* Include Amounts */}
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label>Incluir valores financeiros</Label>
											<p className="text-xs text-muted-foreground">
												Mostrar valores (R$) nos eventos do Google Calendar
											</p>
										</div>
										<Switch
											checked={Boolean(settings?.syncFinancialAmounts)}
											onCheckedChange={handleAmountsChange}
											disabled={isUpdatingSettings}
										/>
									</div>{' '}
									{/* Manual Sync Actions */}
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => incrementalSync()}
											disabled={isSyncing}
											className="flex-1"
										>
											{isSyncing ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<RefreshCw className="mr-2 h-4 w-4" />
											)}
											Sincronizar agora
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => fullSync()}
											disabled={isSyncing}
										>
											Sync completo
										</Button>
									</div>
								</>
							)}
							{/* Advanced Settings */}
							<Collapsible
								open={isAdvancedOpen}
								onOpenChange={setIsAdvancedOpen}
								className="space-y-2"
							>
								<CollapsibleTrigger asChild>
									<Button variant="ghost" size="sm" className="w-full justify-between">
										<span className="flex items-center gap-2">
											<Settings className="h-4 w-4" />
											Configurações avançadas
										</span>
										<ChevronDown
											className={cn('h-4 w-4 transition-transform', isAdvancedOpen && 'rotate-180')}
										/>
									</Button>
								</CollapsibleTrigger>
								<CollapsibleContent className="space-y-4 pt-2">
									<div className="text-sm text-muted-foreground space-y-2 p-3 bg-muted/30 rounded-lg">
										<div className="flex justify-between">
											<span>Última sincronização:</span>
											<span>
												{status?.lastSyncAt
													? new Date(status.lastSyncAt).toLocaleString('pt-BR')
													: 'Nunca'}
											</span>
										</div>
										<div className="flex justify-between">
											<span>Canal expira em:</span>
											<span>
												{status?.channelExpiresAt
													? new Date(status.channelExpiresAt).toLocaleDateString('pt-BR')
													: 'N/A'}
											</span>
										</div>
									</div>

									<Button variant="link" size="sm" asChild className="p-0 h-auto">
										<a
											href="https://myaccount.google.com/permissions"
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs"
										>
											Gerenciar permissões no Google
											<ExternalLink className="ml-1 h-3 w-3" />
										</a>
									</Button>
								</CollapsibleContent>
							</Collapsible>
						</>
					)}
				</CardContent>
			</Card>

			{/* Dialogs */}
			<LgpdConsentDialog
				open={showConsentDialog}
				onOpenChange={setShowConsentDialog}
				onAccept={handleConsentAccept}
				onDecline={() => setShowConsentDialog(false)}
				includeAmounts={includeAmounts}
				onIncludeAmountsChange={setIncludeAmounts}
				isLoading={isUpdatingSettings}
			/>

			<DisconnectDialog
				open={showDisconnectDialog}
				onOpenChange={setShowDisconnectDialog}
				onConfirm={handleDisconnect}
				isLoading={isDisconnecting}
			/>
		</>
	);
}

export default GoogleCalendarSettings;
