/**
 * Transaction Domain Model
 * Business logic and validation for Transaction entity
 */

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  TRANSFER = 'transfer',
  PIX = 'pix',
  BOLETO = 'boleto',
}

export enum TransactionStatus {
  PENDING = 'pending',
  POSTED = 'posted',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface TransactionCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface BankAccount {
  id: string;
  institutionName: string;
  accountMask: string;
}

export interface TransactionData {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  transactionDate: Date;
  status: TransactionStatus;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  bankAccount?: BankAccount;
  category?: TransactionCategory;
}

export interface TransactionCreationData {
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  transactionDate: Date;
  tags?: string[];
}

export interface TransactionUpdateData {
  categoryId?: string;
  description?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Transaction Domain Model Class
 */
export class Transaction {
  constructor(private readonly data: TransactionData) {}

  // Getters
  get id(): string {
    return this.data.id;
  }

  get userId(): string {
    return this.data.userId;
  }

  get accountId(): string {
    return this.data.accountId;
  }

  get categoryId(): string | undefined {
    return this.data.categoryId;
  }

  get type(): TransactionType {
    return this.data.type;
  }

  get amount(): number {
    return this.data.amount;
  }

  get description(): string {
    return this.data.description;
  }

  get notes(): string | undefined {
    return this.data.notes;
  }

  get transactionDate(): Date {
    return this.data.transactionDate;
  }

  get status(): TransactionStatus {
    return this.data.status;
  }

  get tags(): string[] {
    return this.data.tags || [];
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get bankAccount(): BankAccount | undefined {
    return this.data.bankAccount;
  }

  get category(): TransactionCategory | undefined {
    return this.data.category;
  }

  // Business logic methods
  get isIncome(): boolean {
    return this.data.type === TransactionType.CREDIT;
  }

  get isExpense(): boolean {
    return [TransactionType.DEBIT, TransactionType.PIX, TransactionType.TRANSFER].includes(
      this.data.type
    );
  }

  get isPending(): boolean {
    return this.data.status === TransactionStatus.PENDING;
  }

  get isPosted(): boolean {
    return this.data.status === TransactionStatus.POSTED;
  }

  get isFailed(): boolean {
    return this.data.status === TransactionStatus.FAILED;
  }

  get canEdit(): boolean {
    return this.data.status === TransactionStatus.PENDING;
  }

  get canDelete(): boolean {
    return this.data.status === TransactionStatus.PENDING;
  }

  get formattedAmount(): string {
    return new Intl.NumberFormat('pt-BR', {
      currency: 'BRL',
      style: 'currency',
    }).format(this.data.amount);
  }

  get formattedDate(): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(this.data.transactionDate);
  }

  get isRecent(): boolean {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.data.transactionDate >= sevenDaysAgo;
  }

