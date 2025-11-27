/* eslint-disable react/jsx-filename-extension, max-lines, max-lines-per-function, import/no-default-export, no-duplicate-imports, sort-imports */

import type { FormEvent, ReactElement } from 'react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { useCreateTransaction } from '@/hooks/use-transactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';

type TransactionType = 'credit' | 'debit' | 'pix' | 'boleto' | 'transfer';
interface TransactionFormProps {
	onCancel: () => void;
	onSuccess?: () => void;
}
interface BankAccount {
	balance: number | null;
	id: string;
	institution_name: string;
}
interface FormState {
	accountId: string;
	amount: string;
	date: string;
	description: string;
	type: TransactionType;
}
type ValidationResult =
	| { account: BankAccount; numericAmount: number; transactionDate: Date }
	| { error: string };
type SubmitTransaction = (input: {
	amount: number;
	categoryId?: string;
	description?: string;
	fromAccountId: string;
	toAccountId?: string;
	type: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
	status?: 'cancelled' | 'failed' | 'pending' | 'posted';
	metadata?: Record<string, unknown>;
}) => Promise<unknown>;
interface SubmitDeps {
	accountList: BankAccount[];
	formState: FormState;
	onSuccess?: () => void;
	setFormState: (state: FormState) => void;
	setIsLoading: (value: boolean) => void;
	submitTransaction: SubmitTransaction;
	updateBalance: (input: { balance: number; id: string }) => void;
}

const debitTypes = new Set<TransactionType>([
	'debit',
	'pix',
	'boleto',
	'transfer',
]);
const typeOptions: { label: string; value: TransactionType }[] = [
	{ label: 'Débito', value: 'debit' },
	{ label: 'Crédito', value: 'credit' },
	{ label: 'PIX', value: 'pix' },
	{ label: 'Boleto', value: 'boleto' },
	{ label: 'Transferência', value: 'transfer' },
];
const initialState: FormState = {
	accountId: '',
	amount: '',
	date: new Date().toISOString().split('T')[0],
	description: '',
	type: 'debit',
};

const computeFinalAmount = (
	transactionType: TransactionType,
	numericAmount: number,
): number => {
	if (debitTypes.has(transactionType) && numericAmount > 0) {
		return -Math.abs(numericAmount);
	}
	return Math.abs(numericAmount);
};

const validateForm = (
	state: FormState,
	accounts: BankAccount[],
): ValidationResult => {
	if (!state.amount || !state.date || !state.accountId || !state.type) {
		return { error: 'Preencha os campos obrigatórios' };
	}
	const numericAmount = Number(state.amount);
	if (Number.isNaN(numericAmount) || numericAmount <= 0) {
		return { error: 'Valor inválido' };
	}
	const transactionDate = new Date(state.date);
	if (Number.isNaN(transactionDate.getTime())) {
		return { error: 'Data inválida' };
	}
	const account = accounts.find(
		(accountItem) => accountItem.id === state.accountId,
	);
	if (!account) {
		return { error: 'Conta bancária inválida' };
	}
	return { account, numericAmount, transactionDate };
};

const FormActions = ({
	isLoading,
	onCancel,
}: {
	isLoading: boolean;
	onCancel: () => void;
}): ReactElement => {
	const renderLabel = (): string => {
		if (isLoading) {
			return 'Salvando...';
		}
		return 'Salvar';
	};
	return (
		<div className="mt-4 flex justify-end gap-2">
			<button
				className="rounded border border-gray-300 px-4 py-2 text-sm transition hover:bg-muted"
				disabled={isLoading}
				type="button"
				onClick={onCancel}
			>
				Cancelar
			</button>
			<button
				className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90"
				disabled={isLoading}
				type="submit"
			>
				{renderLabel()}
			</button>
		</div>
	);
};

