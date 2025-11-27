import { Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { useId } from 'react';

import { useGoogleCalendarSync } from '../../hooks/use-google-calendar-sync';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';

export function GoogleCalendarSettings() {
	const syncEnabledId = useId();
	const syncAmountsId = useId();

	const {
		syncStatus,
		syncSettings,
		updateSettings,
		startOAuthFlow,
		requestFullSync,
		isLoading,
	} = useGoogleCalendarSync();

	if (isLoading) {
		return (
			<div className="flex justify-center p-4">
				<Loader2 className="animate-spin" />
			</div>
		);
	}

	const isConnected = syncStatus?.isConnected;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CalendarIcon className="h-5 w-5" />
						Integração Google Calendar
					</CardTitle>
					<CardDescription>
						Sincronize seus eventos financeiros com sua agenda pessoal.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div className="space-y-1">
							<div className="font-medium">Status da Conexão</div>
							<div className="text-sm text-muted-foreground">
								{isConnected
									? `Conectado como ${syncStatus?.googleEmail}`
									: 'Não conectado'}
							</div>
						</div>
						{isConnected ? (
							<Badge variant="default" className="bg-green-500">
								Conectado
							</Badge>
						) : (
							<Button onClick={startOAuthFlow}>Conectar</Button>
						)}
					</div>

					{isConnected && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label htmlFor={syncEnabledId}>Sincronização Automática</Label>
								<Switch
									id={syncEnabledId}
									checked={syncSettings?.sync_enabled}
									onCheckedChange={(checked) =>
										updateSettings({ sync_enabled: checked })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Direção da Sincronização</Label>
								<Select
									value={syncSettings?.sync_direction}
									onValueChange={(
										value:
											| 'one_way_to_google'
											| 'one_way_from_google'
											| 'bidirectional',
									) => updateSettings({ sync_direction: value })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="one_way_to_google">
											Aegis → Google
										</SelectItem>
										<SelectItem value="one_way_from_google">
											Google → Aegis
										</SelectItem>
										<SelectItem value="bidirectional">Bidirecional</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id={syncAmountsId}
									checked={syncSettings?.sync_financial_amounts}
									onCheckedChange={(checked) =>
										updateSettings({
											sync_financial_amounts: checked as boolean,
										})
									}
								/>
								<div className="grid gap-1.5 leading-none">
									<Label htmlFor={syncAmountsId}>
										Sincronizar Valores (LGPD)
									</Label>
									<p className="text-sm text-muted-foreground">
										Permitir que valores monetários sejam enviados ao Google
										Calendar.
									</p>
								</div>
							</div>

							<div className="pt-4">
								<Button
									variant="outline"
									onClick={() => requestFullSync()}
									className="w-full"
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Sincronizar Agora
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
