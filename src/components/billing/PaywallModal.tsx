import { PricingTable } from './PricingTable';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

interface PaywallModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	feature?: string;
}

export function PaywallModal({ open, onOpenChange, feature }: PaywallModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">
						{feature ? `Upgrade para acessar ${feature}` : 'Upgrade para recursos premium'}
					</DialogTitle>
					<DialogDescription>
						Escolha o plano ideal para suas necessidades financeiras
					</DialogDescription>
				</DialogHeader>

				<div className="mt-6">
					<PricingTable />
				</div>
			</DialogContent>
		</Dialog>
	);
}
