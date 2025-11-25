import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import type { Tables } from "@/types/database.types";

const accountTypeEnum = z.enum(["checking", "savings", "investment", "cash"]);
type AccountType = z.infer<typeof accountTypeEnum>;

const formSchema = z.object({
  account_type: accountTypeEnum,
  balance: z.coerce.number(),
  currency: z.string().default("BRL"),
  institution_name: z.string().min(1, "Nome da instituição é obrigatório"),
  is_active: z.boolean().default(true),
  is_primary: z.boolean().default(false),
});

type BankAccountFormValues = z.infer<typeof formSchema>;
type BankAccountRow = Tables<"bank_accounts">;

interface BankAccountFormProps {
  account?: BankAccountRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BankAccountForm({
  account,
  onSuccess,
  onCancel,
}: BankAccountFormProps) {
  const { createAccount, updateAccount, isCreating, isUpdating } =
    useBankAccounts();

  const form = useForm<BankAccountFormValues, unknown, BankAccountFormValues>({
    defaultValues: {
      account_type: "checking" as AccountType,
      balance: 0,
      currency: "BRL",
      institution_name: "",
      is_active: true,
      is_primary: false,
    },
    resolver: zodResolver(formSchema) as Resolver<BankAccountFormValues>,
  });

  useEffect(() => {
    if (account) {
      form.reset({
        account_type: account.account_type as AccountType,
        balance: Number(account.balance ?? 0),
        currency: account.currency ?? "BRL",
        institution_name: account.institution_name ?? "",
        is_active: account.is_active ?? true,
        is_primary: account.is_primary ?? false,
      });
    }
  }, [account, form]);

  const onSubmit: SubmitHandler<BankAccountFormValues> = (values) => {
    if (account) {
      updateAccount(
        { id: account.id, ...values },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        },
      );
    } else {
      createAccount(values, {
        onSuccess: () => {
          onSuccess?.();
        },
      });
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="institution_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instituição Financeira</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Nubank, Itaú" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="account_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Conta</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moeda</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Ativa</FormLabel>
                  <FormDescription>
                    A conta aparecerá nas listas
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_primary"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Principal</FormLabel>
                  <FormDescription>Conta padrão para operações</FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Salvando..."
              : account
                ? "Atualizar Conta"
                : "Criar Conta"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
