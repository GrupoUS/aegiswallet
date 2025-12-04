'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Building, MoreVertical, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';

import { BankAccountForm } from '@/components/bank-accounts/BankAccountForm';
import { FinancialAmount } from '@/components/financial-amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
	DrawerStaggerContainer,
	DrawerStaggerItem,
	SmoothDrawer,
} from '@/components/ui/smooth-drawer';
import { type BankAccount, useBankAccounts, useBankAccountsStats } from '@/hooks/useBankAccounts';
import { logger } from '@/lib/logging';
import { cn } from '@/lib/utils';

interface BankAccountsDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

// Summary card component
function SummaryCard({
	title,
	value,
	subtitle,
	isLoading,
	variant = 'default',
}: {
	title: string;
	value: React.ReactNode;
	subtitle?: string;
	isLoading?: boolean;
	variant?: 'default' | 'primary' | 'success';
}) {
	const variantClasses = {
		default: 'bg-muted/50',
		primary: 'bg-primary/10 border-primary/20',
		success: 'bg-emerald-500/10 border-emerald-500/20',
	};

	return (
		<Card className={cn('border', variantClasses[variant])}>
			<CardHeader className="pb-2">
				<CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<>
						<Skeleton className="mb-1 h-7 w-24" />
						<Skeleton className="h-4 w-16" />
					</>
				) : (
					<>
						<div className="font-bold text-xl">{value}</div>
						{subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
					</>
				)}
			</CardContent>
		</Card>
	);
}

// Bank account card with actions
function BankAccountCard({
	account,
	onEdit,
	onDelete,
}: {
	account: BankAccount;
	onEdit: (account: BankAccount) => void;
	onDelete: (account: BankAccount) => void;
}) {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ type: 'spring', damping: 25, stiffness: 300 }}
		>
			<Card className="transition-all hover:shadow-md">
				<CardContent className="p-4">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<Building className="h-5 w-5 text-primary" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h4 className="font-semibold">
										{account.institution_name || account.institutionName}
									</h4>
									{(account.is_primary || account.isPrimary) && (
										<Badge variant="default" className="text-xs">
											Principal
										</Badge>
									)}
								</div>
								<p className="text-muted-foreground text-sm capitalize">
									{account.account_type || account.accountType}
								</p>
							</div>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreVertical className="h-4 w-4" />
									<span className="sr-only">Abrir menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => onEdit(account)}>
									<Pencil className="mr-2 h-4 w-4" />
									Editar
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => onDelete(account)}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Excluir
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="mt-3">
						<p className="text-muted-foreground text-xs">Saldo Atual</p>
						<FinancialAmount
							amount={Number(account.balance ?? 0)}
							currency={(account.currency as 'BRL' | 'USD' | 'EUR') ?? 'BRL'}
							size="lg"
							showSign={false}
							className="text-foreground"
						/>
					</div>

					<div className="mt-3 flex gap-2">
						{!(account.is_active ?? account.isActive ?? true) && (
							<Badge variant="secondary">Inativa</Badge>
						)}
						<Badge variant="outline" className="uppercase">
							{account.currency ?? 'BRL'}
						</Badge>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

// Empty state component
function EmptyState({ onAddAccount }: { onAddAccount: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<Wallet className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="mb-2 font-semibold text-lg">Nenhuma conta cadastrada</h3>
			<p className="mb-6 max-w-xs text-muted-foreground text-sm">
				Adicione sua primeira conta bancária para começar a gerenciar suas finanças.
			</p>
			<Button onClick={onAddAccount} className="gap-2">
				<Plus className="h-4 w-4" />
				Adicionar Conta
			</Button>
		</div>
	);
}

