
'use client'; // Adicionado

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogOut, Plus, Bell, Crown, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { AccessLevelProvider } from "@/hooks/useAccessLevel";
import FinancialSummary from "./FinancialSummary";
import TransactionsList from "@/components/transactions/TransactionsList";
import AddTransactionDialog from "@/components/transactions/AddTransactionDialog";
import BillRemindersList from "@/components/reminders/BillRemindersList";
import AddBillReminderDialog from "@/components/reminders/AddBillReminderDialog";
import CategoriesManagement from "@/components/categories/CategoriesManagement";
import BankConnectionsPage from "@/components/bank-connections/BankConnectionsPage";
import SubscriptionPage from "@/components/subscription/SubscriptionPage";
// import News from "@/pages/News"; // Comentado - News feature not in MVP and path is invalid
import ChatSidePanel from "@/components/ai-chat/ChatSidePanel";
import AIAssistantFAB from "@/components/ai-chat/AIAssistantFAB";
import TrialBanner from "@/components/subscription/TrialBanner";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  const toggleChatPanel = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "transactions", label: "Transações" },
    { id: "bank-connections", label: "Contas Bancárias" },
    { id: "reminders", label: "Lembretes" },
    { id: "categories", label: "Categorias" },
    { id: "subscription", label: "Assinatura", icon: Crown },
    // { id: "news", label: "Notícias" } // Comentado - News feature not in MVP
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
      case "bank-connections":
        return <BankConnectionsPage />;
      case "subscription":
        return <SubscriptionPage />;
      // case "news": // Comentado - News feature not in MVP
      //   return <News />;
      default:
        return <FinancialSummary />;
    }
  };

  return (
    <SubscriptionProvider user={user}>
      <AccessLevelProvider user={user}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
          {/* Main Application Area */}
          <div 
            className={`flex-1 transition-all duration-300 ease-in-out ${
              isChatPanelOpen ? 'sm:w-2/3' : 'w-full'
            }`}
          >
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 sm:h-16">
                  <div className="flex items-center">
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                      AegisWallet
                    </h1>
                  </div>
                  
                  {/* Desktop Header Actions */}
                  <div className="hidden sm:flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-32 lg:max-w-none">
                      Olá, {user?.user_metadata?.full_name || user?.email}
                    </span>
                    <ThemeToggle />
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      <span className="hidden lg:inline">Sair</span>
                    </Button>
                  </div>

                  {/* Mobile Header Actions */}
                  <div className="flex sm:hidden items-center space-x-2">
                    <ThemeToggle />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                  <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 py-2">
                    <div className="flex flex-col space-y-2">
                      <div className="px-2 py-1 text-sm text-gray-600 dark:text-gray-300 truncate">
                        {user?.user_metadata?.full_name || user?.email}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSignOut}
                        className="mx-2"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Desktop Navigation */}
                <div className="hidden md:flex space-x-8">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                          activeTab === item.id
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* Mobile Navigation - Scrollable */}
                <div className="md:hidden overflow-x-auto">
                  <div className="flex space-x-6 py-2 min-w-max">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`py-2 px-3 border-b-2 font-medium text-sm flex items-center gap-1 whitespace-nowrap ${
                            activeTab === item.id
                              ? "border-blue-500 text-blue-600 dark:text-blue-400"
                              : "border-transparent text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
              <div className="sm:px-0">
                {/* Trial Banner */}
                <TrialBanner />

                {/* Action Buttons */}
                <div className="mb-4 sm:mb-6 flex flex-wrap gap-3">
                  {activeTab === "transactions" && (
                    <Button onClick={() => setShowAddTransaction(true)} size="sm" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Transação
                    </Button>
                  )}
                  {activeTab === "reminders" && (
                    <Button onClick={() => setShowAddReminder(true)} size="sm" className="w-full sm:w-auto">
                      <Bell className="h-4 w-4 mr-2" />
                      Novo Lembrete
                    </Button>
                  )}
                </div>

                {/* Content */}
                {renderContent()}
              </div>
            </main>
          </div>

          {/* Chat Side Panel */}
          <ChatSidePanel 
            isOpen={isChatPanelOpen} 
            onClose={() => setIsChatPanelOpen(false)} 
          />

          {/* Floating Action Button for AI Chat - Only show when panel is closed */}
          {!isChatPanelOpen && (
            <AIAssistantFAB onToggleChat={toggleChatPanel} />
          )}

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
      </AccessLevelProvider>
    </SubscriptionProvider>
  );
};

export default Dashboard;
