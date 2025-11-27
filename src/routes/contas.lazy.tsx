import { FileText, Mic } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';

import { EditTransactionDialog } from '@/components/financial/EditTransactionDialog';
import { FinancialEventForm } from '@/components/financial/FinancialEventForm';
import { FinancialAmount } from '@/components/financial-amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialEvents } from '@/hooks/useFinancialEvents';
import type { FinancialEvent } from '@/types/financial-events';

// Lazy loading do componente BillsList
const BillsList = lazy(() =>
	import('./components/BillsList').then((module) => ({
		default: module.BillsList,
	})),
);

// Componente de loading para a lista de contas
function BillsListLoader() {
	return (
		<div className="space-y-4">
			{Array.from({ length: 6 }, (_, index) => `bill-skeleton-${index}`).map(
				(skeletonId) => (
					<Card key={skeletonId} className="transition-shadow hover:shadow-lg">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="flex flex-1 items-center gap-4">
									<Skeleton className="h-12 w-12 rounded-full" />
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<Skeleton className="h-6 w-48" />
											<Skeleton className="h-4 w-20" />
										</div>
										<div className="mt-1 flex items-center gap-4">
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-4 w-24" />
										</div>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<div className="text-right">
										<Skeleton className="mb-2 h-8 w-24" />
										<Skeleton className="h-5 w-16" />
									</div>
									<Skeleton className="h-10 w-16" />
								</div>
							</div>
						</CardContent>
					</Card>
				),
			)}
		</div>
	);
}

export function Contas() {
	const [isListening, setIsListening] = useState(false);
	const [editingBill, setEditingBill] = useState<FinancialEvent | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const {
		events: bills,
		loading,
		setFilters,
		filters,
		statistics,
		deleteEvent,
		refresh,
	} = useFinancialEvents(
		{
			type: 'expense', // Busca apenas despesas (inclui contas)
			status: 'all',
		},
		{
			page: 1,
			limit: 100, // Limite aumentado para listar a maioria das contas
			sortBy: 'due_date',
			sortOrder: 'asc',
		},
	);

	const handleVoiceCommand = () => {
		setIsListening(!isListening);
	};

	const handleEdit = (bill: FinancialEvent) => {
		setEditingBill(bill);
		setIsEditModalOpen(true);
	};

	// Calcular contagens baseadas nos eventos carregados
	// Nota: statistics do hook é baseado na página atual, então calculamos manualmente para a lista carregada
	const pendingBillsCount = bills.filter((b) => b.status === 'pending').length;
	const paidBillsCount = bills.filter(
		(b) => b.status === 'paid' || b.status === 'completed',
	).length;

	// Usar estatísticas do hook para valores monetários (considerando que o limit 100 cobre o mês atual/relevante)
	const totalPending = statistics.pendingExpenses;
	const totalPaid = statistics.totalExpenses;

	const currentFilter = filters.status || 'all';

	return (
		<div className="container mx-auto space-y-6 p-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text font-bold text-3xl text-transparent">
						Contas
					</h1>
					<p className="text-muted-foreground">
						Gerencie suas contas e pagamentos
					</p>
				</div>
				<Button
					onClick={handleVoiceCommand}
					variant={isListening ? 'default' : 'outline'}
					size="lg"
					className="gap-2"
					withGradient
				>
					<Mic className={isListening ? 'animate-pulse' : ''} />
					{isListening ? 'Ouvindo...' : 'Quais contas pagar?'}
				</Button>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card className="border-2 border-warning/20">
					<CardHeader className="pb-2">
						<CardDescription>Contas Pendentes</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							{loading ? (
								<Skeleton className="h-8 w-32" />
							) : (
								<FinancialAmount amount={-totalPending} size="lg" />
							)}
							<Badge variant="outline" className="border-warning text-warning">
								{loading ? <Skeleton className="h-4 w-8" /> : pendingBillsCount}{' '}
								contas
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card className="border-2 border-success/20">
					<CardHeader className="pb-2">
						<CardDescription>Contas Pagas</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							{loading ? (
								<Skeleton className="h-8 w-32" />
							) : (
								<FinancialAmount amount={-totalPaid} size="lg" />
							)}
							<Badge variant="outline" className="border-success text-success">
								{loading ? <Skeleton className="h-4 w-8" /> : paidBillsCount}{' '}
								contas
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card className="border-2 border-primary/20">
					<CardHeader className="pb-2">
						<CardDescription>Total do Mês</CardDescription>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-8 w-32" />
						) : (
							<FinancialAmount amount={-(totalPending + totalPaid)} size="lg" />
						)}
					</CardContent>
				</Card>
			</div>

			{/* Filter Buttons */}
			<div className="flex gap-2">
				<Button
					variant={currentFilter === 'all' ? 'default' : 'outline'}
					onClick={() => setFilters({ status: 'all' })}
				>
					Todas
				</Button>
				<Button
					variant={currentFilter === 'pending' ? 'default' : 'outline'}
					onClick={() => setFilters({ status: 'pending' })}
				>
					Pendentes
				</Button>
				<Button
					variant={currentFilter === 'paid' ? 'default' : 'outline'}
					onClick={() => setFilters({ status: 'completed' })}
				>
					Pagas
				</Button>
			</div>

			{/* Bills List */}
			<Suspense fallback={<BillsListLoader />}>
				{loading ? (
					<BillsListLoader />
				) : (
					<BillsList bills={bills} onEdit={handleEdit} onDelete={deleteEvent} />
				)}
			</Suspense>

			<EditTransactionDialog
				open={isEditModalOpen}
				onOpenChange={setIsEditModalOpen}
				transaction={editingBill}
			/>

			{/* Create Bill Modal */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>Nova Conta a Pagar</DialogTitle>
						<DialogDescription>
							Adicione uma nova conta ou despesa.
						</DialogDescription>
					</DialogHeader>
					<FinancialEventForm
						onSuccess={() => {
							setIsCreateModalOpen(false);
							refresh();
						}}
						onCancel={() => setIsCreateModalOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			{/* Actions */}
			<div className="flex gap-4">
				<Button
					size="lg"
					className="flex-1"
					withGradient
					onClick={() => setIsCreateModalOpen(true)}
				>
					<FileText className="mr-2 h-5 w-5" />
					Adicionar Nova Conta
				</Button>
				{/* TODO: Implementar Gerenciar Recorrentes */}
				<Button variant="outline" size="lg" className="flex-1">
					Gerenciar Recorrentes
				</Button>
			</div>
		</div>
	);
}
