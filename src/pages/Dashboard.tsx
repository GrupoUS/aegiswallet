import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-foreground">AegisWallet</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="destructive" onClick={signOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Bem-vindo ao Dashboard! 🎉</CardTitle>
            <CardDescription>
              Você está autenticado com sucesso. Esta é sua área protegida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Comece a construir suas funcionalidades aqui.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
