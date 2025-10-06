"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface LoginFormProps {
  onSubmit?: (
    email: string,
    password: string,
    isSignUp: boolean
  ) => Promise<{ error?: { message: string } }>
  onGoogleSignIn?: () => Promise<void>
  loading?: boolean
  error?: string
  className?: string
}

export function LoginForm({
  className,
  onSubmit,
  onGoogleSignIn,
  loading: externalLoading,
  error: externalError
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [internalLoading, setInternalLoading] = useState(false)
  const [internalError, setInternalError] = useState('')

  const loading = externalLoading ?? internalLoading
  const error = externalError ?? internalError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInternalError('')

    if (!onSubmit) return

    setInternalLoading(true)
    try {
      const result = await onSubmit(email, password, isSignUp)
      if (result?.error) {
        setInternalError(result.error.message)
      } else if (isSignUp) {
        setInternalError('Verifique seu email para confirmar o cadastro!')
      }
    } catch {
      setInternalError('Erro ao processar sua solicitação')
    } finally {
      setInternalLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!onGoogleSignIn) return

    setInternalError('')
    setInternalLoading(true)
    try {
      await onGoogleSignIn()
    } catch {
      setInternalError('Erro ao fazer login com Google')
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card className="border/50 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp
              ? 'Preencha os dados para criar sua conta'
              : 'Entre com suas credenciais para acessar sua conta'}
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
          <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="transition-all"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="ml-auto inline-block text-sm text-primary underline-offset-4 hover:underline transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="transition-all"
                />
              </div>

          {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm animate-in fade-in-50 slide-in-from-top-1">
                  {error}
                </div>
              )}

          <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 transition-all"
              >
                {loading ? 'Processando...' : isSignUp ? 'Cadastrar' : 'Entrar'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">Ou continue com</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full transition-all hover:bg-accent"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </div>
            <div className="mt-6 text-center">
              <Button
                variant="link"
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setInternalError('')
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}