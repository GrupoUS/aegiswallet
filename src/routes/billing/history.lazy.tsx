import { createLazyFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Calendar, Download, Filter, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { BillingHistory } from '@/components/billing/BillingHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillingHistory } from '@/hooks/billing';

export const Route = createLazyFileRoute('/billing/history')({
	component: BillingHistoryPage,
});

function BillingHistoryPage() {
	const { data, isLoading, error } = useBillingHistory({ limit: 20 });

	if (error) {
		return (
			<div className="container mx-auto py-16 px-4">
				<div className="max-w-4xl mx-auto">
					<Card>
						<CardHeader>
							<CardTitle className="text-red-600">Erro ao Carregar Histórico</CardTitle>
							<CardDescription>
								Não foi possível carregar seu histórico de pagamentos. Tente novamente mais tarde.
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
				<title>Histórico de Pagamentos | AegisWallet</title>
				<meta
					name="description"
					content="Visualize seu histórico completo de pagamentos e transações."
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
									<h1 className="text-3xl font-bold tracking-tight">Histórico de Pagamentos</h1>
									<p className="text-muted-foreground">
										Veja todas as suas transações e pagamentos realizados
									</p>
								</div>
							</div>

							<Button variant="outline" size="sm">
								<Download className="h-4 w-4 mr-2" />
								Exportar
							</Button>
						</div>

						{/* Search and Filters */}
						<div className="flex flex-col sm:flex-row gap-4">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input placeholder="Buscar transações..." className="pl-10" />
							</div>

							<Button variant="outline" size="sm">
								<Filter className="h-4 w-4 mr-2" />
								Filtrar
							</Button>

							<Button variant="outline" size="sm">
								<Calendar className="h-4 w-4 mr-2" />
								Período
							</Button>
						</div>
					</div>

					{/* Main Content */}
					<Card>
						<CardHeader>
							<CardTitle>Transações</CardTitle>
							<CardDescription>{data?.total ?? 0} transações encontradas</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="space-y-4">
									{[...Array(5)].map((_, i) => (
										<div key={i} className="space-y-2">
											<Skeleton className="h-4 w-1/4" />
											<Skeleton className="h-4 w-1/2" />
											<Skeleton className="h-4 w-1/3" />
										</div>
									))}
								</div>
							) : (
								<BillingHistory payments={data?.payments ?? []} />
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
