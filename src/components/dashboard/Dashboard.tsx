
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogOut, Plus, List, Bell, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FinancialSummary from "./FinancialSummary";
import TransactionsList from "@/components/transactions/TransactionsList";
import AddTransactionDialog from "@/components/transactions/AddTransactionDialog";
import BillRemindersList from "@/components/reminders/BillRemindersList";
import AddBillReminderDialog from "@/components/reminders/AddBillReminderDialog";
import CategoriesManagement from "@/components/categories/CategoriesManagement";
import BankConnectionsPage from "@/components/bank-connections/BankConnectionsPage";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const refreshData = () => {
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <FinancialSummary />;
      case "transactions":
        return <TransactionsList />;
      case "reminders":
        return <BillRemindersList />;
      case "categories":
        return <CategoriesManagement />;
      case "bank-connections":
        return <BankConnectionsPage />;
      default:
        return <FinancialSummary />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                AegisWallet
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Olá, {user?.user_metadata?.full_name || user?.email}
              </span>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "transactions"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Transações
            </button>
            <button
              onClick={() => setActiveTab("bank-connections")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "bank-connections"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Contas Bancárias
            </button>
            <button
              onClick={() => setActiveTab("reminders")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "reminders"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Lembretes
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "categories"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Categorias
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            {activeTab === "transactions" && (
              <Button onClick={() => setShowAddTransaction(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            )}
            {activeTab === "reminders" && (
              <Button onClick={() => setShowAddReminder(true)}>
                <Bell className="h-4 w-4 mr-2" />
                Novo Lembrete
              </Button>
            )}
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      </main>

      {/* Dialogs */}
      <AddTransactionDialog 
        open={showAddTransaction} 
        onOpenChange={setShowAddTransaction} 
      />
      <AddBillReminderDialog 
        open={showAddReminder} 
        onOpenChange={setShowAddReminder}
        onSuccess={refreshData}
      />
    </div>
  );
};

export default Dashboard;
