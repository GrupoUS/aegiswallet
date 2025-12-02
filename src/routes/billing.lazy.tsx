import {
	ArrowRight,
	CheckCircle,
	CreditCard,
	HelpCircle,
	Lock,
	Mail,
	Phone,
	Shield,
	Zap,
} from 'lucide-react';
import { useId } from 'react';

import { PricingTable } from '@/components/billing/PricingTable';
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSubscription } from '@/hooks/billing';
import { RouteGuard } from '@/lib/auth/route-guard';
import { cn } from '@/lib/utils';

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
	{
		question: 'Como funciona o PIX no AegisWallet?',
		answer:
			'O PIX é processado pelo Banco Central do Brasil com total segurança. Você pode enviar e receber transferências instantâneas 24/7.',
	},
];

// Helper components to reduce complexity
const GetStatusBadge = (status: string) => {
	const variant = (
		status === 'active'
			? 'success'
			: status === 'trialing'
				? 'default'
				: status === 'past_due'
					? 'destructive'
					: 'secondary'
	) as 'success' | 'default' | 'destructive' | 'secondary';
	const label = `Status da assinatura: ${
		status === 'active'
			? 'Ativo'
			: status === 'trialing'
				? 'Em teste'
				: status === 'past_due'
					? 'Pagamento atrasado'
					: status === 'canceled'
						? 'Cancelado'
						: 'Gratuito'
	}`;
	const text =
		(status === 'active' && 'Ativa') ||
		(status === 'trialing' && 'Em teste') ||
		(status === 'past_due' && 'Pagamento atrasado') ||
		(status === 'canceled' && 'Cancelada') ||
		'Gratuito';

	return { variant, label, text };
};

const HeaderSection = () => (
	<div className="text-center space-y-4">
		<h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text font-bold text-4xl text-transparent">
			Planos e Assinatura
		</h1>
		<p className="mx-auto max-w-2xl text-muted-foreground text-lg">
			Escolha o plano ideal para gerenciar suas finanças com inteligência e segurança
		</p>

		{/* Trust badges */}
		<div className="flex flex-wrap items-center justify-center gap-4 mt-6">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Shield className="h-4 w-4 text-green-600" aria-label="LGPD Compliant" />
				<span>LGPD Compliant</span>
			</div>
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Lock className="h-4 w-4 text-blue-600" aria-label="SSL Seguro" />
				<span>SSL Seguro</span>
			</div>
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<CheckCircle className="h-4 w-4 text-green-600" aria-label="BCB Aprovado" />
				<span>BCB Aprovado</span>
			</div>
		</div>

		{/* Payment methods */}
		<div className="flex items-center justify-center gap-4 mt-4">
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<CreditCard className="h-4 w-4" aria-label="Cartões aceitos" />
				<span>Visa, Mastercard, Elo</span>
			</div>
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<Zap className="h-4 w-4 text-yellow-600" aria-label="PIX instantâneo" />
				<span>PIX Instantâneo</span>
			</div>
		</div>
	</div>
);

const SubscriptionStatusSection = ({
	subscription,
	subscriptionStatusId,
}: {
	subscription: any;
	subscriptionStatusId: string;
}) => (
	<Card className="border-2 border-primary/20" role="region" aria-labelledby={subscriptionStatusId}>
		<CardHeader>
			<div className="flex items-center justify-between">
				<CardTitle id={subscriptionStatusId} className="flex items-center gap-2">
					<Shield className="h-5 w-5" />
					Sua Assinatura Atual
				</CardTitle>
				<SubscriptionStatus showDetails />
			</div>
			<CardDescription role="status" aria-live="polite">
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
						<p className="font-semibold">{subscription.plan?.name || 'Gratuito'}</p>
					</div>
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">Próxima cobrança</p>
						<p className="font-semibold">
							{subscription.subscription.cancelAtPeriodEnd
								? 'Cancela ao final do período'
								: subscription.subscription.currentPeriodEnd
									? new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')
									: 'N/A'}
						</p>
					</div>
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">Status</p>
						<div className="flex items-center gap-2">
							<Badge
								variant={GetStatusBadge(subscription.subscription.status).variant}
								aria-label={GetStatusBadge(subscription.subscription.status).label}
							>
								{GetStatusBadge(subscription.subscription.status).text}
							</Badge>
						</div>
					</div>
				</div>
			</CardContent>
		)}
	</Card>
);

const PricingSection = ({ pricingSectionId }: { pricingSectionId: string }) => (
	<section className="space-y-6" aria-labelledby={pricingSectionId}>
		<div className="text-center">
			<h2 id={pricingSectionId} className="font-semibold text-2xl">
				Escolha seu plano
			</h2>
			<output className="text-muted-foreground" aria-live="polite">
				Todos os planos incluem criptografia de ponta a ponta e suporte especializado
			</output>
		</div>
		<PricingTable />
	</section>
);

