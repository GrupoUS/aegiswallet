import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CheckCircle, Copy, Edit2, Loader2, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FinancialAmount } from '@/components/financial-amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFinancialEvent, useFinancialEvents } from '@/hooks/useFinancialEvents';

interface TransactionDetailsModalProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({
  transactionId,
  isOpen,
  onClose,
}: TransactionDetailsModalProps) {
  const { event, loading, error } = useFinancialEvent(transactionId || '');
  const { deleteEvent, updateEvent, duplicateEvent } = useFinancialEvents();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleDelete = async () => {
    if (!transactionId) {
      return;
    }
    try {
      setIsDeleting(true);
      await deleteEvent(transactionId);
      onClose();
    } catch (_error) {
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!transactionId || !event) {
      return;
    }
    try {
      setIsProcessing(true);
      const newStatus = event.status === 'paid' ? 'pending' : 'paid';
      await updateEvent(transactionId, { status: newStatus });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async () => {
    if (!transactionId) {
      return;
    }
    try {
      setIsProcessing(true);
      await duplicateEvent(transactionId);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !event) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-4">
            <p className="text-destructive mb-2">Erro ao carregar detalhes</p>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-500">Pago</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Pendente
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Agendado
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">{event.title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {event.description || 'Sem descrição'}
                </DialogDescription>
              </div>
              {getStatusBadge(event.status)}
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Valor</span>
              <FinancialAmount
                amount={event.type === 'expense' ? -event.amount : event.amount}
                currency="BRL"
                size="xl"
                className={event.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Data</span>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(event.start), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Tipo</span>
                <div className="text-sm capitalize">
                  {event.type === 'income'
                    ? 'Receita'
                    : event.type === 'expense'
                      ? 'Despesa'
                      : event.type}
                </div>
              </div>
              {event.category && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Categoria</span>
                  <div className="text-sm">{event.category}</div>
                </div>
              )}
              {event.isRecurring && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Recorrência</span>
                  <div className="text-sm">Sim</div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto justify-start">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                title="Excluir"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDuplicate}
                disabled={isProcessing}
                title="Duplicar"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                onClick={handleMarkAsPaid}
                disabled={isProcessing}
                className={
                  event.status === 'paid'
                    ? 'text-yellow-600 hover:text-yellow-700'
                    : 'text-emerald-600 hover:text-emerald-700'
                }
              >
                {event.status === 'paid' ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" /> Marcar Pendente
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" /> Marcar Pago
                  </>
                )}
              </Button>
              <Button variant="default" onClick={() => toast.info('Edição em breve')}>
                <Edit2 className="h-4 w-4 mr-2" /> Editar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir Transação"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}
