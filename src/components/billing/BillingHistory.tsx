import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { PaymentHistory } from '@/types/billing';

interface BillingHistoryProps {
	payments: PaymentHistory[];
}

const statusConfig = {
	succeeded: {
		label: 'Pago',
		variant: 'default' as const,
		icon: CheckCircle,
		color: 'text-green-600',
	},
	failed: {
		label: 'Falhou',
		variant: 'destructive' as const,
		icon: XCircle,
		color: 'text-red-600',
	},
	pending: {
		label: 'Pendente',
		variant: 'secondary' as const,
		icon: Clock,
		color: 'text-yellow-600',
	},
};

export function BillingHistory({ payments }: BillingHistoryProps) {
	if (payments.length === 0) {
		return (
			<div className="text-center py-12">
				<Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium mb-2">
					Nenhuma transação encontrada
				</h3>
				<p className="text-muted-foreground">
					Você ainda não realizou nenhuma transação. Comece usando nossos
					serviços para ver seu histórico aqui.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{payments.map((payment) => {
				const status = statusConfig[payment.status];
				const StatusIcon = status.icon;

				return (
					<Card key={payment.id} className="hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<div className="flex-shrink-0">
										<StatusIcon className={`h-8 w-8 ${status.color}`} />
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center space-x-2 mb-1">
											<Badge variant={status.variant}>{status.label}</Badge>
											<span className="text-sm text-muted-foreground">
												{payment.createdAt
													? new Date(payment.createdAt).toLocaleDateString(
															'pt-BR',
															{
																day: 'numeric',
																month: 'long',
																year: 'numeric',
																hour: '2-digit',
																minute: '2-digit',
															},
														)
													: 'Data não disponível'}
											</span>
										</div>

										<p className="text-sm font-medium text-gray-900 truncate">
											{payment.description || 'Pagamento'}
										</p>

										{payment.failureMessage && (
											<p className="text-sm text-red-600 mt-1">
												{payment.failureMessage}
											</p>
										)}
									</div>
								</div>

								<div className="flex items-center space-x-4">
									<div className="text-right">
										<p className="text-lg font-semibold">
											{formatCurrency(payment.amountCents / 100)}
										</p>
										<p className="text-sm text-muted-foreground">
											{payment.currency}
										</p>
									</div>

									<div className="flex space-x-2">
										{payment.receiptUrl && (
											<Button variant="outline" size="sm" asChild>
												<a
													href={payment.receiptUrl}
													target="_blank"
													rel="noopener noreferrer"
												>
													Recibo
												</a>
											</Button>
										)}

										{payment.invoicePdf && (
											<Button variant="outline" size="sm" asChild>
												<a
													href={payment.invoicePdf}
													target="_blank"
													rel="noopener noreferrer"
												>
													PDF
												</a>
											</Button>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
