import { CreditCard, MoreHorizontal, Smartphone, Trash2, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PaymentMethod } from '@/types/billing';

interface PaymentMethodManagerProps {
	paymentMethods: PaymentMethod[];
}

const getPaymentMethodIcon = (type: PaymentMethod['type']) => {
	switch (type) {
		case 'card':
			return CreditCard;
		case 'pix':
			return Smartphone;
		case 'bank_account':
			return Wallet;
		default:
			return CreditCard;
	}
};

const getPaymentMethodLabel = (type: PaymentMethod['type']) => {
	switch (type) {
		case 'card':
			return 'Cartão de Crédito/Débito';
		case 'pix':
			return 'PIX';
		case 'bank_account':
			return 'Conta Bancária';
		default:
			return 'Método de Pagamento';
	}
};

const formatPaymentMethodInfo = (method: PaymentMethod) => {
	switch (method.type) {
		case 'card':
			return `****${method.last4} ${method.brand?.toUpperCase()}`;
		case 'pix':
			return `Chave: ${method.pixKey?.substring(0, 3)}****`;
		case 'bank_account':
			return `${method.bankName} ****${method.accountNumber?.slice(-4)}`;
		default:
			return 'Informações não disponíveis';
	}
};

export function PaymentMethodManager({ paymentMethods }: PaymentMethodManagerProps) {
	if (paymentMethods.length === 0) {
		return (
			<div className="text-center py-12">
				<CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium mb-2">Nenhum método de pagamento</h3>
				<p className="text-muted-foreground mb-4">
					Adicione um método de pagamento para começar a usar nossos serviços.
				</p>
				<Button>Adicionar Método de Pagamento</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{paymentMethods.map((method) => {
				const Icon = getPaymentMethodIcon(method.type);

				return (
					<Card key={method.id} className="hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<div className="flex-shrink-0">
										<Icon className="h-8 w-8 text-muted-foreground" />
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center space-x-2 mb-1">
											<span className="text-sm font-medium text-gray-900">
												{getPaymentMethodLabel(method.type)}
											</span>
											{method.isDefault && <Badge variant="default">Padrão</Badge>}
										</div>

										<p className="text-sm text-muted-foreground">
											{formatPaymentMethodInfo(method)}
										</p>

										{method.type === 'card' && method.expiryMonth && method.expiryYear && (
											<p className="text-xs text-muted-foreground mt-1">
												Vence em {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
											</p>
										)}

										<p className="text-xs text-muted-foreground mt-1">
											Adicionado em {new Date(method.createdAt).toLocaleDateString('pt-BR')}
										</p>
									</div>
								</div>

								<div className="flex items-center space-x-2">
									{!method.isDefault && (
										<Button variant="outline" size="sm">
											Tornar Padrão
										</Button>
									)}

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem>Editar</DropdownMenuItem>

											{method.type === 'card' && (
												<DropdownMenuItem>Atualizar Cartão</DropdownMenuItem>
											)}

											<DropdownMenuSeparator />

											{!method.isDefault && (
												<DropdownMenuItem className="text-red-600">
													<Trash2 className="h-4 w-4 mr-2" />
													Remover
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}

			{/* Add New Payment Method Button */}
			<div className="pt-4">
				<Button variant="outline" className="w-full">
					Adicionar Novo Método de Pagamento
				</Button>
			</div>
		</div>
	);
}
