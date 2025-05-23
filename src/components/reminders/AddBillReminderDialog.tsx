
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const reminderSchema = z.object({
  name: z.string().min(1, "Nome da conta é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  amount: z.string().optional(),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface AddBillReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddBillReminderDialog = ({ open, onOpenChange, onSuccess }: AddBillReminderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
  });

  const onSubmit = async (data: ReminderFormData) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("bill_reminders")
        .insert({
          user_id: user.id,
          name: data.name,
          due_date: data.dueDate,
          amount: data.amount ? parseFloat(data.amount) : null,
        });

      if (error) {
        toast({
          title: "Erro ao salvar lembrete",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lembrete salvo!",
          description: "O lembrete foi adicionado com sucesso",
        });
        reset();
        onOpenChange(false);
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Lembrete de Conta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Conta</Label>
            <Input
              id="name"
              placeholder="Ex: Conta de luz"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="dueDate">Data de Vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              {...register("dueDate")}
            />
            {errors.dueDate && (
              <p className="text-sm text-red-500 mt-1">{errors.dueDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Valor (R$) - Opcional</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBillReminderDialog;
