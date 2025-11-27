import {
	AlertCircle,
	ArrowUpRight,
	CheckCircle,
	CreditCard,
	Info,
	TrendingUp,
} from 'lucide-react';
import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
	BalanceResponseData,
	BillsResponseData,
	BudgetResponseData,
	ErrorResponseData,
	IncomingResponseData,
	ProjectionResponseData,
	SuccessResponseData,
	TransferResponseData,
	TypedVoiceResponseProps,
	VoiceResponseType,
} from '@/types/voice/responseTypes';
import {
	isBalanceResponse,
	isBillsResponse,
	isBudgetResponse,
	isErrorResponse,
	isIncomingResponse,
	isProjectionResponse,
	isSuccessResponse,
	isTransferResponse,
} from '@/types/voice/responseTypes';

const currencyFormatter = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 2,
	minimumFractionDigits: 2,
});

const formatCurrency = (value: number): string =>
	`R$ ${currencyFormatter.format(value)}`;

// ============================================================================
// Typed Data Renderer Components
// ============================================================================

const BalanceData: React.FC<{ data: BalanceResponseData }> = ({ data }) => (
	<div className="mt-2 space-y-1">
		<p className="font-medium text-sm">
			Saldo: {formatCurrency(data.currentBalance)}
		</p>
		{data.income !== undefined && (
			<p className="text-muted-foreground text-xs">
				Receitas: {formatCurrency(data.income)}
			</p>
		)}
		{data.expenses !== undefined && (
			<p className="text-muted-foreground text-xs">
				Despesas: {formatCurrency(data.expenses)}
			</p>
		)}
		{data.accountType && (
			<p className="text-muted-foreground text-xs">Conta: {data.accountType}</p>
		)}
	</div>
);

const BudgetData: React.FC<{ data: BudgetResponseData }> = ({ data }) => (
	<div className="mt-2 space-y-1">
		<p className="font-medium text-sm">
			Disponível: {formatCurrency(data.available)}
		</p>
		<p className="text-muted-foreground text-xs">
			Gasto: {formatCurrency(data.spent)} / {formatCurrency(data.total)}
		</p>
		<p className="text-muted-foreground text-xs">
			Utilizado: {data.spentPercentage.toFixed(1)}%
		</p>
		{data.category && (
			<p className="text-muted-foreground text-xs">
				Categoria: {data.category}
			</p>
		)}
	</div>
);

const BillsData: React.FC<{ data: BillsResponseData }> = ({ data }) => (
	<div className="mt-2 space-y-1">
		<p className="font-medium text-sm">
			{data.bills.length} {data.bills.length === 1 ? 'conta' : 'contas'} para
			pagar
		</p>
		<p className="text-muted-foreground text-xs">
			Total: {formatCurrency(data.totalAmount)}
		</p>
		{data.pastDueCount > 0 && (
			<p className="text-destructive text-xs">
				{data.pastDueCount} {data.pastDueCount === 1 ? 'vencida' : 'vencidas'}
			</p>
		)}
		{data.bills.slice(0, 3).map((bill, index) => (
			<p
				key={`bill-${bill.name}-${index}`}
				className="text-muted-foreground text-xs"
			>
				{bill.name}: {formatCurrency(bill.amount)}
			</p>
		))}
	</div>
);

const IncomingData: React.FC<{ data: IncomingResponseData }> = ({ data }) => (
	<div className="mt-2 space-y-1">
		<p className="font-medium text-sm">
			Recebimentos: {formatCurrency(data.totalExpected)}
		</p>
		{data.nextIncome && (
			<p className="text-muted-foreground text-xs">
				Próximo: {data.nextIncome.source} -{' '}
				{formatCurrency(data.nextIncome.amount)}
			</p>
		)}
		{data.incoming.slice(0, 3).map((income, index) => (
			<p
				key={`income-${income.source}-${index}`}
				className="text-muted-foreground text-xs"
			>
				{income.source}: {formatCurrency(income.amount)}
			</p>
		))}
	</div>
);

