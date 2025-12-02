import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { type Resolver, type SubmitHandler, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { type BankAccount, useBankAccounts } from '@/hooks/useBankAccounts';
import { logger } from '@/lib/logging';

const accountTypeEnum = z.enum(['checking', 'savings', 'investment', 'cash']);
type AccountType = z.infer<typeof accountTypeEnum>;

const formSchema = z.object({
	accountType: accountTypeEnum,
	balance: z.number(),
	currency: z.string(),
	institutionName: z.string().min(1, 'Nome da instituição é obrigatório'),
	isActive: z.boolean(),
	isPrimary: z.boolean(),
});

type BankAccountFormValues = z.infer<typeof formSchema>;

interface BankAccountFormProps {
	account?: BankAccount;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function BankAccountForm({ account, onSuccess, onCancel }: BankAccountFormProps) {
	const { createAccount, updateAccount, isCreating, isUpdating } = useBankAccounts();

	const form = useForm<BankAccountFormValues>({
		defaultValues: {
			accountType: 'checking',
			balance: 0,
			currency: 'BRL',
			institutionName: '',
			isActive: true,
			isPrimary: false,
		},
		resolver: zodResolver(formSchema) as Resolver<BankAccountFormValues>,
		mode: 'onSubmit',
	});

	useEffect(() => {
		if (account) {
			form.reset({
				accountType: account.account_type as AccountType,
				balance: Number(account.balance ?? 0),
				currency: account.currency ?? 'BRL',
				institutionName: account.institution_name ?? '',
				isActive: account.is_active ?? true,
				isPrimary: account.is_primary ?? false,
			});
		}
	}, [account, form]);

	const onSubmit: SubmitHandler<BankAccountFormValues> = async (values) => {
		try {
			if (account) {
				await updateAccount({ id: account.id, ...values });
			} else {
				await createAccount(values);
			}
			onSuccess?.();
		} catch (error) {
			logger.error('Failed to save bank account', {
				error: error instanceof Error ? error.message : String(error),
				accountType: values.accountType,
				institution: values.institutionName,
				isUpdate: !!account,
				accountId: account?.id,
			});
		}
	};

	const isLoading = isCreating || isUpdating;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="institutionName"
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
						name="accountType"
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
								<Input type="number" step="0.01" placeholder="0.00" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex gap-4">
					<FormField
						control={form.control}
						name="isActive"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
								<FormControl>
									<Checkbox checked={field.value} onCheckedChange={field.onChange} />
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>Ativa</FormLabel>
									<FormDescription>A conta aparecerá nas listas</FormDescription>
								</div>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="isPrimary"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
								<FormControl>
									<Checkbox checked={field.value} onCheckedChange={field.onChange} />
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
						{isLoading ? 'Salvando...' : account ? 'Atualizar Conta' : 'Criar Conta'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
