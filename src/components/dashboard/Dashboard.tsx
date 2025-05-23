
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, 
  CreditCard, 
  Calendar, 
  Settings,
  LogOut,
  Plus
} from "lucide-react";
import FinancialSummary from "./FinancialSummary";
import TransactionsList from "@/components/transactions/TransactionsList";
import AddTransactionDialog from "@/components/transactions/AddTransactionDialog";
import BillRemindersList from "@/components/reminders/BillRemindersList";
import CategoriesManagement from "@/components/categories/CategoriesManagement";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "transactions", label: "Transações", icon: CreditCard },
    { id: "reminders", label: "Lembretes", icon: Calendar },
    { id: "categories", label: "Categorias", icon: Settings },
  ];

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
      default:
        return <FinancialSummary />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">AegisWallet</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowAddTransaction(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {renderContent()}
          </main>
        </div>
      </div>

      <AddTransactionDialog
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
      />
    </div>
  );
};

export default Dashboard;