const ProjectionData: React.FC<{ data: ProjectionResponseData }> = ({
	data,
}) => {
	const variationSign = data.variation >= 0 ? '+' : '-';
	const variationValue = formatCurrency(Math.abs(data.variation));

	return (
		<div className="mt-2 space-y-1">
			<p className="font-medium text-sm">
				Projeção ({data.period}): {formatCurrency(data.projectedBalance)}
			</p>
			<p className="text-muted-foreground text-xs">
				Saldo atual: {formatCurrency(data.currentBalance)}
			</p>
			<p
				className={cn(
					'text-xs',
					data.variation >= 0 ? 'text-success' : 'text-destructive',
				)}
			>
				Variação: {variationSign}
				{variationValue}
			</p>
			{data.confidence && (
				<p className="text-muted-foreground text-xs">
					Confiança: {(data.confidence * 100).toFixed(0)}%
				</p>
			)}
		</div>
	);
};

const TransferData: React.FC<{ data: TransferResponseData }> = ({ data }) => (
	<div className="mt-2 space-y-1">
		<p className="font-medium text-sm">Para: {data.recipient}</p>
		<p className="text-muted-foreground text-xs">
			Valor: {formatCurrency(data.amount)}
		</p>
		<p className="text-muted-foreground text-xs">Método: {data.method}</p>
		<p
			className={cn(
				'font-medium text-xs',
				data.status === 'pending'
					? 'text-warning'
					: data.status === 'processing'
						? 'text-info'
						: data.status === 'completed'
							? 'text-success'
							: 'text-destructive',
			)}
		>
			Status:{' '}
			{
				{
					completed: 'Concluído',
					failed: 'Falhou',
					pending: 'Pendente',
					processing: 'Processando',
				}[data.status]
			}
		</p>
		{data.estimatedTime && (
			<p className="text-muted-foreground text-xs">
				Tempo estimado: {data.estimatedTime}
			</p>
		)}
		{data.fees && data.fees > 0 && (
			<p className="text-muted-foreground text-xs">
				Taxas: {formatCurrency(data.fees)}
			</p>
		)}
	</div>
);

const SuccessData: React.FC<{ data: SuccessResponseData }> = ({ data }) => (
	<div className="mt-2 space-y-1">
		<p className="text-sm text-success">{data.message}</p>
		{data.action && (
			<p className="text-muted-foreground text-xs">Ação: {data.action}</p>
		)}
		{data.details && (
			<p className="text-muted-foreground text-xs">{data.details}</p>
		)}
	</div>
);

const ErrorData: React.FC<{ data: ErrorResponseData }> = ({ data }) => (
	<div className="mt-2 space-y-1">
		<p className="text-destructive text-sm">{data.message}</p>
		{data.code && (
			<p className="text-muted-foreground text-xs">Código: {data.code}</p>
		)}
		{data.details && (
			<p className="text-muted-foreground text-xs">{data.details}</p>
		)}
		{data.recoverable && (
			<p className="text-warning text-xs">Este erro pode ser recuperado</p>
		)}
		{data.suggestedActions && data.suggestedActions.length > 0 && (
			<div className="mt-1">
				<p className="font-medium text-muted-foreground text-xs">Sugestões:</p>
				{data.suggestedActions.map((action, index) => (
					<p
						key={`suggestion-${action.replace(/\s+/g, '-')}-${index}`}
						className="ml-2 text-muted-foreground text-xs"
					>
						• {action}
					</p>
				))}
			</div>
		)}
	</div>
);

// ============================================================================
// Main VoiceResponse Component
// ============================================================================

