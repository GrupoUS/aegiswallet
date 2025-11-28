import { createLazyFileRoute } from '@tanstack/react-router';
import { ArrowLeft, FileText, Filter, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { InvoiceList } from '@/components/billing/InvoiceList';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvoices } from '@/hooks/billing';

export const Route = createLazyFileRoute('/billing/invoices')({
	component: InvoicesPage,
});

function InvoicesPage() {
	const { data, isLoading, error } = useInvoices({ limit: 20 });

	if (error) {
		return (
			<div className="container mx-auto py-16 px-4">
				<div className="max-w-4xl mx-auto">
					<Card>
						<CardHeader>
							<CardTitle className="text-red-600">
								Erro ao Carregar Faturas
							</CardTitle>
							<CardDescription>
								Não foi possível carregar suas faturas. Tente novamente mais
								tarde.
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
				<title>Faturas | AegisWallet</title>
				<meta
					name="description"
					content="Visualize e baixe suas faturas e notas fiscais."
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
									<h1 className="text-3xl font-bold tracking-tight">Faturas</h1>
									<p className="text-muted-foreground">
										Visualize e baixe suas faturas e notas fiscais
									</p>
								</div>
							</div>

							<Button variant="outline" size="sm">
								<FileText className="h-4 w-4 mr-2" />
								Baixar Todas
							</Button>
						</div>

						{/* Search and Filters */}
						<div className="flex flex-col sm:flex-row gap-4">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input placeholder="Buscar faturas..." className="pl-10" />
							</div>

							<Button variant="outline" size="sm">
								<Filter className="h-4 w-4 mr-2" />
								Status
							</Button>
						</div>
					</div>

					{/* Main Content */}
					<Card>
						<CardHeader>
							<CardTitle>Suas Faturas</CardTitle>
							<CardDescription>
								{data?.total ?? 0} faturas encontradas
							</CardDescription>
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
								<InvoiceList invoices={data?.invoices ?? []} />
							)}
						</CardContent>
					</Card>

					{/* Tax Information */}
					<Card className="mt-6 border-green-200 bg-green-50/50">
						<CardHeader>
							<CardTitle className="text-green-800 text-lg">
								📄 Informações Fiscais
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-green-700">
								Todas as faturas emitidas estão em conformidade com a legislação
								fiscal brasileira e podem ser usadas para fins de declaração de
								impostos.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
