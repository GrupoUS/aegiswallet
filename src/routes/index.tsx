import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const IndexRoute = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            AegisWallet
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Assistente Financeiro Autônomo
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="text-lg px-8 py-6">
              Acessar Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Dashboard</CardTitle>
              <CardDescription>
                Visão completa das suas finanças em um só lugar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl mb-4">📊</div>
              <p className="text-sm text-gray-600">
                Saldo, transações e investimentos em tempo real
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Segurança</CardTitle>
              <CardDescription>
                Proteção de nível bancário para seus dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl mb-4">🔒</div>
              <p className="text-sm text-gray-600">
                Criptografia e autenticação avançada
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Inteligência</CardTitle>
              <CardDescription>
                Insights personalizados para suas finanças
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl mb-4">🤖</div>
              <p className="text-sm text-gray-600">
                Análise automática e recomendações inteligentes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export { IndexRoute }