import { createLazyFileRoute } from '@tanstack/react-router';
import { ArrowLeft, CreditCard, Plus, Smartphone } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { PaymentMethodManager } from '@/components/billing/PaymentMethodManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentMethods } from '@/hooks/billing';

export const Route = createLazyFileRoute('/billing/payment-methods')({
	component: PaymentMethodsPage,
});

function PaymentMethodsPage() {
	const { data, isLoading, error } = usePaymentMethods();

	if (error) {
		return (
			<div className="container mx-auto py-16 px-4">
				<div className="max-w-4xl mx-auto">
					<Card>
						<CardHeader>
							<CardTitle className="text-red-600">Erro ao Carregar Métodos de Pagamento</CardTitle>
							<CardDescription>
								Não foi possível carregar seus métodos de pagamento. Tente novamente mais tarde.
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<>
			<Helmet>
				<title>Métodos de Pagamento | AegisWallet</title>
				<meta
					name="description"
					content="Gerencie seus métodos de pagamento包括 cartões, PIX e contas bancárias."
				/>
			</Helmet>

			<div className="container mx-auto py-8 px-4">
				<div className="max-w-6xl mx-auto">
					{/* Header */}
					<div className="mb-8">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<Button variant="outline" size="sm" asChild>
									<a href="/billing">
										<ArrowLeft className="h-4 w-4 mr-2" />
										Voltar
									</a>
								</Button>
								<div>
									<h1 className="text-3xl font-bold tracking-tight">Métodos de Pagamento</h1>
									<p className="text-muted-foreground">
										Gerencie seus cartões, chaves PIX e contas bancárias
									</p>
								</div>
							</div>

							<Button>
								<Plus className="h-4 w-4 mr-2" />
								Adicionar Método
							</Button>
						</div>

						{/* Payment Type Icons */}
						<div className="flex gap-4 mb-6">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<CreditCard className="h-4 w-4" />
								Cartões
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Smartphone className="h-4 w-4" />
								PIX
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<ArrowLeft className="h-4 w-4" />
								Contas Bancárias
							</div>
						</div>
					</div>

					{/* Main Content */}
					<Card>
						<CardHeader>
							<CardTitle>Seus Métodos de Pagamento</CardTitle>
							<CardDescription>
								Adicione, remova ou gerencie seus métodos de pagamento
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="space-y-4">
									{[...Array(3)].map((_, i) => (
										<div key={i} className="space-y-2">
											<Skeleton className="h-20 w-full rounded-lg" />
										</div>
									))}
								</div>
							) : (
								<PaymentMethodManager paymentMethods={data?.paymentMethods ?? []} />
							)}
						</CardContent>
					</Card>

					{/* Security Notice */}
					<Card className="mt-6 border-blue-200 bg-blue-50/50">
						<CardHeader>
							<CardTitle className="text-blue-800 text-lg">🔒 Segurança</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-blue-700">
								Seus dados de pagamento são criptografados e processados com total segurança.
								Armazenamos apenas tokens seguros e nunca compartilhamos suas informações.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