// Loading skeleton
function AccountsListSkeleton() {
	return (
		<div className="space-y-3">
			{[1, 2, 3].map((i) => (
				<Card key={i}>
					<CardContent className="p-4">
						<div className="flex items-start gap-3">
							<Skeleton className="h-10 w-10 rounded-full" />
							<div className="flex-1">
								<Skeleton className="mb-2 h-5 w-32" />
								<Skeleton className="h-4 w-24" />
							</div>
							<Skeleton className="h-8 w-8" />
						</div>
						<Skeleton className="mt-3 h-6 w-28" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function BankAccountsDrawer({ open, onOpenChange }: BankAccountsDrawerProps) {
	const { accounts, isLoading, deleteAccountAsync, isDeleting } = useBankAccounts();
	const stats = useBankAccountsStats();

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
	const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);

	const handleEdit = (account: BankAccount) => {
		setEditingAccount(account);
	};

	const handleDelete = (account: BankAccount) => {
		setDeletingAccount(account);
	};

	const confirmDelete = async () => {
		if (deletingAccount) {
			try {
				await deleteAccountAsync({ id: deletingAccount.id });
				setDeletingAccount(null);
			} catch (error) {
				logger.error('Failed to delete bank account', {
					error: error instanceof Error ? error.message : String(error),
					accountId: deletingAccount.id,
					institution: deletingAccount.institution_name || deletingAccount.institutionName,
					accountType: deletingAccount.account_type || deletingAccount.accountType,
				});
			}
		}
	};

	return (
		<>
			<SmoothDrawer
				open={open}
				onOpenChange={onOpenChange}
				title="Gerenciar Contas Bancárias"
				description="Adicione, edite ou remova suas contas"
				width="xl"
			>
				<DrawerStaggerContainer className="space-y-6">
					{/* Summary Cards */}
					<DrawerStaggerItem>
						<div className="grid grid-cols-3 gap-3">
							<SummaryCard
								title="Saldo Total"
								value={
									<FinancialAmount
										amount={stats.totalBalance}
										currency="BRL"
										size="lg"
										showSign={false}
									/>
								}
								isLoading={isLoading}
								variant="primary"
							/>
							<SummaryCard
								title="Ativas"
								value={stats.activeAccounts}
								subtitle={`de ${stats.totalAccounts}`}
								isLoading={isLoading}
							/>
							<SummaryCard title="Principais" value={stats.primaryAccounts} isLoading={isLoading} />
						</div>
					</DrawerStaggerItem>

					{/* Add Account Button */}
					<DrawerStaggerItem>
						<Button onClick={() => setIsCreateOpen(true)} className="w-full gap-2" size="lg">
							<Plus className="h-4 w-4" />
							Adicionar Nova Conta
						</Button>
					</DrawerStaggerItem>

					{/* Accounts List */}
					<DrawerStaggerItem>
						{isLoading ? (
							<AccountsListSkeleton />
						) : accounts.length === 0 ? (
							<EmptyState onAddAccount={() => setIsCreateOpen(true)} />
						) : (
							<div className="space-y-3">
								<AnimatePresence mode="popLayout">
									{accounts.map((account) => (
										<BankAccountCard
											key={account.id}
											account={account}
											onEdit={handleEdit}
											onDelete={handleDelete}
										/>
									))}
								</AnimatePresence>
							</div>
						)}
					</DrawerStaggerItem>
				</DrawerStaggerContainer>
			</SmoothDrawer>

			{/* Create Modal */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Adicionar Nova Conta</DialogTitle>
						<DialogDescription>
							Preencha os dados para adicionar uma nova conta bancária.
						</DialogDescription>
					</DialogHeader>
					<BankAccountForm
						onSuccess={() => setIsCreateOpen(false)}
						onCancel={() => setIsCreateOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			{/* Edit Modal */}
			<Dialog open={!!editingAccount} onOpenChange={(o) => !o && setEditingAccount(null)}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Editar Conta</DialogTitle>
						<DialogDescription>Atualize os dados da conta bancária.</DialogDescription>
					</DialogHeader>
					{editingAccount && (
						<BankAccountForm
							account={editingAccount}
							onSuccess={() => setEditingAccount(null)}
							onCancel={() => setEditingAccount(null)}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<ConfirmDialog
				open={!!deletingAccount}
				onOpenChange={(o) => !o && setDeletingAccount(null)}
				title="Excluir Conta"
				description={`Tem certeza que deseja excluir a conta "${deletingAccount?.institution_name || deletingAccount?.institutionName}"? Esta ação não pode ser desfeita.`}
				onConfirm={confirmDelete}
				loading={isDeleting}
				confirmText="Excluir Conta"
				variant="destructive"
			/>
		</>
	);
}