export const VoiceResponse = React.memo(function VoiceResponse({
	type,
	message,
	data,
	className,
	timestamp,
	accessibility,
}: TypedVoiceResponseProps) {
	// Memoize icon to prevent recalculation
	const icon = React.useMemo(() => {
		switch (type) {
			case 'success':
				return <CheckCircle className="h-6 w-6 text-success" />;
			case 'error':
				return <AlertCircle className="h-6 w-6 text-destructive" />;
			case 'balance':
				return <TrendingUp className="h-6 w-6 text-info" />;
			case 'budget':
				return <Info className="h-6 w-6 text-warning" />;
			case 'bills':
				return <CreditCard className="h-6 w-6 text-destructive" />;
			case 'incoming':
				return <ArrowUpRight className="h-6 w-6 text-success" />;
			case 'projection':
				return <TrendingUp className="h-6 w-6 text-accent" />;
			case 'transfer':
				return <ArrowUpRight className="h-6 w-6 text-info" />;
			default: {
				// Type safety: This ensures all cases are covered
				return <Info className="h-6 w-6 text-info" />;
			}
		}
	}, [type]);

	// Memoize card color to prevent recalculation
	const cardColor = React.useMemo(() => {
		switch (type) {
			case 'success':
				return 'border-success/20 bg-success/10';
			case 'error':
				return 'border-destructive/20 bg-destructive/10';
			case 'balance':
				return 'border-info/20 bg-info/10';
			case 'budget':
				return 'border-warning/20 bg-warning/10';
			case 'bills':
				return 'border-destructive/20 bg-destructive/10';
			case 'incoming':
				return 'border-success/20 bg-success/10';
			case 'projection':
				return 'border-accent bg-accent/10';
			case 'transfer':
				return 'border-info/20 bg-info/10';
			default: {
				// Type safety: This ensures all cases are covered
				return 'border-gray-200 bg-gray-50';
			}
		}
	}, [type]);

	// Type-safe data rendering with validation
	const renderData = React.useMemo(() => {
		if (!data) {
			return null;
		}

		// Use type guards for safe rendering
		if (type === 'balance' && isBalanceResponse(data)) {
			return <BalanceData data={data} />;
		}
		if (type === 'budget' && isBudgetResponse(data)) {
			return <BudgetData data={data} />;
		}
		if (type === 'bills' && isBillsResponse(data)) {
			return <BillsData data={data} />;
		}
		if (type === 'incoming' && isIncomingResponse(data)) {
			return <IncomingData data={data} />;
		}
		if (type === 'projection' && isProjectionResponse(data)) {
			return <ProjectionData data={data} />;
		}
		if (type === 'transfer' && isTransferResponse(data)) {
			return <TransferData data={data} />;
		}
		if (type === 'success' && isSuccessResponse(data)) {
			return <SuccessData data={data} />;
		}
		if (type === 'error' && isErrorResponse(data)) {
			return <ErrorData data={data} />;
		}
		return null;
	}, [type, data]);

	// Generate accessibility properties
	const accessibilityProps = React.useMemo(() => {
		const props: Record<string, string | boolean | undefined> = {};

		if (accessibility) {
			if (accessibility['aria-live']) {
				props['aria-live'] = accessibility['aria-live'];
			}
			if (accessibility['aria-atomic']) {
				props['aria-atomic'] = accessibility['aria-atomic'];
			}
			if (accessibility.role) {
				props.role = accessibility.role;
			}
		}

		// Default accessibility based on type
		if (!props.role) {
			switch (type) {
				case 'error':
				case 'success':
					props.role = 'alert';
					break;
				case 'transfer':
					props.role = 'status';
					break;
				default:
					props.role = 'status';
			}
		}

		if (!props['aria-live']) {
			props['aria-live'] = type === 'error' ? 'assertive' : 'polite';
		}

		return props;
	}, [accessibility, type]);

	return (
		<Card
			variant="glass"
			className={cn(
				'border-2 transition-all duration-300',
				cardColor,
				className,
			)}
			{...accessibilityProps}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					{icon}
					<div className="flex-1">
						<p className="font-medium text-gray-800 text-sm">{message}</p>
						{renderData}
						{timestamp && (
							<p className="mt-2 text-muted-foreground text-xs">
								{new Date(timestamp).toLocaleString('pt-BR')}
							</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
});

VoiceResponse.displayName = 'VoiceResponse';

// ============================================================================
// Component Type Exports
// ============================================================================

export type {
	TypedVoiceResponseProps,
	VoiceResponseType,
	BalanceResponseData,
	BudgetResponseData,
	BillsResponseData,
	IncomingResponseData,
	ProjectionResponseData,
	TransferResponseData,
	SuccessResponseData,
	ErrorResponseData,
};
