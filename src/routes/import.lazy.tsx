/**
 * @file import.lazy.tsx
 * @description Lazy-loaded import page component for bank statement imports
 * @module routes/import
 */

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Building2, CheckCircle, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
	type DuplicateTransaction,
	DuplicateWarning,
	FileUploadZone,
	ImportSummary,
	type ImportSummaryData,
	type PreviewTransaction,
	TransactionPreview,
} from '@/components/import';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { type ExtractedTransaction, useImportFlow } from '@/hooks/use-import';
import { useBankAccounts } from '@/hooks/useBankAccounts';

// ============================================================================
// Types
// ============================================================================

type ImportStep = 'upload' | 'preview' | 'confirming' | 'success';

// ============================================================================
// Main Component
// ============================================================================

function ImportPage() {
	const navigate = useNavigate();

	// Local state for UI step control
	const [step, setStep] = useState<ImportStep>('upload');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [uploadedFileName, setUploadedFileName] = useState<string>('');
	const [selectedBankAccountId, setSelectedBankAccountIdLocal] = useState<string | null>(null);

	// Use the combined import flow hook
	const importFlow = useImportFlow();

	// Get user's bank accounts for selection
	const { accounts: bankAccounts, isLoading: isLoadingAccounts } = useBankAccounts();

	// Sync step with import flow status
	useEffect(() => {
		if (importFlow.isConfirmed) {
			setStep('success');
		} else if (importFlow.isReady) {
			setStep('preview');
		} else if (importFlow.isProcessing) {
			setStep('upload'); // Show loading in upload area
		}
	}, [importFlow.isConfirmed, importFlow.isReady, importFlow.isProcessing]);

	// Transform API data to component types
	const transactions: PreviewTransaction[] = useMemo(() => {
		if (!importFlow.session?.transactions) return [];

		return importFlow.session.transactions.map((t: ExtractedTransaction) => ({
			id: t.id,
			date: t.date instanceof Date ? t.date.toISOString() : String(t.date),
			description: t.description,
			amount: Number.parseFloat(t.amount),
			type: t.type as 'CREDIT' | 'DEBIT',
			category: undefined,
			isDuplicate: Boolean(t.isPossibleDuplicate),
			duplicateOf: t.duplicateReason || undefined,
			confidence: Number.parseFloat(t.confidence),
		}));
	}, [importFlow.session?.transactions]);

	// Filter duplicates for warning component
	const duplicates: DuplicateTransaction[] = useMemo(() => {
		return transactions
			.filter((t) => t.isDuplicate)
			.map((t) => ({
				id: t.id,
				date: t.date,
				description: t.description,
				amount: t.amount,
				type: t.type,
				existingId: t.duplicateOf,
				matchReason: 'Data, valor e descrição similares',
			}));
	}, [transactions]);

	// Build summary data
	const summaryData: ImportSummaryData | null = useMemo(() => {
		if (!importFlow.session) return null;

		const session = importFlow.session;
		const selectedTransactions = transactions.filter((t) => selectedIds.has(t.id));
		const duplicateCount = transactions.filter((t) => t.isDuplicate).length;

		const totals = {
			credits: transactions
				.filter((t) => t.type === 'CREDIT')
				.reduce((sum, t) => sum + t.amount, 0),
			debits: transactions
				.filter((t) => t.type === 'DEBIT')
				.reduce((sum, t) => sum + Math.abs(t.amount), 0),
			balance: 0,
		};
		totals.balance = totals.credits - totals.debits;

		const selectedTotals = {
			credits: selectedTransactions
				.filter((t) => t.type === 'CREDIT')
				.reduce((sum, t) => sum + t.amount, 0),
			debits: selectedTransactions
				.filter((t) => t.type === 'DEBIT')
				.reduce((sum, t) => sum + Math.abs(t.amount), 0),
			balance: 0,
		};
		selectedTotals.balance = selectedTotals.credits - selectedTotals.debits;

		return {
			sessionId: session.sessionId,
			fileName: uploadedFileName || session.fileName || 'arquivo.pdf',
			fileType: session.fileType || 'PDF',
			bankName: session.bankDetected || undefined,
			totalTransactions: transactions.length,
			selectedTransactions: selectedIds.size,
			duplicateTransactions: duplicateCount,
			dateRange: undefined,
			totals,
			selectedTotals,
			processingTime: session.processingTimeMs || undefined,
			confidence: session.averageConfidence
				? Number.parseFloat(session.averageConfidence)
				: undefined,
			// Status is already typed correctly from backend (matches ImportSummaryData['status'])
			status: session.status,
			errorMessage: session.errorMessage || undefined,
		};
	}, [importFlow.session, transactions, selectedIds, uploadedFileName]);

	// Initialize selection when transactions load
	useEffect(() => {
		if (transactions.length > 0 && selectedIds.size === 0) {
			// Auto-select all non-duplicate transactions
			const initialSelection = new Set(transactions.filter((t) => !t.isDuplicate).map((t) => t.id));
			setSelectedIds(initialSelection);
		}
	}, [transactions, selectedIds.size]);

	// Handlers
	const handleUpload = useCallback(
		async (file: File) => {
			setUploadedFileName(file.name);

			try {
				await importFlow.startImport(file);
				toast.success('Arquivo enviado', {
					description: 'Processando extrato bancário...',
				});
			} catch (error) {
				toast.error('Erro no upload', {
					description: error instanceof Error ? error.message : 'Falha ao enviar arquivo',
				});
			}
		},
		[importFlow],
	);

	const handleSelectionChange = useCallback((newSelectedIds: Set<string>) => {
		setSelectedIds(newSelectedIds);
	}, []);

	const handleDuplicateToggle = useCallback(
		(id: string) => {
			const newSelection = new Set(selectedIds);
			if (newSelection.has(id)) {
				newSelection.delete(id);
			} else {
				newSelection.add(id);
			}
			setSelectedIds(newSelection);
		},
		[selectedIds],
	);

	const handleSelectAllDuplicates = useCallback(() => {
		const newSelection = new Set(selectedIds);
		for (const d of duplicates) {
			newSelection.add(d.id);
		}
		setSelectedIds(newSelection);
	}, [selectedIds, duplicates]);

	const handleDeselectAllDuplicates = useCallback(() => {
		const newSelection = new Set(selectedIds);
		for (const d of duplicates) {
			newSelection.delete(d.id);
		}
		setSelectedIds(newSelection);
	}, [selectedIds, duplicates]);

	const handleConfirm = useCallback(async () => {
		if (!selectedBankAccountId) {
			toast.error('Selecione uma conta bancária', {
				description: 'Escolha a conta onde as transações serão importadas.',
			});
			return;
		}

		setStep('confirming');

		try {
			// Update selection in the import flow
			importFlow.selectBankAccount(selectedBankAccountId);

			// Sync local selection with import flow
			for (const t of transactions) {
				const shouldBeSelected = selectedIds.has(t.id);
				importFlow.toggleTransaction(t.id, shouldBeSelected);
			}

			// Confirm the import
			await importFlow.confirmSelectedTransactions();

			setStep('success');
			toast.success('Importação concluída!', {
				description: `${selectedIds.size} transações importadas com sucesso.`,
			});
		} catch (error) {
			setStep('preview');
			toast.error('Erro na importação', {
				description: error instanceof Error ? error.message : 'Falha ao confirmar importação',
			});
		}
	}, [selectedBankAccountId, selectedIds, transactions, importFlow]);

	const handleCancel = useCallback(async () => {
		try {
			await importFlow.cancelCurrentImport();
		} catch {
			// Ignore cancellation errors
		}

		setStep('upload');
		setSelectedIds(new Set());
		setUploadedFileName('');
		setSelectedBankAccountIdLocal(null);
	}, [importFlow]);

	const handleGoToTransactions = useCallback(() => {
		void navigate({ to: '/saldo' });
	}, [navigate]);

	const handleImportAnother = useCallback(() => {
		importFlow.resetImport();
		setStep('upload');
		setSelectedIds(new Set());
		setUploadedFileName('');
		setSelectedBankAccountIdLocal(null);
	}, [importFlow]);

	// ============================================================================
	// Render
	// ============================================================================

	return (
		<div className="container mx-auto space-y-6 p-4 max-w-5xl">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => void navigate({ to: '/saldo' })}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Importar Extrato</h1>
						<p className="text-muted-foreground">
							Importe transações de arquivos PDF ou CSV do seu banco
						</p>
					</div>
				</div>
			</div>

			{/* Upload Step */}
			{step === 'upload' && (
				<Card variant="glass">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5" />
							Enviar Arquivo
						</CardTitle>
						<CardDescription>
							Arraste e solte seu extrato bancário ou clique para selecionar. Suportamos PDF e CSV
							dos principais bancos brasileiros.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FileUploadZone
							onFileSelect={handleUpload}
							isUploading={importFlow.isUploading}
							progress={importFlow.uploadProgress}
						/>
						{importFlow.isProcessing && (
							<div className="flex items-center justify-center py-8 gap-3">
								<Loader2 className="h-6 w-6 animate-spin text-primary" />
								<span className="text-muted-foreground">Processando extrato...</span>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Preview Step */}
			{step === 'preview' && (
				<div className="space-y-6">
					{importFlow.isLoading ? (
						<Card variant="glass">
							<CardContent className="flex items-center justify-center py-12">
								<div className="flex flex-col items-center gap-4">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
									<p className="text-muted-foreground">Extraindo transações...</p>
								</div>
							</CardContent>
						</Card>
					) : (
						<>
							{/* Summary */}
							{summaryData && <ImportSummary data={summaryData} />}

							{/* Bank Account Selection */}
							<Card variant="glass">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Building2 className="h-5 w-5" />
										Conta Bancária de Destino
									</CardTitle>
									<CardDescription>
										Selecione a conta onde as transações serão importadas
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<Label htmlFor="bank-account-select">Conta Bancária</Label>
										{isLoadingAccounts ? (
											<div className="flex items-center gap-2 text-muted-foreground">
												<Loader2 className="h-4 w-4 animate-spin" />
												<span>Carregando contas...</span>
											</div>
										) : bankAccounts.length === 0 ? (
											<div className="text-sm text-muted-foreground">
												Nenhuma conta bancária cadastrada.{' '}
												<Button
													variant="link"
													className="h-auto p-0"
													onClick={() => void navigate({ to: '/saldo' })}
												>
													Cadastre uma conta
												</Button>{' '}
												antes de importar.
											</div>
										) : (
											<Select
												value={selectedBankAccountId ?? ''}
												onValueChange={(value) => setSelectedBankAccountIdLocal(value || null)}
											>
												<SelectTrigger id="bank-account-select" className="w-full">
													<SelectValue placeholder="Selecione uma conta bancária" />
												</SelectTrigger>
												<SelectContent>
													{bankAccounts.map((account) => (
														<SelectItem key={account.id} value={account.id}>
															{account.institutionName}
															{account.accountMask && ` (${account.accountMask})`}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Duplicate Warning */}
							{duplicates.length > 0 && (
								<DuplicateWarning
									duplicates={duplicates}
									selectedIds={selectedIds}
									onToggleSelection={handleDuplicateToggle}
									onSelectAll={handleSelectAllDuplicates}
									onDeselectAll={handleDeselectAllDuplicates}
								/>
							)}

							{/* Transaction Preview */}
							<Card variant="glass">
								<CardHeader>
									<CardTitle>Transações Extraídas</CardTitle>
									<CardDescription>
										Revise e selecione as transações que deseja importar
									</CardDescription>
								</CardHeader>
								<CardContent>
									<TransactionPreview
										transactions={transactions}
										selectedIds={selectedIds}
										onSelectionChange={handleSelectionChange}
									/>
								</CardContent>
							</Card>

							{/* Action Buttons */}
							<div className="flex items-center justify-between pt-4">
								<Button variant="outline" onClick={handleCancel}>
									<X className="h-4 w-4 mr-2" />
									Cancelar
								</Button>
								<Button
									onClick={handleConfirm}
									disabled={selectedIds.size === 0 || !selectedBankAccountId}
									className="gap-2"
								>
									<CheckCircle className="h-4 w-4" />
									Importar {selectedIds.size} Transações
								</Button>
							</div>
						</>
					)}
				</div>
			)}

			{/* Confirming Step */}
			{step === 'confirming' && (
				<Card variant="glass">
					<CardContent className="flex items-center justify-center py-12">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<p className="text-muted-foreground">Importando transações...</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Success Step */}
			{step === 'success' && (
				<Card variant="glass">
					<CardContent className="flex items-center justify-center py-12">
						<div className="flex flex-col items-center gap-6 text-center">
							<div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
								<CheckCircle className="h-8 w-8 text-green-600" />
							</div>
							<div>
								<h2 className="text-xl font-semibold mb-2">Importação Concluída!</h2>
								<p className="text-muted-foreground">
									{selectedIds.size} transações foram importadas com sucesso.
								</p>
							</div>
							<div className="flex items-center gap-4">
								<Button variant="outline" onClick={handleImportAnother}>
									Importar Outro Arquivo
								</Button>
								<Button onClick={handleGoToTransactions}>Ver Transações</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export const Route = createLazyFileRoute('/import')({
	component: ImportPage,
});
