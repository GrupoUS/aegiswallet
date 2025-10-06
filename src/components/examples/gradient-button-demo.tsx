import { Download, Heart, Mic, Send, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function GradientButtonDemo() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Gradient Button Showcase
        </h1>
        <p className="text-muted-foreground">
          Demonstração do componente Button com efeito de gradiente animado
        </p>
      </div>

      {/* Regular Buttons vs Gradient Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação: Regular vs Gradient</CardTitle>
          <CardDescription>
            Veja a diferença entre botões normais e com efeito de gradiente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Botões Regulares</h3>
            <div className="flex flex-wrap gap-4">
              <Button>Default Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="destructive">Destructive Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Botões com Gradiente</h3>
            <div className="flex flex-wrap gap-4">
              <Button withGradient>Default Button</Button>
              <Button withGradient variant="outline">
                Outline Button
              </Button>
              <Button withGradient variant="secondary">
                Secondary Button
              </Button>
              <Button withGradient variant="destructive">
                Destructive Button
              </Button>
              <Button withGradient variant="ghost">
                Ghost Button
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Sizes with Gradient */}
      <Card>
        <CardHeader>
          <CardTitle>Tamanhos de Botão</CardTitle>
          <CardDescription>Todos os tamanhos funcionam com o efeito de gradiente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Button withGradient size="sm">
              Small
            </Button>
            <Button withGradient size="default">
              Default
            </Button>
            <Button withGradient size="lg">
              Large
            </Button>
            <Button withGradient size="icon">
              <Heart />
            </Button>
            <Button withGradient size="icon-sm">
              <Settings />
            </Button>
            <Button withGradient size="icon-lg">
              <Mic />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Buttons with Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Botões com Ícones</CardTitle>
          <CardDescription>
            Ícones funcionam perfeitamente com o efeito de gradiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button withGradient>
              <Mic />
              Comando de Voz
            </Button>
            <Button withGradient variant="outline">
              <Download />
              Download
            </Button>
            <Button withGradient variant="secondary">
              <Send />
              Enviar
            </Button>
            <Button withGradient variant="destructive">
              <Trash2 />
              Deletar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Gradient Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Personalizadas</CardTitle>
          <CardDescription>Ajuste a duração da animação e o tamanho do gradiente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Animação Rápida (0.5s)</p>
              <Button withGradient gradientDuration={0.5}>
                Fast Animation
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Animação Normal (1s - padrão)</p>
              <Button withGradient gradientDuration={1}>
                Normal Animation
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Animação Lenta (2s)</p>
              <Button withGradient gradientDuration={2}>
                Slow Animation
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Gradiente Pequeno (400px)</p>
              <Button withGradient gradientSize={400}>
                Small Gradient
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Gradiente Grande (1000px)</p>
              <Button withGradient gradientSize={1000}>
                Large Gradient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disabled State */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Desabilitado</CardTitle>
          <CardDescription>Botões desabilitados não mostram o efeito de gradiente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button withGradient disabled>
              Disabled Button
            </Button>
            <Button withGradient variant="outline" disabled>
              Disabled Outline
            </Button>
            <Button withGradient variant="secondary" disabled>
              Disabled Secondary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-World Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos do Mundo Real</CardTitle>
          <CardDescription>Como usar em cenários reais da aplicação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Ações Primárias</h3>
            <div className="flex gap-4">
              <Button withGradient size="lg" className="flex-1">
                <Mic />
                Iniciar Comando de Voz
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Formulário de Ação</h3>
            <div className="flex gap-2">
              <Button withGradient>Salvar</Button>
              <Button variant="outline">Cancelar</Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Navegação</h3>
            <div className="flex flex-wrap gap-2">
              <Button withGradient variant="outline" size="sm">
                Todas
              </Button>
              <Button variant="outline" size="sm">
                Pendentes
              </Button>
              <Button variant="outline" size="sm">
                Pagas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
