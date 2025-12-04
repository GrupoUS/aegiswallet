/**
 * @file ImportSummary.tsx
 * @description Summary card component displaying import extraction results
 * @module import/ImportSummary
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	AlertTriangle,
	ArrowDownCircle,
	ArrowUpCircle,
	Building2,
	Calendar,
	CheckCircle2,
	FileText,
	Sparkles,
	XCircle,
} from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn, formatCurrency } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ImportSummaryData {
	sessionId: string;
	fileName: string;
	fileType: 'PDF' | 'CSV' | 'OFX';
	bankName?: string;
	totalTransactions: number;
	selectedTransactions: number;
	duplicateTransactions: number;
	dateRange?: {
		start: string;
		end: string;
	};
	totals: {
		credits: number;
		debits: number;
		balance: number;
	};
	selectedTotals: {
		credits: number;
		debits: number;
		balance: number;
	};
	processingTime?: number;
	confidence?: number;
	status: 'PENDING' | 'PROCESSING' | 'READY' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
	errorMessage?: string;
}

interface ImportSummaryProps {
	data: ImportSummaryData;
	className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({
	icon: Icon,
	label,
	value,
	subValue,
	variant = 'default',
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string | number;
	subValue?: string;
	variant?: 'default' | 'success' | 'warning' | 'error';
}) {
	const variantStyles = {
		default: 'text-foreground',
		success: 'text-green-600 dark:text-green-400',
		warning: 'text-yellow-600 dark:text-yellow-400',
		error: 'text-red-600 dark:text-red-400',
	};

	return (
		<div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
			<div className={cn('p-2 rounded-md bg-background', variantStyles[variant])}>
				<Icon className="h-4 w-4" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm text-muted-foreground">{label}</p>
				<p className={cn('text-lg font-semibold', variantStyles[variant])}>{value}</p>
				{subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
			</div>
		</div>
	);
}

// ============================================================================
// Main Component
// ============================================================================

export function ImportSummary({ data, className }: ImportSummaryProps) {
	const {
		fileName,
		fileType,
		bankName,
		totalTransactions,
		selectedTransactions,
		duplicateTransactions,
		dateRange,
		totals,
		selectedTotals,
		processingTime,
		confidence,
		status,
		errorMessage,
	} = data;

	// Calculate selection percentage
	const selectionPercentage = useMemo(() => {
		if (totalTransactions === 0) return 0;
		return Math.round((selectedTransactions / totalTransactions) * 100);
	}, [selectedTransactions, totalTransactions]);

	// Format date range
	const formattedDateRange = useMemo(() => {
		if (!(dateRange?.start && dateRange?.end)) return null;

		const start = format(new Date(dateRange.start), 'dd/MM/yyyy', { locale: ptBR });
		const end = format(new Date(dateRange.end), 'dd/MM/yyyy', { locale: ptBR });

		return `${start} - ${end}`;
	}, [dateRange]);

	// Get status badge
	const statusBadge = useMemo(() => {
		const statusConfig = {
			PENDING: { label: 'Aguardando', variant: 'secondary' as const, icon: FileText },
			PROCESSING: { label: 'Processando', variant: 'default' as const, icon: Sparkles },
			READY: { label: 'Pronto', variant: 'default' as const, icon: CheckCircle2 },
			CONFIRMED: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle2 },
			FAILED: { label: 'Erro', variant: 'destructive' as const, icon: XCircle },
			CANCELLED: { label: 'Cancelado', variant: 'secondary' as const, icon: XCircle },
		};

		const config = statusConfig[status];
		const IconComponent = config.icon;

		return (
			<Badge variant={config.variant} className="gap-1">
				<IconComponent className="h-3 w-3" />
				{config.label}
			</Badge>
		);
	}, [status]);

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardTitle className="text-lg flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Resumo da Importação
						</CardTitle>
						<CardDescription className="flex items-center gap-2">
							<span className="truncate max-w-[200px]">{fileName}</span>
							<Badge variant="outline">{fileType}</Badge>
						</CardDescription>
					</div>
					{statusBadge}
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* Error message */}
				{status === 'FAILED' && errorMessage && (
					<div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
						<XCircle className="h-4 w-4 shrink-0 mt-0.5" />
						<span>{errorMessage}</span>
					</div>
				)}

				{/* Bank and Date Info */}
				<div className="grid grid-cols-2 gap-4">
					{bankName && (
						<StatCard icon={Building2} label="Banco Detectado" value={bankName} variant="default" />
					)}
					{formattedDateRange && (
						<StatCard
							icon={Calendar}
							label="Período"
							value={formattedDateRange}
							variant="default"
						/>
					)}
				</div>

				{/* Transaction counts */}
				<div className="space-y-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Transações selecionadas</span>
						<span className="font-medium">
							{selectedTransactions} de {totalTransactions}
						</span>
					</div>
					<Progress value={selectionPercentage} className="h-2" />
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>{selectionPercentage}% selecionadas</span>
						{duplicateTransactions > 0 && (
							<span className="flex items-center gap-1 text-yellow-600">
								<AlertTriangle className="h-3 w-3" />
								{duplicateTransactions} possíveis duplicadas
							</span>
						)}
					</div>
				</div>

				{/* Financial totals */}
				<div className="grid grid-cols-2 gap-4">
					<StatCard
						icon={ArrowUpCircle}
						label="Total Créditos"
						value={formatCurrency(totals.credits)}
						subValue={`Selecionados: ${formatCurrency(selectedTotals.credits)}`}
						variant="success"
					/>
					<StatCard
						icon={ArrowDownCircle}
						label="Total Débitos"
						value={formatCurrency(totals.debits)}
						subValue={`Selecionados: ${formatCurrency(selectedTotals.debits)}`}
						variant="error"
					/>
				</div>

				{/* Balance */}
				<div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Saldo Selecionado</span>
						<span
							className={cn(
								'text-xl font-bold',
								selectedTotals.balance >= 0 ? 'text-green-600' : 'text-red-600',
							)}
						>
							{selectedTotals.balance >= 0 ? '+' : ''}
							{formatCurrency(selectedTotals.balance)}
						</span>
					</div>
				</div>

				{/* Processing info */}
				{(processingTime || confidence) && (
					<div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
						{processingTime && <span>Processado em {(processingTime / 1000).toFixed(1)}s</span>}
						{confidence !== undefined && (
							<span className="flex items-center gap-1">
								<Sparkles className="h-3 w-3" />
								Confiança IA: {Math.round(confidence * 100)}%
							</span>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default ImportSummary;