const FAQSection = ({ faqId }: { faqId: string }) => (
	<Card role="region" aria-labelledby={faqId}>
		<CardHeader>
			<CardTitle id={faqId} className="flex items-center gap-2">
				<HelpCircle className="h-5 w-5" />
				Dúvidas Frequentes
			</CardTitle>
			<CardDescription>Tire suas dúvidas sobre planos e assinaturas</CardDescription>
		</CardHeader>
		<CardContent className="space-y-4">
			{faqItems.map((item, itemIndex) => {
				const questionId = `faq-question-${itemIndex}`;
				const answerId = `faq-answer-${itemIndex}`;

				return (
					<Collapsible key={item.question.replace(/\s+/g, '-').toLowerCase()} className="space-y-2">
						<CollapsibleTrigger
							className={cn(
								'flex w-full items-center justify-between rounded-lg p-4 text-left text-sm font-medium',
								'hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
								'transition-colors duration-200 group',
							)}
							aria-describedby={answerId}
							aria-expanded="false"
							id={questionId}
						>
							<span className="text-base font-medium pr-4">{item.question}</span>
							<ArrowRight
								className="h-4 w-4 rotate-90 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
								aria-hidden="true"
							/>
						</CollapsibleTrigger>
						<CollapsibleContent
							id={answerId}
							className="px-4 pb-4 pt-2"
							aria-labelledby={questionId}
						>
							<p className="text-muted-foreground leading-relaxed">{item.answer}</p>
						</CollapsibleContent>
					</Collapsible>
				);
			})}
		</CardContent>
	</Card>
);

const SupportSection = ({ supportId }: { supportId: string }) => (
	<Card className="border-2 border-muted" role="region" aria-labelledby={supportId}>
		<CardHeader>
			<CardTitle id={supportId}>Precisa de ajuda?</CardTitle>
			<CardDescription role="status" aria-live="polite">
				Nossa equipe de suporte está sempre pronta para ajudar
			</CardDescription>
		</CardHeader>
		<CardContent>
			<ul className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Opções de contato">
				<li className="flex items-center gap-3">
					<div
						className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
						aria-hidden="true"
					>
						<Mail className="h-5 w-5 text-primary" />
					</div>
					<div>
						<p className="font-medium">E-mail</p>
						<a
							href="mailto:suporte@aegiswallet.com.br"
							className="text-muted-foreground text-sm hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
							aria-label="Enviar email para suporte"
						>
							suporte@aegiswallet.com.br
						</a>
					</div>
				</li>
				<li className="flex items-center gap-3">
					<div
						className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
						aria-hidden="true"
					>
						<Phone className="h-5 w-5 text-primary" />
					</div>
					<div>
						<p className="font-medium">Telefone</p>
						<a
							href="tel:08001234567"
							className="text-muted-foreground text-sm hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
							aria-label="Ligar para suporte: 0800 123 4567"
						>
							0800 123 4567
						</a>
					</div>
				</li>
				<li className="flex items-center gap-3">
					<div
						className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
						aria-hidden="true"
					>
						<HelpCircle className="h-5 w-5 text-primary" />
					</div>
					<div>
						<p className="font-medium">Help Center</p>
						<a
							href="https://ajuda.aegiswallet.com.br"
							className="text-muted-foreground text-sm hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Acessar central de ajuda em nova janela"
						>
							ajuda.aegiswallet.com.br
						</a>
					</div>
				</li>
			</ul>
			<div className="mt-6">
				<Button
					variant="outline"
					className="w-full"
					size="lg"
					aria-label="Entrar em contato com especialista financeiro"
				>
					Falar com especialista financeiro
				</Button>
			</div>
		</CardContent>
	</Card>
);

const SecuritySection = ({ securityId }: { securityId: string }) => (
	<Card
		className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20"
		role="region"
		aria-labelledby={securityId}
	>
		<CardHeader>
			<CardTitle
				id={securityId}
				className="flex items-center gap-2 text-green-700 dark:text-green-300"
			>
				<Shield className="h-5 w-5" />
				Segurança e Compliance
			</CardTitle>
			<CardDescription>Informações sobre proteção de dados e segurança</CardDescription>
		</CardHeader>
		<CardContent>
			<ul className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Certificações e proteções">
				<li className="space-y-2">
					<p className="font-medium flex items-center gap-2">
						<CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
						<span>LGPD Compliance</span>
					</p>
					<p className="text-muted-foreground text-sm">
						Suas informações são protegidas de acordo com a Lei Geral de Proteção de Dados
						brasileira
					</p>
				</li>
				<li className="space-y-2">
					<p className="font-medium flex items-center gap-2">
						<Lock className="h-4 w-4 text-blue-600" aria-hidden="true" />
						<span>Criptografia Avançada</span>
					</p>
					<p className="text-muted-foreground text-sm">
						Dados criptografados em trânsito e em repouso com padrões internacionais de segurança
					</p>
				</li>
				<li className="space-y-2">
					<p className="font-medium flex items-center gap-2">
						<CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
						<span>Banco Central do Brasil</span>
					</p>
					<p className="text-muted-foreground text-sm">
						Operações PIX e transações seguras seguindo normas do BCB
					</p>
				</li>
				<li className="space-y-2">
					<p className="font-medium flex items-center gap-2">
						<Shield className="h-4 w-4 text-blue-600" aria-hidden="true" />
						<span>Certificado SSL</span>
					</p>
					<p className="text-muted-foreground text-sm">
						Conexão segura e autenticada para todas as operações
					</p>
				</li>
			</ul>
		</CardContent>
	</Card>
);

export function BillingPage() {
	const { data: subscription } = useSubscription();
	const subscriptionStatusId = useId();
	const pricingSectionId = useId();
	const faqId = useId();
	const supportId = useId();
	const securityId = useId();

	return (
		<RouteGuard>
			<div className="container mx-auto space-y-8 p-4">
				<HeaderSection />
				<SubscriptionStatusSection
					subscription={subscription}
					subscriptionStatusId={subscriptionStatusId}
				/>
				<PricingSection pricingSectionId={pricingSectionId} />
				<FAQSection faqId={faqId} />
				<SupportSection supportId={supportId} />
				<SecuritySection securityId={securityId} />
			</div>
		</RouteGuard>
	);
}
