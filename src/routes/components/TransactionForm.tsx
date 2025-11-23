import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useFinancialEvents } from "@/hooks/useFinancialEvents";
import type {
  FinancialEventCategory,
  FinancialEventStatus,
} from "@/types/financial.interfaces";
import type { FinancialEvent, EventStatus } from "@/types/financial-events";

interface TransactionFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

// Use the actual BankAccount type from financial.interfaces.ts

export default function TransactionForm({
  onCancel,
  onSuccess,
}: TransactionFormProps) {
  const { createEvent } = useFinancialEvents();
  const { accounts } = useBankAccounts();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [category, setCategory] = useState<FinancialEventCategory>("OUTROS");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<FinancialEventStatus>("PENDENTE");
  const [accountId, setAccountId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !amount || !date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsLoading(true);

    try {
      const numericAmount = parseFloat(amount);
      const finalAmount = isIncome
        ? Math.abs(numericAmount)
        : -Math.abs(numericAmount);

      const eventData: Omit<FinancialEvent, "id"> = {
        title,
        amount: finalAmount,
        category,
        start: new Date(date),
        end: new Date(date),
        allDay: true,
        recurring: false,
        color: isIncome ? "emerald" : "rose",
        status: "pending" as EventStatus,
        type: isIncome ? "income" : "expense",
      };

      await createEvent(eventData);

      if (onSuccess) {
        onSuccess();
      }

      // Reset
      setTitle("");
      setAmount("");
      setCategory("OUTROS");
      setIsIncome(false);
    } catch (_error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="border-primary/20 transition-all duration-300 hover:shadow-lg"
      role="form"
      aria-labelledby="transaction-form-title"
    >
      <CardHeader>
        <CardTitle id="transaction-form-title">Nova Transação</CardTitle>
        <CardDescription>
          Adicione uma nova transação ao seu histórico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Descrição</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Supermercado"
                required
                aria-required="true"
                aria-describedby="title-description"
              />
              <span id="title-description" className="sr-only">
                Descrição obrigatória da transação financeira
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                aria-required="true"
                aria-describedby="amount-description"
                inputMode="decimal"
              />
              <span id="amount-description" className="sr-only">
                Valor monetário da transação em reais
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={isIncome.toString()}
                onValueChange={(v) => setIsIncome(v === "true")}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Despesa</SelectItem>
                  <SelectItem value="true">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as FinancialEventStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  <SelectItem value="AGENDADO">Agendado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as FinancialEventCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEITA">Receita</SelectItem>
                  <SelectItem value="DESPESA_FIXA">Despesa Fixa</SelectItem>
                  <SelectItem value="DESPESA_VARIAVEL">
                    Despesa Variável
                  </SelectItem>
                  <SelectItem value="TRANSPORTE">Transporte</SelectItem>
                  <SelectItem value="ALIMENTACAO">Alimentação</SelectItem>
                  <SelectItem value="MORADIA">Moradia</SelectItem>
                  <SelectItem value="SAUDE">Saúde</SelectItem>
                  <SelectItem value="EDUCACAO">Educação</SelectItem>
                  <SelectItem value="LAZER">Lazer</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="account">Conta Bancária (Opcional)</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="account">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.institution_name} ({account.account_mask})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              aria-label="Cancelar formulário de transação"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              aria-label={
                isLoading ? "Salvando transação" : "Salvar nova transação"
              }
              aria-busy={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
