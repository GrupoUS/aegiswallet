import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LoginForm } from '@/components/login-form'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || '/dashboard',
    error: (search.error as string) || undefined,
  }),
  component: LoginComponent,
})

function LoginComponent() {
  const { signIn, signUp, signInWithGoogle, isAuthenticated } = useAuth()
  const { redirect: redirectPath, error: searchError } = Route.useSearch()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: redirectPath })
    }
  }, [isAuthenticated, navigate, redirectPath])

  const handleSubmit = async (email: string, password: string, isSignUp: boolean) => {
    const result = isSignUp ? await signUp(email, password) : await signIn(email, password)

    if (!result.error && !isSignUp) {
      // Navigate to redirect URL after successful login
      navigate({ to: redirectPath })
    }

    // Convert AuthError to expected format
    return {
      error: result.error ? { message: result.error.message } : undefined,
    }
  }

  const handleGoogleSignIn = async () => {
    await signInWithGoogle()
    // Navigation will be handled by AuthContext after successful sign in
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* AegisWallet Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            AegisWallet
          </h1>
          <p className="text-muted-foreground text-lg">Seu assistente financeiro inteligente</p>
        </div>

        {/* Error Message */}
        {searchError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
            <p className="text-sm font-medium">Erro de autenticação</p>
            <p className="text-sm">{searchError}</p>
          </div>
        )}

        {/* Login Form */}
        <LoginForm onSubmit={handleSubmit} onGoogleSignIn={handleGoogleSignIn} />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Protegido por criptografia de ponta a ponta</p>
          <p className="mt-1">🔒 Seus dados estão seguros</p>
        </div>
      </div>
    </div>
  )
}