const TypeSelect = ({
	onChange,
	selectedType,
}: {
	onChange: (value: TransactionType) => void;
	selectedType: TransactionType;
}): ReactElement => {
	const typeId = useId();
	return (
		<label className="space-y-2">
			<span className="block text-sm font-medium">Tipo</span>
			<select
				className="w-full rounded border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
				id={typeId}
				onChange={(event) => onChange(event.target.value as TransactionType)}
				value={selectedType}
			>
				<option value="">Selecione o tipo</option>
				{typeOptions.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	);
};

const AccountSelect = ({
	accountId,
	accounts,
	onChange,
}: {
	accountId: string;
	accounts: BankAccount[];
	onChange: (value: string) => void;
}): ReactElement => {
	const acctId = useId();
	return (
		<label className="space-y-2 md:col-span-2">
			<span className="block text-sm font-medium">Conta Bancária</span>
			<select
				className="w-full rounded border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
				id={acctId}
				onChange={(event) => onChange(event.target.value)}
				value={accountId}
			>
				<option value="">Selecione a conta</option>
				{accounts.map((account) => (
					<option key={account.id} value={account.id}>
						{account.institution_name}
					</option>
				))}
			</select>
		</label>
	);
};

const TextField = ({
	label,
	onChange,
	placeholder,
	type,
	value,
}: {
	label: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type: string;
	value: string;
}): ReactElement => {
	const fieldId = useId();
	return (
		<label className="space-y-2">
			<span className="block text-sm font-medium">{label}</span>
			<input
				className="w-full rounded border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
				id={fieldId}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				required
				type={type}
				value={value}
			/>
		</label>
	);
};

const FormFields = ({
	accountList,
	formState,
	onAccountChange,
	onDateChange,
	onDescriptionChange,
	onTypeChange,
	onValueChange,
}: {
	accountList: BankAccount[];
	formState: FormState;
	onAccountChange: (value: string) => void;
	onDateChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onTypeChange: (value: TransactionType) => void;
	onValueChange: (value: string) => void;
}): ReactElement => (
	<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			label="Descrição"
			onChange={onDescriptionChange}
			placeholder="Ex: Supermercado"
			type="text"
			value={formState.description}
		/>
		<TextField
			label="Valor"
			onChange={onValueChange}
			placeholder="0.00"
			type="number"
			value={formState.amount}
		/>
		<TypeSelect onChange={onTypeChange} selectedType={formState.type} />
		<TextField
			label="Data"
			onChange={onDateChange}
			type="date"
			value={formState.date}
		/>
		<AccountSelect
			accountId={formState.accountId}
			accounts={accountList}
			onChange={onAccountChange}
		/>
	</div>
);

const TransactionFormLayout = ({
	accountList,
	formState,
	isLoading,
	onAccountChange,
	onCancel,
	onDateChange,
	onDescriptionChange,
	onSubmit,
	onTypeChange,
	onValueChange,
}: {
	accountList: BankAccount[];
	formState: FormState;
	isLoading: boolean;
	onAccountChange: (value: string) => void;
	onCancel: () => void;
	onDateChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	onTypeChange: (value: TransactionType) => void;
	onValueChange: (value: string) => void;
}): ReactElement => {
	const formTitleId = useId();
	return (
		<section
			aria-labelledby={formTitleId}
			className="rounded-lg border border-primary/20 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
		>
			<header className="mb-4 space-y-2">
				<h2 className="text-lg font-semibold" id={formTitleId}>
					Nova Transação
				</h2>
				<p className="text-sm text-muted-foreground">
					Adicione uma nova transação ao seu histórico
				</p>
			</header>
			<form className="grid gap-4" noValidate onSubmit={onSubmit}>
				<FormFields
					accountList={accountList}
					formState={formState}
					onAccountChange={onAccountChange}
					onDateChange={onDateChange}
					onDescriptionChange={onDescriptionChange}
					onTypeChange={onTypeChange}
					onValueChange={onValueChange}
				/>
				<FormActions isLoading={isLoading} onCancel={onCancel} />
			</form>
		</section>
	);
};

const createSubmitHandler =
	({
		accountList,
		formState,
		onSuccess,
		setFormState,
		setIsLoading,
		submitTransaction,
		updateBalance,
	}: SubmitDeps) =>
	async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		const validation = validateForm(formState, accountList);
		if ('error' in validation) {
			toast.error(validation.error);
			return;
		}
		const {
			account,
			numericAmount,
			transactionDate: _transactionDate,
		} = validation;
		setIsLoading(true);
		try {
			const finalAmount = computeFinalAmount(formState.type, numericAmount);
			await submitTransaction({
				fromAccountId: account.id,
				amount: finalAmount,
				description: formState.description,
				type: formState.type,
				status: 'posted',
			});
			updateBalance({
				balance: Number(account.balance ?? 0) + finalAmount,
				id: account.id,
			});
			toast.success('Transação criada com sucesso!');
			onSuccess?.();
			setFormState(initialState);
		} catch (error) {
			if (error instanceof Error) {
				const { message: errorMessage } = error;
				toast.error(`Erro ao criar transação: ${errorMessage}`);
			} else {
				toast.error('Erro ao criar transação: Erro desconhecido');
			}
		} finally {
			setIsLoading(false);
		}
	};

const TransactionForm = ({
	onCancel,
	onSuccess,
}: TransactionFormProps): ReactElement => {
	const { mutateAsync: createTransaction } = useCreateTransaction();
	const { accounts, updateBalance } = useBankAccounts();
	const [formState, setFormState] = useState<FormState>(initialState);
	const [isLoading, setIsLoading] = useState(false);
	const accountList = accounts ?? [];

	const updateField = <Key extends keyof FormState>(
		key: Key,
		value: FormState[Key],
	): void => {
		setFormState((previous) => ({ ...previous, [key]: value }));
	};

	const handleSubmit = createSubmitHandler({
		accountList,
		formState,
		onSuccess,
		setFormState,
		setIsLoading,
		submitTransaction: createTransaction,
		updateBalance,
	});

	const guardedSubmit = async (
		event: FormEvent<HTMLFormElement>,
	): Promise<void> => {
		if (isLoading) {
			return;
		}
		await handleSubmit(event);
	};

	return (
		<TransactionFormLayout
			accountList={accountList}
			formState={formState}
			isLoading={isLoading}
			onAccountChange={(value) => updateField('accountId', value)}
			onCancel={onCancel}
			onDateChange={(value) => updateField('date', value)}
			onDescriptionChange={(value) => updateField('description', value)}
			onSubmit={guardedSubmit}
			onTypeChange={(value) => updateField('type', value)}
			onValueChange={(value) => updateField('amount', value)}
		/>
	);
};

export default TransactionForm;