  get daysAgo(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.data.transactionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Validation methods
  isValidAmount(): boolean {
    return this.data.amount > 0 && this.data.amount <= 1000000; // Max 1M for safety
  }

  isValidDescription(): boolean {
    return this.data.description.trim().length > 0 && this.data.description.length <= 255;
  }

  hasValidCategory(): boolean {
    return !this.data.categoryId || this.data.category !== undefined;
  }

  // Business rules
  canUserModify(userId: string): boolean {
    return this.data.userId === userId && this.canEdit;
  }

  canUserDelete(userId: string): boolean {
    return this.data.userId === userId && this.canDelete;
  }

  isHighValueTransaction(threshold: number = 10000): boolean {
    return this.data.amount > threshold;
  }

  requiresAdditionalVerification(): boolean {
    return this.isHighValueTransaction() || this.data.type === TransactionType.TRANSFER;
  }

  // Factory methods
  static create(data: TransactionCreationData, userId: string): Transaction {
    const now = new Date();
    const transactionData: TransactionData = {
      id: crypto.randomUUID(),
      userId,
      ...data,
      status: TransactionStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    return new Transaction(transactionData);
  }

  static fromDatabase(data: {
    id: string;
    user_id: string;
    account_id: string;
    category_id?: string;
    type: TransactionType;
    amount: number;
    description: string;
    notes?: string;
    transaction_date: string | Date;
    status: TransactionStatus;
    tags?: string[];
    created_at: string | Date;
    updated_at: string | Date;
    bank_accounts?: BankAccount;
    transaction_categories?: TransactionCategory;
  }): Transaction {
    return new Transaction({
      accountId: data.account_id,
      amount: data.amount,
      bankAccount: data.bank_accounts,
      category: data.transaction_categories,
      categoryId: data.category_id,
      createdAt: new Date(data.created_at),
      description: data.description,
      id: data.id,
      notes: data.notes,
      status: data.status,
      tags: data.tags,
      transactionDate: new Date(data.transaction_date),
      type: data.type,
      updatedAt: new Date(data.updated_at),
      userId: data.user_id,
    });
  }

  toJSON(): TransactionData {
    return { ...this.data };
  }

  update(data: TransactionUpdateData): Transaction {
    const updatedData: TransactionData = {
      ...this.data,
      ...data,
      updatedAt: new Date(),
    };

    return new Transaction(updatedData);
  }

  markAsPosted(): Transaction {
    const updatedData: TransactionData = {
      ...this.data,
      status: TransactionStatus.POSTED,
      updatedAt: new Date(),
    };

    return new Transaction(updatedData);
  }

  markAsFailed(reason?: string): Transaction {
    const updatedData: TransactionData = {
      ...this.data,
      status: TransactionStatus.FAILED,
      notes: reason || this.data.notes,
      updatedAt: new Date(),
    };

    return new Transaction(updatedData);
  }

  cancel(): Transaction {
    if (!this.canEdit) {
      throw new Error('Cannot cancel transaction: not in pending status');
    }

    const updatedData: TransactionData = {
      ...this.data,
      status: TransactionStatus.CANCELLED,
      updatedAt: new Date(),
    };

    return new Transaction(updatedData);
  }

  // Static methods for queries
  static filterByType(transactions: Transaction[], type: TransactionType): Transaction[] {
    return transactions.filter((t) => t.type === type);
  }

  static filterByStatus(transactions: Transaction[], status: TransactionStatus): Transaction[] {
    return transactions.filter((t) => t.status === status);
  }

  static filterByDateRange(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): Transaction[] {
    return transactions.filter(
      (t) => t.transactionDate >= startDate && t.transactionDate <= endDate
    );
  }

  static totalByType(transactions: Transaction[], type: TransactionType): number {
    return transactions
      .filter((t) => t.type === type && t.status === TransactionStatus.POSTED)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  static getTotalIncome(transactions: Transaction[]): number {
    return Transaction.totalByType(transactions, TransactionType.CREDIT);
  }

  static getTotalExpenses(transactions: Transaction[]): number {
    const expenseTypes = [TransactionType.DEBIT, TransactionType.PIX, TransactionType.TRANSFER];
    return transactions
      .filter((t) => expenseTypes.includes(t.type) && t.status === TransactionStatus.POSTED)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  static getBalance(transactions: Transaction[]): number {
    return Transaction.getTotalIncome(transactions) - Transaction.getTotalExpenses(transactions);
  }
}

/**
 * Transaction Repository Interface
 */
export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      categoryId?: string;
      accountId?: string;
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ): Promise<{ transactions: Transaction[]; totalCount: number }>;
  create(transaction: Transaction): Promise<Transaction>;
  update(transaction: Transaction): Promise<Transaction>;
  delete(id: string): Promise<void>;
  findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    options?: { limit?: number; offset?: number }
  ): Promise<{ transactions: Transaction[]; totalCount: number }>;
  getStatistics(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<{
    income: number;
    expenses: number;
    balance: number;
    transactionCount: number;
    averageTransaction: number;
  }>;
}
