import { Link } from "@tanstack/react-router";
import {
  LineChart,
  Mic,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { FinancialAmount } from "@/components/financial-amount";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBankAccounts, useTotalBalance } from "@/hooks/useBankAccounts";
import { useFinancialEvents } from "@/hooks/useFinancialEvents";
import { BalanceChart } from "./components/BalanceChart";
import { QuickActionModal } from "./components/QuickActionModal";
import { StatisticsCards } from "./components/StatisticsCards";
import type { Database } from "@/types/database.types";

const TransactionForm = lazy(() => import("./components/TransactionForm"));
const TransactionsList = lazy(() => import("./components/TransactionsList"));

function TransactionFormLoader() {
  return (
    <Card
      className="border-primary/20 transition-all duration-300 hover:shadow-lg"
      variant="glass"
    >
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
        <div className="text-muted-foreground text-sm">
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid-col-1 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function Saldo() {
  const [isListening, setIsListening] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [quickActionType, setQuickActionType] = useState<
    "transfer" | "deposit" | "withdraw" | null
  >(null);

  const handleVoiceCommand = () => {
    setIsListening(!isListening);
    // Voice command logic to be implemented
  };

  const { statistics, loading: statsLoading } = useFinancialEvents();
  const { accounts, isLoading: accountsLoading } = useBankAccounts();
  const { totalBRL, isLoading: balanceLoading } = useTotalBalance();

  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* Header with Voice Command */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-linear-to-r from-primary to-accent bg-clip-text font-bold text-3xl text-transparent">
            Saldo
          </h1>
          <p className="text-muted-foreground">Visão geral das suas contas</p>
        </div>
        <Button
          onClick={handleVoiceCommand}
          variant={isListening ? "default" : "outline"}
          size="lg"
          className="gap-2"
          withGradient
        >
          <Mic className={isListening ? "animate-pulse" : ""} />
          {isListening ? "Ouvindo..." : "Qual é meu saldo?"}
        </Button>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards statistics={statistics} loading={statsLoading} />

      {/* Total Balance Card */}
      <Card
        className="cursor-pointer border-2 border-primary/20 bg-linear-to-br from-background to-primary/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
        variant="glass-hover"
      >
        <CardHeader>
          <CardDescription>Saldo Total (Contas)</CardDescription>
          <CardTitle className="text-4xl">
            {balanceLoading ? (
              <Skeleton className="h-10 w-48" />
            ) : (
              <FinancialAmount amount={totalBRL} currency="BRL" size="xl" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Wallet className="h-4 w-4 text-primary" />
            <span>Todas as contas conectadas</span>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-2xl">Contas</h2>
            <Link to="/contas-bancarias">
                <Button variant="ghost" size="sm">Gerenciar Contas</Button>
            </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {accountsLoading
            ? [1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))
            : accounts.map(
                (
                  account: Database["public"]["Tables"]["bank_accounts"]["Row"],
                ) => {
                  let Icon = Wallet;
                  let color = "text-primary";
                  if (
                    account.account_type === "poupanca" ||
                    account.account_type === "savings"
                  ) {
                    Icon = PiggyBank;
                    color = "text-accent";
                  }
                  if (
                    account.account_type === "investimento" ||
                    account.account_type === "investment"
                  ) {
                    Icon = LineChart;
                    color = "text-secondary";
                  }

                  return (
                    <Card
                      key={account.id}
                      className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-xl"
                      variant="glass-hover"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardDescription>
                            {account.institution_name}
                          </CardDescription>
                          <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <FinancialAmount
                          amount={account.balance}
                          currency={account.currency || "BRL"}
                          size="lg"
                        />
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {account.account_type}
                        </p>
                      </CardContent>
                    </Card>
                  );
                },
              )}
        </div>
      </div>

      {/* Balance History Chart */}
      <BalanceChart />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Button
          variant="outline"
          size="lg"
          className="h-auto py-4"
          onClick={() => setQuickActionType("transfer")}
        >
          <div className="w-full text-center">
            <TrendingUp className="mx-auto mb-2 h-6 w-6" />
            <p className="font-semibold">Transferir</p>
            <p className="text-muted-foreground text-xs">Entre contas</p>
          </div>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-auto py-4"
          onClick={() => setQuickActionType("deposit")}
        >
          <div className="w-full text-center">
            <Wallet className="mx-auto mb-2 h-6 w-6" />
            <p className="font-semibold">Depositar</p>
            <p className="text-muted-foreground text-xs">Adicionar fundos</p>
          </div>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-auto py-4"
          onClick={() => setQuickActionType("withdraw")}
        >
          <div className="w-full text-center">
            <TrendingDown className="mx-auto mb-2 h-6 w-6" />
            <p className="font-semibold">Sacar</p>
            <p className="text-muted-foreground text-xs">Retirar dinheiro</p>
          </div>
        </Button>
      </div>

      {/* Transactions Management Section */}
      <div className="border/50 space-y-6 border-t-2 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-2xl">Gerenciar Transações</h2>
            <p className="text-muted-foreground">
              Adicione e visualize todas as suas transações
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            withGradient
          >
            {showCreateForm ? "Cancelar" : "Nova Transação"}
          </Button>
        </div>

        {/* Create Transaction Form */}
        {showCreateForm && (
          <Suspense fallback={<TransactionFormLoader />}>
            <TransactionForm
              onCancel={() => setShowCreateForm(false)}
              onSuccess={() => setShowCreateForm(false)}
            />
          </Suspense>
        )}

        {/* All Transactions List */}
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <TransactionsList />
        </Suspense>
      </div>

      {/* Quick Action Modal */}
      {quickActionType && (
        <QuickActionModal
          isOpen={!!quickActionType}
          onClose={() => setQuickActionType(null)}
          actionType={quickActionType}
        />
      )}
    </div>
  );
}
