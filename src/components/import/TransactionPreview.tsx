/**
 * @file TransactionPreview.tsx
 * @description Table component for previewing extracted transactions with selection
 * @module import/TransactionPreview
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	CheckSquare,
	Search,
	Square,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface PreviewTransaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	type: 'CREDIT' | 'DEBIT';
	category?: string;
	balance?: number;
	isDuplicate?: boolean;
	duplicateOf?: string;
	confidence?: number;
}

interface TransactionPreviewProps {
	transactions: PreviewTransaction[];
	selectedIds: Set<string>;
	onSelectionChange: (selectedIds: Set<string>) => void;
	loading?: boolean;
}

type SortField = 'date' | 'description' | 'amount' | 'type';
type SortOrder = 'asc' | 'desc';

// ============================================================================
// Component
// ============================================================================

export function TransactionPreview({
	transactions,
	selectedIds,
	onSelectionChange,
	loading = false,
}: TransactionPreviewProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [sortField, setSortField] = useState<SortField>('date');
	const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
	const [typeFilter, setTypeFilter] = useState<'all' | 'CREDIT' | 'DEBIT'>('all');
	const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

	// Filter and sort transactions
	const filteredTransactions = useMemo(() => {
		let result = [...transactions];

		// Apply search filter
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(t) =>
					t.description.toLowerCase().includes(term) || t.category?.toLowerCase().includes(term),
			);
		}

		// Apply type filter
		if (typeFilter !== 'all') {
			result = result.filter((t) => t.type === typeFilter);
		}

		// Apply duplicates filter
		if (showDuplicatesOnly) {
			result = result.filter((t) => t.isDuplicate);
		}

		// Apply sorting
		result.sort((a, b) => {
			let comparison = 0;

			switch (sortField) {
				case 'date':
					comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
					break;
				case 'description':
					comparison = a.description.localeCompare(b.description, 'pt-BR');
					break;
				case 'amount':
					comparison = Math.abs(a.amount) - Math.abs(b.amount);
					break;
				case 'type':
					comparison = a.type.localeCompare(b.type);
					break;
			}

			return sortOrder === 'asc' ? comparison : -comparison;
		});

		return result;
	}, [transactions, searchTerm, sortField, sortOrder, typeFilter, showDuplicatesOnly]);

	// Handle sort toggle
	const toggleSort = useCallback(
		(field: SortField) => {
			if (sortField === field) {
				setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
			} else {
				setSortField(field);
				setSortOrder('desc');
			}
		},
		[sortField],
	);

	// Handle select all
	const handleSelectAll = useCallback(() => {
		const allFilteredIds = new Set(filteredTransactions.map((t) => t.id));
		const allSelected = filteredTransactions.every((t) => selectedIds.has(t.id));

		if (allSelected) {
			// Deselect all filtered
			const newSelection = new Set(selectedIds);
			for (const id of allFilteredIds) {
				newSelection.delete(id);
			}
			onSelectionChange(newSelection);
		} else {
			// Select all filtered (except duplicates by default)
			const newSelection = new Set(selectedIds);
			for (const t of filteredTransactions) {
				if (!t.isDuplicate) {
					newSelection.add(t.id);
				}
			}
			onSelectionChange(newSelection);
		}
	}, [filteredTransactions, selectedIds, onSelectionChange]);

	// Handle individual selection
	const handleToggleSelection = useCallback(
		(id: string) => {
			const newSelection = new Set(selectedIds);
			if (newSelection.has(id)) {
				newSelection.delete(id);
			} else {
				newSelection.add(id);
			}
			onSelectionChange(newSelection);
		},
		[selectedIds, onSelectionChange],
	);

	// Get sort icon
	const getSortIcon = (field: SortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className="ml-1 h-4 w-4" />;
		}
		return sortOrder === 'asc' ? (
			<ArrowUp className="ml-1 h-4 w-4" />
		) : (
			<ArrowDown className="ml-1 h-4 w-4" />
		);
	};

	// Calculate statistics
	const stats = useMemo(() => {
		const filtered = filteredTransactions;
		const selected = filtered.filter((t) => selectedIds.has(t.id));
		const duplicates = filtered.filter((t) => t.isDuplicate);

		return {
			total: filtered.length,
			selected: selected.length,
			duplicates: duplicates.length,
			totalCredits: filtered
				.filter((t) => t.type === 'CREDIT')
				.reduce((sum, t) => sum + t.amount, 0),
			totalDebits: filtered
				.filter((t) => t.type === 'DEBIT')
				.reduce((sum, t) => sum + Math.abs(t.amount), 0),
			selectedCredits: selected
				.filter((t) => t.type === 'CREDIT')
				.reduce((sum, t) => sum + t.amount, 0),
			selectedDebits: selected
				.filter((t) => t.type === 'DEBIT')
				.reduce((sum, t) => sum + Math.abs(t.amount), 0),
		};
	}, [filteredTransactions, selectedIds]);

	// Check if all filtered are selected
	const allSelected =
		filteredTransactions.length > 0 && filteredTransactions.every((t) => selectedIds.has(t.id));

	const someSelected = filteredTransactions.some((t) => selectedIds.has(t.id)) && !allSelected;

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Filters and Search */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar transações..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>

				<Select
					value={typeFilter}
					onValueChange={(value: 'all' | 'CREDIT' | 'DEBIT') => setTypeFilter(value)}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os tipos</SelectItem>
						<SelectItem value="CREDIT">Créditos</SelectItem>
						<SelectItem value="DEBIT">Débitos</SelectItem>
					</SelectContent>
				</Select>

				<Button
					variant={showDuplicatesOnly ? 'default' : 'outline'}
					size="sm"
					onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
					className="gap-2"
				>
					<AlertTriangle className="h-4 w-4" />
					Duplicadas ({stats.duplicates})
				</Button>
			</div>

			{/* Selection Stats */}
			<div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
				<div className="flex items-center gap-4">
					<span>
						{stats.selected} de {stats.total} selecionadas
					</span>
					{stats.duplicates > 0 && (
						<Badge variant="outline" className="text-yellow-600 border-yellow-600">
							{stats.duplicates} possíveis duplicadas
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-4">
					<span className="text-green-600">+{formatCurrency(stats.selectedCredits)}</span>
					<span className="text-red-600">-{formatCurrency(stats.selectedDebits)}</span>
				</div>
			</div>

			{/* Transaction Table */}
			<div className="border rounded-lg overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px]">
								<Button variant="ghost" size="sm" onClick={handleSelectAll} className="p-0 h-auto">
									{allSelected ? (
										<CheckSquare className="h-5 w-5" />
									) : someSelected ? (
										<div className="h-5 w-5 border-2 rounded bg-primary/50" />
									) : (
										<Square className="h-5 w-5" />
									)}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => toggleSort('date')}
									className="p-0 h-auto font-medium"
								>
									Data
									{getSortIcon('date')}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => toggleSort('description')}
									className="p-0 h-auto font-medium"
								>
									Descrição
									{getSortIcon('description')}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => toggleSort('type')}
									className="p-0 h-auto font-medium"
								>
									Tipo
									{getSortIcon('type')}
								</Button>
							</TableHead>
							<TableHead className="text-right">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => toggleSort('amount')}
									className="p-0 h-auto font-medium"
								>
									Valor
									{getSortIcon('amount')}
								</Button>
							</TableHead>
							<TableHead>Categoria</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredTransactions.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
									Nenhuma transação encontrada
								</TableCell>
							</TableRow>
						) : (
							// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Table row requires multiple conditional renders
							filteredTransactions.map((transaction) => (
								<TableRow
									key={transaction.id}
									className={cn(
										transaction.isDuplicate && 'bg-yellow-50 dark:bg-yellow-950/20',
										selectedIds.has(transaction.id) && 'bg-primary/5',
									)}
								>
									<TableCell>
										<Checkbox
											checked={selectedIds.has(transaction.id)}
											onCheckedChange={() => handleToggleSelection(transaction.id)}
										/>
									</TableCell>
									<TableCell className="font-medium whitespace-nowrap">
										{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
									</TableCell>
									<TableCell className="max-w-[300px]">
										<div className="flex items-center gap-2">
											<span className="truncate">{transaction.description}</span>
											{transaction.isDuplicate && (
												<Badge variant="outline" className="text-yellow-600 shrink-0">
													<AlertTriangle className="h-3 w-3 mr-1" />
													Duplicada
												</Badge>
											)}
										</div>
										{transaction.confidence !== undefined && transaction.confidence < 0.8 && (
											<span className="text-xs text-muted-foreground">
												Confiança: {Math.round(transaction.confidence * 100)}%
											</span>
										)}
									</TableCell>
									<TableCell>
										<Badge
											variant={transaction.type === 'CREDIT' ? 'default' : 'secondary'}
											className={cn(
												transaction.type === 'CREDIT'
													? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
													: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
											)}
										>
											{transaction.type === 'CREDIT' ? 'Crédito' : 'Débito'}
										</Badge>
									</TableCell>
									<TableCell
										className={cn(
											'text-right font-medium whitespace-nowrap',
											transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600',
										)}
									>
										{transaction.type === 'CREDIT' ? '+' : '-'}
										{formatCurrency(Math.abs(transaction.amount))}
									</TableCell>
									<TableCell>
										{transaction.category ? (
											<Badge variant="outline">{transaction.category}</Badge>
										) : (
											<span className="text-muted-foreground text-sm">Sem categoria</span>
										)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination info */}
			<div className="text-sm text-muted-foreground text-center">
				Mostrando {filteredTransactions.length} de {transactions.length} transações
			</div>
		</div>
	);
}

export default TransactionPreview;
