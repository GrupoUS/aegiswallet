import { createLazyFileRoute } from '@tanstack/react-router';
import { Building, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BankAccountForm } from '@/components/bank-accounts/BankAccountForm';
import { FinancialAmount } from '@/components/financial-amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { type BankAccount, useBankAccounts, useBankAccountsStats } from '@/hooks/useBankAccounts';

export const ContasBancarias = () => {
  const { accounts, deleteAccountAsync, isDeleting } = useBankAccounts();
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
      } catch (_error) {}
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent">
            Contas Bancárias
          </h1>
          <p className="text-muted-foreground">Gerencie suas contas e saldos</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Conta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <FinancialAmount
                amount={stats.totalBalance}
                currency="BRL"
                size="xl"
                showSign={false}
                className="text-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">Soma de todas as contas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAccounts}</div>
            <p className="text-xs text-muted-foreground">De um total de {stats.totalAccounts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.primaryAccounts}</div>
            <p className="text-xs text-muted-foreground">Definidas como principal</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="relative transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{account.institution_name}</CardTitle>
                    <CardDescription className="capitalize">{account.account_type}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(account)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(account)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Saldo Atual</div>
                <FinancialAmount
                  amount={Number(account.balance)}
                  currency={account.currency || 'BRL'}
                  size="lg"
                  showSign={false}
                  className="text-foreground"
                />
              </div>
              <div className="flex gap-2">
                {account.is_primary && <Badge variant="default">Principal</Badge>}
                {!account.is_active && <Badge variant="secondary">Inativa</Badge>}
                <Badge variant="outline" className="uppercase">
                  {account.currency || 'BRL'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
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
        onOpenChange={(open) => !open && setDeletingAccount(null)}
        title="Excluir Conta"
        description={`Tem certeza que deseja excluir a conta "${deletingAccount?.institution_name}"? Esta ação não pode ser desfeita e pode afetar o histórico de transações vinculadas.`}
        onConfirm={confirmDelete}
        loading={isDeleting}
        confirmText="Excluir Conta"
        variant="destructive"
      />
    </div>
  );
};

export const Route = createLazyFileRoute('/contas-bancarias')({
  component: ContasBancarias,
});
