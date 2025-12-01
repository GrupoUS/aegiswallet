import { Download, Eye, FileText, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/types/billing';

interface InvoiceListProps {
	invoices: Invoice[];
}

const statusConfig = {
	draft: {
		label: 'Rascunho',
		variant: 'secondary' as const,
		color: 'text-gray-600',
	},
	open: {
		label: 'Aberta',
		variant: 'default' as const,
		color: 'text-blue-600',
	},
	paid: {
		label: 'Paga',
		variant: 'default' as const,
		color: 'text-green-600',
	},
	void: {
		label: 'Nula',
		variant: 'destructive' as const,
		color: 'text-red-600',
	},
	uncollectible: {
		label: 'Incobrável',
		variant: 'destructive' as const,
		color: 'text-red-600',
	},
};

export function InvoiceList({ invoices }: InvoiceListProps) {
	if (invoices.length === 0) {
		return (
			<div className="text-center py-12">
				<FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium mb-2">Nenhuma fatura encontrada</h3>
				<p className="text-muted-foreground">
					Você ainda não possui faturas. Elas aparecerão aqui quando você tiver transações.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{invoices.map((invoice) => {
				const status = statusConfig[invoice.status as InvoiceStatus];

				return (
					<Card key={invoice.id} className="hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<div className="flex-shrink-0">
										<FileText className="h-8 w-8 text-muted-foreground" />
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center space-x-2 mb-1">
											<span className="text-sm font-medium text-gray-900">
												Fatura #{invoice.number}
											</span>
											<Badge variant={status.variant}>{status.label}</Badge>
										</div>

										<p className="text-sm text-muted-foreground">
											Emitida em{' '}
											{new Date(invoice.createdAt).toLocaleDateString('pt-BR', {
												day: 'numeric',
												month: 'long',
												year: 'numeric',
											})}
										</p>

										{invoice.dueDate && invoice.status === 'open' && (
											<p className="text-sm text-yellow-600 mt-1">
												Vence em{' '}
												{new Date(invoice.dueDate).toLocaleDateString('pt-BR', {
													day: 'numeric',
													month: 'long',
													year: 'numeric',
												})}
											</p>
										)}

										{invoice.paidAt && (
											<p className="text-sm text-green-600 mt-1">
												Paga em{' '}
												{new Date(invoice.paidAt).toLocaleDateString('pt-BR', {
													day: 'numeric',
													month: 'long',
													year: 'numeric',
												})}
											</p>
										)}

										{invoice.description && (
											<p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
										)}

										{/* Invoice Items Preview */}
										{invoice.items && invoice.items.length > 0 && (
											<div className="mt-2">
												<p className="text-xs text-muted-foreground">
													{invoice.items.length} item
													{invoice.items.length > 1 ? 's' : ''}
												</p>
											</div>
										)}
									</div>
								</div>

								<div className="flex items-center space-x-4">
									<div className="text-right">
										<p className="text-lg font-semibold">
											{formatCurrency(invoice.amountDue / 100)}
										</p>
										{invoice.amountPaid > 0 && invoice.amountPaid < invoice.amountDue && (
											<p className="text-sm text-yellow-600">
												{formatCurrency(invoice.amountPaid / 100)} pago
											</p>
										)}
										<p className="text-sm text-muted-foreground">{invoice.currency}</p>
									</div>

									<div className="flex space-x-2">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem>
													<Eye className="h-4 w-4 mr-2" />
													Ver Detalhes
												</DropdownMenuItem>

												<DropdownMenuItem>
													<Download className="h-4 w-4 mr-2" />
													Baixar PDF
												</DropdownMenuItem>

												{invoice.receiptUrl && (
													<DropdownMenuItem>
														<FileText className="h-4 w-4 mr-2" />
														Ver Recibo
													</DropdownMenuItem>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
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
