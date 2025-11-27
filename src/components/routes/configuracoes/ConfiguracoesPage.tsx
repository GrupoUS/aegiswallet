import { Bell, Settings, Shield, User } from 'lucide-react';

import { PrivacyPreferences } from '@/components/privacy';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RouteGuard } from '@/lib/auth/route-guard';

export function ConfiguracoesPage() {
	return (
		<RouteGuard>
			<div className="container mx-auto max-w-4xl py-6 space-y-6">
				<div className="flex items-center gap-3">
					<Settings className="h-8 w-8 text-primary" />
					<div>
						<h1 className="text-2xl font-bold">Configurações</h1>
						<p className="text-muted-foreground">
							Gerencie suas preferências e configurações de privacidade
						</p>
					</div>
				</div>

				<Tabs defaultValue="privacy" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="privacy" className="flex items-center gap-2">
							<Shield className="h-4 w-4" />
							Privacidade
						</TabsTrigger>
						<TabsTrigger value="profile" className="flex items-center gap-2">
							<User className="h-4 w-4" />
							Perfil
						</TabsTrigger>
						<TabsTrigger
							value="notifications"
							className="flex items-center gap-2"
						>
							<Bell className="h-4 w-4" />
							Notificações
						</TabsTrigger>
					</TabsList>

					<TabsContent value="privacy" className="mt-6">
						<PrivacyPreferences />
					</TabsContent>

					<TabsContent value="profile" className="mt-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="h-5 w-5" />
									Informações do Perfil
								</CardTitle>
								<CardDescription>
									Gerencie suas informações pessoais
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Em breve você poderá editar suas informações de perfil aqui.
								</p>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="notifications" className="mt-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Bell className="h-5 w-5" />
									Preferências de Notificação
								</CardTitle>
								<CardDescription>
									Configure como deseja receber notificações
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Em breve você poderá configurar suas notificações aqui.
								</p>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</RouteGuard>
	);
}
