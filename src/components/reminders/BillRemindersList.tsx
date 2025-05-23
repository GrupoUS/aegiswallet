
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import AddBillReminderDialog from "./AddBillReminderDialog";

interface BillReminder {
  id: string;
  name: string;
  due_date: string;
  amount: number | null;
  is_paid: boolean;
}

const BillRemindersList = () => {
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("bill_reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date");

      if (data) {
        setReminders(data);
      }
    } catch (error) {
      console.error("Erro ao buscar lembretes:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaidStatus = async (id: string, isPaid: boolean) => {
    try {
      const { error } = await supabase
        .from("bill_reminders")
        .update({ is_paid: !isPaid })
        .eq("id", id);

      if (!error) {
        setReminders(prev =>
          prev.map(reminder =>
            reminder.id === id ? { ...reminder, is_paid: !isPaid } : reminder
          )
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusInfo = (dueDate: string, isPaid: boolean) => {
    if (isPaid) {
      return { color: "text-green-600", bg: "bg-green-100", icon: CheckCircle, label: "Pago" };
    }

    const today = new Date();
    const due = new Date(dueDate);
    const threeDaysFromNow = addDays(today, 3);

    if (isBefore(due, today)) {
      return { color: "text-red-600", bg: "bg-red-100", icon: AlertTriangle, label: "Vencido" };
    } else if (isBefore(due, threeDaysFromNow)) {
      return { color: "text-orange-600", bg: "bg-orange-100", icon: AlertTriangle, label: "Vence em breve" };
    } else {
      return { color: "text-blue-600", bg: "bg-blue-100", icon: Calendar, label: "Em dia" };
    }
  };

  if (loading) {
    return <div className="text-center">Carregando lembretes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Lembretes de Contas</h2>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Lembrete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Contas a Pagar ({reminders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum lembrete cadastrado
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => {
                const statusInfo = getStatusInfo(reminder.due_date, reminder.is_paid);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium">{reminder.name}</h3>
                        <p className="text-sm text-gray-500">
                          Vencimento: {formatDate(reminder.due_date)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {reminder.amount && (
                        <div className="text-lg font-semibold">
                          {formatCurrency(reminder.amount)}
                        </div>
                      )}
                      
                      <Button
                        variant={reminder.is_paid ? "outline" : "default"}
                        size="sm"
                        onClick={() => togglePaidStatus(reminder.id, reminder.is_paid)}
                      >
                        {reminder.is_paid ? "Marcar como pendente" : "Marcar como pago"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddBillReminderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchReminders}
      />
    </div>
  );
};

export default BillRemindersList;
