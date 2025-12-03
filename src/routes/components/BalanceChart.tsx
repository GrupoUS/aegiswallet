import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBalanceHistory, useBankAccounts } from '@/hooks/useBankAccounts';
import { isValidChartItem } from '@/lib/utils/type-guards';
import { safeParseDate } from '@/lib/utils/date-validation';
import type { ChartData } from '@/types/financial/chart.types';

export function BalanceChart() {
	const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
	const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

	const { accounts } = useBankAccounts();

	const days = useMemo(() => {
		if (period === 'week') {
			return 7;
		}
		if (period === 'month') {
			return 30;
		}
		if (period === 'quarter') {
			return 90;
		}
		return 30;
	}, [period]);

	// Determine which account ID to use. If 'all', we might pick the primary one or handle aggregation.
	// Since useBalanceHistory requires an accountId, we'll default to the primary account if 'all' is selected,
	// or the first available account. Aggregating history for all accounts is complex without a backend endpoint.
	// We'll show "Conta Principal" when 'all' is selected for now, or handle it if backend supported it.
	// The plan says "Receber accountId como prop ou usar conta primária por padrão".

	const primaryAccount = accounts.find((a) => a.is_primary) || accounts[0];
	const targetAccountId = selectedAccountId === 'all' ? primaryAccount?.id : selectedAccountId;

	const { history, isLoading } = useBalanceHistory(targetAccountId || '', days);

	const data = useMemo((): ChartData[] => {
		if (isLoading || !history) {
			return [];
		}

		// History is expected to be [{ date: string, balance: number }, ...]
		// We need to format it for the chart
		const chartItems = history
			.filter((item: unknown): item is { date: string | Date; balance: number } => {
				return isValidChartItem(item);
			})
			.map((item) => {
				const dateValue = safeParseDate(item.date);
				if (!dateValue) {
					// Skip invalid dates
					return null;
				}
				return {
					value: Number(item.balance),
					name: format(dateValue, 'dd/MM'),
					dataKey: 'balance',
					metadata: {
						fullDate: format(dateValue, "dd 'de' MMMM", { locale: ptBR }),
						timestamp: dateValue.getTime(),
						type: 'balance',
					},
				};
			})
			.filter((item): item is NonNullable<typeof item> => item !== null);

		// Return as ChartData array
		return [
			{
				payload: chartItems,
				label: 'Histórico de Saldo',
			},
		];
	}, [history, isLoading]);

	if (isLoading && accounts.length > 0) {
		return <Card className="col-span-4 h-[400px] animate-pulse bg-muted" />;
	}

	if (accounts.length === 0) {
		return (
			<Card className="col-span-4">
				<CardHeader>
					<CardTitle className="text-base font-normal">Evolução do Saldo</CardTitle>
				</CardHeader>
				<CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
					Nenhuma conta conectada
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="col-span-4">
			<CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
				<div className="flex items-center gap-4">
					<CardTitle className="text-base font-normal">Evolução do Saldo</CardTitle>
					<Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
						<SelectTrigger className="w-[180px] h-8">
							<SelectValue placeholder="Selecione a conta" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Principal</SelectItem>
							{accounts.map((acc) => (
								<SelectItem key={acc.id} value={acc.id}>
									{acc.institution_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Tabs
					value={period}
					onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'quarter')}
					className="space-y-0"
				>
					<TabsList>
						<TabsTrigger value="week">7 dias</TabsTrigger>
						<TabsTrigger value="month">30 dias</TabsTrigger>
						<TabsTrigger value="quarter">90 dias</TabsTrigger>
					</TabsList>
				</Tabs>
			</CardHeader>
			<CardContent className="pl-2">
				<div className="h-[300px] w-full mt-4">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data}>
							<XAxis
								dataKey="date"
								stroke="#888888"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="#888888"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => `R$ ${value}`}
							/>
							<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
							<Tooltip
								content={({ active, payload }) => {
									if (active && payload && payload.length) {
										const firstItem = payload[0];
										const chartPayload = firstItem.payload as { fullDate?: string }[];

										return (
											<div className="rounded-lg border bg-background p-2 shadow-sm">
												<div className="flex flex-col">
													<span className="text-[0.70rem] uppercase text-muted-foreground">
														Saldo
													</span>
													<span className="font-bold text-primary">
														R${' '}
														{typeof firstItem.value === 'number'
															? firstItem.value.toLocaleString('pt-BR')
															: '0'}
													</span>
												</div>
												{chartPayload?.[0]?.fullDate && (
													<div className="mt-2 text-xs text-muted-foreground border-t pt-2">
														{chartPayload[0].fullDate}
													</div>
												)}
											</div>
										);
									}
									return null;
								}}
							/>
							<Line
								type="monotone"
								dataKey="balance"
								stroke="#2563eb"
								strokeWidth={2}
								dot={false}
								activeDot={{ r: 4 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
