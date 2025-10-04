import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-foreground">AegisWallet</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Bem-vindo ao Dashboard! 🎉
          </h2>
          <p className="text-muted-foreground">
            Você está autenticado com sucesso. Esta é sua área protegida.
          </p>
        </div>
      </main>
    </div>
  );
}
