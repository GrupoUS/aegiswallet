import { HelpCircle, Mail, Phone, Shield } from 'lucide-react';

import { PricingTable } from '@/components/billing/PricingTable';
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { useSubscription } from '@/hooks/billing';
import { RouteGuard } from '@/lib/auth/route-guard';

// FAQ data with Brazilian Portuguese content
const faqItems = [
	{
		question: 'Como funciona a assinatura do AegisWallet?',
		answer:
			'O AegisWallet oferece planos mensais e anuais com diferentes níveis de recursos. Você pode atualizar, cancelar ou pausar sua assinatura a qualquer momento sem multas.',
	},
	{
		question: 'Quais métodos de pagamento são aceitos?',
		answer:
			'Aceitamos cartões de crédito (Visa, Mastercard, Elo, Hipercard), débito em conta, PIX e boleto bancário para pagamentos anuais.',
	},
	{
		question: 'Posso cancelar minha assinatura a qualquer momento?',
		answer:
			'Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso aos recursos premium continua até o final do período pago.',
	},
	{
		question: 'O AegisWallet é seguro para minhas informações financeiras?',
		answer:
			'Sim, utilizamos criptografia de ponta a ponta e seguimos todas as normas do Banco Central e LGPD para proteger seus dados financeiros.',
	},
	{
		question: 'Existe período de teste gratuito?',
		answer:
			'Sim, oferecemos 7 dias de teste gratuito em todos os planos pagos para você conhecer todos os recursos antes de decidir.',
	},
];

function BillingPage() {
	const { data: subscription } = useSubscription();

	return (
		<RouteGuard>
			<div className="container mx-auto space-y-8 p-4">
				{/* Header Section */}
				<div className="text-center space-y-4">
					<h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text font-bold text-4xl text-transparent">
						Planos e Assinatura
					</h1>
					<p className="mx-auto max-w-2xl text-muted-foreground text-lg">
						Escolha o plano ideal para gerenciar suas finanças com inteligência
						e segurança
					</p>
				</div>

				{/* Current Subscription Status */}
				<Card className="border-2 border-primary/20">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Sua Assinatura Atual
							</CardTitle>
							<SubscriptionStatus />
						</div>
						<CardDescription>
							{subscription?.subscription?.status === 'active'
								? 'Você está aproveitando todos os benefícios do seu plano atual'
								: 'Atualize seu plano para desbloquear todos os recursos premium'}
						</CardDescription>
					</CardHeader>
					{subscription?.subscription && (
						<CardContent>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">Plano Atual</p>
									<p className="font-semibold">
										{subscription.plan?.name || 'Gratuito'}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										Próxima cobrança
									</p>
									<p className="font-semibold">
										{subscription.subscription.cancelAtPeriodEnd
											? 'Cancela ao final do período'
											: subscription.subscription.currentPeriodEnd
												? new Date(
														subscription.subscription.currentPeriodEnd,
													).toLocaleDateString('pt-BR')
												: 'N/A'}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">Status</p>
									<div className="flex items-center gap-2">
										<Badge
											variant={
												subscription.subscription.status === 'active'
													? 'success'
													: subscription.subscription.status === 'trialing'
														? 'default'
														: subscription.subscription.status === 'past_due'
															? 'destructive'
															: 'secondary'
											}
										>
											{subscription.subscription.status === 'active' && 'Ativa'}
											{subscription.subscription.status === 'trialing' &&
												'Em teste'}
											{subscription.subscription.status === 'past_due' &&
												'Pagamento atrasado'}
											{subscription.subscription.status === 'canceled' &&
												'Cancelada'}
											{!subscription.subscription.status && 'Gratuito'}
										</Badge>
									</div>
								</div>
							</div>
						</CardContent>
					)}
				</Card>

				{/* Pricing Table */}
				<div className="space-y-6">
					<div className="text-center">
						<h2 className="font-semibold text-2xl">Escolha seu plano</h2>
						<p className="text-muted-foreground">
							Todos os planos incluem criptografia de ponta a ponta e suporte
						</p>
					</div>
					<PricingTable />
				</div>

				{/* FAQ Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<HelpCircle className="h-5 w-5" />
							Dúvidas Frequentes
						</CardTitle>
						<CardDescription>
							Tire suas dúvidas sobre planos e assinaturas
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{faqItems.map((item, itemIndex) => (
							<div key={item.question.replace(/\s+/g, '-').toLowerCase()} className="space-y-2">
								<h3 className="font-medium text-lg">{item.question}</h3>
								<p className="text-muted-foreground">{item.answer}</p>
								{itemIndex < faqItems.length - 1 && (
									<hr className="border-border mt-4" />
								)}
							</div>
						))}
					</CardContent>
				</Card>

				{/* Support Contact */}
				<Card className="border-2 border-muted">
					<CardHeader>
						<CardTitle>Precisa de ajuda?</CardTitle>
						<CardDescription>
							Nossa equipe de suporte está sempre pronta para ajudar
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
									<Mail className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="font-medium">E-mail</p>
									<p className="text-muted-foreground text-sm">
										suporte@aegiswallet.com.br
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
									<Phone className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="font-medium">Telefone</p>
									<p className="text-muted-foreground text-sm">0800 123 4567</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
									<HelpCircle className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="font-medium">Help Center</p>
									<p className="text-muted-foreground text-sm">
										ajuda.aegiswallet.com.br
									</p>
								</div>
							</div>
						</div>
						<div className="mt-6">
							<Button variant="outline" className="w-full" size="lg">
								Falar com especialista financeiro
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Security and Compliance */}
				<Card className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
							<Shield className="h-5 w-5" />
							Segurança e Compliance
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<p className="font-medium">LGPD Compliance</p>
								<p className="text-muted-foreground text-sm">
									Suas informações são protegidas de acordo com a Lei Geral de
									Proteção de Dados brasileira
								</p>
							</div>
							<div className="space-y-2">
								<p className="font-medium">Criptografia Avançada</p>
								<p className="text-muted-foreground text-sm">
									Dados criptografados em trânsito e em repouso com padrões
									internacionais de segurança
								</p>
							</div>
							<div className="space-y-2">
								<p className="font-medium">Banco Central do Brasil</p>
								<p className="text-muted-foreground text-sm">
									Operações PIX e transações seguras seguindo normas do BCB
								</p>
							</div>
							<div className="space-y-2">
								<p className="font-medium">Certificado SSL</p>
								<p className="text-muted-foreground text-sm">
									Conexão segura e autenticada para todas as operações
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</RouteGuard>
	);
}

export { BillingPage };
