import { FinancialEventForm } from './FinancialEventForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { FinancialEvent } from '@/types/financial-events';

interface EditTransactionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: FinancialEvent | null;
}

export function EditTransactionDialog({
	open,
	onOpenChange,
	transaction,
}: EditTransactionDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Editar Transação</DialogTitle>
				</DialogHeader>
				{transaction && (
					<FinancialEventForm
						initialData={transaction}
						onSuccess={() => onOpenChange(false)}
						onCancel={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
