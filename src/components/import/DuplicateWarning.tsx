/**
 * @file DuplicateWarning.tsx
 * @description Alert component for duplicate transaction warnings
 * @module import/DuplicateWarning
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, ChevronDown, ChevronUp, Eye, EyeOff, Info } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn, formatCurrency } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DuplicateTransaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	type: 'CREDIT' | 'DEBIT';
	existingId?: string;
	existingDate?: string;
	matchReason?: string;
}

interface DuplicateWarningProps {
	duplicates: DuplicateTransaction[];
	selectedIds: Set<string>;
	onToggleSelection: (id: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DuplicateWarning({
	duplicates,
	selectedIds,
	onToggleSelection,
	onSelectAll,
	onDeselectAll,
	className,
}: DuplicateWarningProps) {
	const [isOpen, setIsOpen] = useState(false);

	if (duplicates.length === 0) {
		return null;
	}

	const selectedCount = duplicates.filter((d) => selectedIds.has(d.id)).length;
	const allSelected = selectedCount === duplicates.length;
	const noneSelected = selectedCount === 0;

	return (
		<Alert
			variant="default"
			className={cn('border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20', className)}
		>
			<AlertTriangle className="h-5 w-5 text-yellow-600" />
			<AlertTitle className="text-yellow-800 dark:text-yellow-200 flex items-center justify-between">
				<span>Possíveis Transações Duplicadas</span>
				<Badge variant="outline" className="text-yellow-700 border-yellow-600 dark:text-yellow-300">
					{duplicates.length} encontradas
				</Badge>
			</AlertTitle>
			<AlertDescription className="text-yellow-700 dark:text-yellow-300">
				<div className="space-y-3 mt-2">
					<p className="text-sm">
						Detectamos {duplicates.length} transaçõ{duplicates.length > 1 ? 'es' : ''} que podem já
						existir na sua conta. Revise cuidadosamente antes de importar.
					</p>

					{/* Quick actions */}
					<div className="flex items-center gap-2 flex-wrap">
						<Button
							variant="outline"
							size="sm"
							onClick={onDeselectAll}
							className="text-yellow-700 border-yellow-600 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
							disabled={noneSelected}
						>
							<EyeOff className="h-4 w-4 mr-1" />
							Ignorar Todas
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onSelectAll}
							className="text-yellow-700 border-yellow-600 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
							disabled={allSelected}
						>
							<Eye className="h-4 w-4 mr-1" />
							Importar Mesmo Assim
						</Button>
					</div>

					{/* Collapsible details */}
					<Collapsible open={isOpen} onOpenChange={setIsOpen}>
						<CollapsibleTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-between text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
							>
								<span className="flex items-center gap-2">
									<Info className="h-4 w-4" />
									Ver detalhes ({selectedCount} selecionadas para importar)
								</span>
								{isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
							</Button>
						</CollapsibleTrigger>

						<CollapsibleContent className="mt-3 space-y-2">
							{duplicates.map((duplicate) => {
								const isSelected = selectedIds.has(duplicate.id);

								return (
									<button
										key={duplicate.id}
										type="button"
										className={cn(
											'w-full text-left p-3 rounded-lg border transition-colors cursor-pointer',
											isSelected
												? 'bg-white dark:bg-yellow-900/30 border-yellow-400'
												: 'bg-yellow-100/50 dark:bg-yellow-950/50 border-yellow-300/50 opacity-60',
										)}
										onClick={() => onToggleSelection(duplicate.id)}
										aria-pressed={isSelected}
									>
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<span className="text-sm font-medium text-foreground truncate">
														{duplicate.description}
													</span>
													<Badge
														variant={duplicate.type === 'CREDIT' ? 'default' : 'secondary'}
														className={cn(
															'shrink-0 text-xs',
															duplicate.type === 'CREDIT'
																? 'bg-green-100 text-green-800'
																: 'bg-red-100 text-red-800',
														)}
													>
														{duplicate.type === 'CREDIT' ? 'Crédito' : 'Débito'}
													</Badge>
												</div>
												<div className="flex items-center gap-3 text-xs text-muted-foreground">
													<span>
														{format(new Date(duplicate.date), 'dd/MM/yyyy', { locale: ptBR })}
													</span>
													{duplicate.matchReason && (
														<span className="italic">• {duplicate.matchReason}</span>
													)}
												</div>
												{duplicate.existingDate && (
													<div className="mt-1 text-xs text-yellow-600">
														Existente em:{' '}
														{format(new Date(duplicate.existingDate), 'dd/MM/yyyy', {
															locale: ptBR,
														})}
													</div>
												)}
											</div>
											<div className="text-right shrink-0">
												<span
													className={cn(
														'font-semibold',
														duplicate.type === 'CREDIT' ? 'text-green-600' : 'text-red-600',
													)}
												>
													{duplicate.type === 'CREDIT' ? '+' : '-'}
													{formatCurrency(Math.abs(duplicate.amount))}
												</span>
												<div className="mt-1">
													<Badge variant={isSelected ? 'default' : 'outline'} className="text-xs">
														{isSelected ? 'Importar' : 'Ignorar'}
													</Badge>
												</div>
											</div>
										</div>
									</button>
								);
							})}
						</CollapsibleContent>
					</Collapsible>
				</div>
			</AlertDescription>
		</Alert>
	);
}

export default DuplicateWarning;
