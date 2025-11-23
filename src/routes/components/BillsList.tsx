import { Calendar, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FinancialAmount } from '@/components/financial-amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { FinancialEvent } from '@/types/financial-events';

interface BillsListProps {
  bills: FinancialEvent[];
  filter?: 'all' | 'pending' | 'paid';
  onEdit?: (bill: FinancialEvent) => void;
  onDelete?: (id: string) => Promise<void>;
}

export function BillsList({ bills, onEdit, onDelete }: BillsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || !onDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (_error) {
    } finally {
      setIsDeleting(false);
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBillStatus = (dueDate: Date, status: string) => {
    if (status === 'paid' || status === 'completed') {
      return { color: 'bg-success', text: 'Pago' };
    }
    const days = getDaysUntilDue(dueDate);
    if (days < 0) {
      return { color: 'bg-destructive', text: 'Atrasado' };
    }
    if (days <= 3) {
      return { color: 'bg-warning', text: 'Vence em breve' };
    }
    return { color: 'bg-info', text: 'Pendente' };
  };

  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <div className="mb-4 rounded-full bg-muted p-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h3 className="font-semibold text-lg">Nenhuma conta encontrada</h3>
        <p>Não há contas para exibir com os filtros atuais.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Lista de contas a pagar">
      <h2 className="sr-only">Contas Financeiras</h2>
      {bills.map((bill) => {
        const status = getBillStatus(bill.end, bill.status);
        const daysUntilDue = getDaysUntilDue(bill.end);

        return (
          <Card
            key={bill.id}
            className="transition-shadow hover:shadow-lg"
            role="article"
            aria-labelledby={`bill-title-${bill.id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-4">
                  <div className="text-3xl" aria-hidden="true">
                    {bill.icon || '📄'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 id={`bill-title-${bill.id}`} className="font-semibold text-lg">
                        {bill.title}
                      </h3>
                      {bill.recurring && (
                        <Badge variant="outline" className="text-xs" aria-label="Conta recorrente">
                          Recorrente
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        <span>Vencimento: {new Date(bill.end).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {bill.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {daysUntilDue > 0
                              ? `${daysUntilDue} dias restantes`
                              : `${Math.abs(daysUntilDue)} dias atrasado`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-4"
                  role="toolbar"
                  aria-label={`Ações para conta: ${bill.title}`}
                >
                  <div className="text-right">
                    <FinancialAmount amount={-Math.abs(bill.amount)} size="lg" />
                    <Badge className={`${status.color} mt-2`} aria-label={`Status: ${status.text}`}>
                      {status.text}
                    </Badge>
                  </div>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => onEdit(bill)}
                      className="h-8 w-8"
                      aria-label={`Editar conta: ${bill.title}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => handleDeleteClick(bill.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label={`Excluir conta: ${bill.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {bill.status === 'pending' && (
                    <Button size="sm" type="button" aria-label={`Pagar conta: ${bill.title}`}>
                      Pagar
                    </Button>
                  )}
                  {(bill.status === 'paid' || bill.status === 'completed') && (
                    <CheckCircle className="h-6 w-6 text-success" aria-label="Conta paga" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Conta"
        description={
          deleteId
            ? `Tem certeza que deseja excluir a conta "${bills.find((b) => b.id === deleteId)?.title}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta conta?'
        }
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        confirmText="Excluir"
        variant="destructive"
      />
    </div>
  );
}
