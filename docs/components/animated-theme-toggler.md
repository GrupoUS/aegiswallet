# Animated Theme Toggler

Componente de alternância de tema com animação suave usando View Transition API.

## Características

- ✨ **Animação Elegante**: Efeito de círculo expandindo do botão usando View Transition API
- 🔄 **Integração Total**: Funciona perfeitamente com nosso ThemeProvider
- 🌓 **Suporte ao Modo System**: Detecta e respeita preferência do sistema operacional
- 🌐 **Compatibilidade Universal**: Fallback gracioso para browsers sem suporte à View Transition API
- ♿ **Acessível**: Labels e estados de foco apropriados

## Compatibilidade de Browsers

| Browser | Versão | Animação | Funcionalidade |
|---------|--------|----------|----------------|
| Chrome  | 111+   | ✅ Sim   | ✅ Completa    |
| Edge    | 111+   | ✅ Sim   | ✅ Completa    |
| Safari  | 18+    | ✅ Sim   | ✅ Completa    |
| Firefox | Todas  | ❌ Não   | ✅ Completa    |
| Outros  | -      | ❌ Não   | ✅ Completa    |

> **Nota**: Em browsers sem suporte à View Transition API, o componente funciona normalmente mas sem a animação circular.

## Instalação

O componente já está instalado em:
```
src/components/ui/animated-theme-toggler.tsx
```

## Uso Básico

```tsx
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

export function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>AegisWallet</h1>
      <AnimatedThemeToggler />
    </header>
  )
}
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `className` | `string` | `undefined` | Classes CSS adicionais |
| `duration` | `number` | `400` | Duração da animação em milissegundos |
| `...props` | `ButtonHTMLAttributes` | - | Demais props de botão HTML |

## Exemplos

### Com Duração Customizada

```tsx
<AnimatedThemeToggler duration={600} />
```

### Com Estilo Personalizado

```tsx
<AnimatedThemeToggler 
  className="bg-primary text-primary-foreground"
  duration={300}
/>
```

### Em Navbar com Outros Componentes

```tsx
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="flex items-center gap-4 p-4">
      <div className="flex-1">
        <h1>AegisWallet</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost">Transações</Button>
        <Button variant="ghost">Dashboard</Button>
        <AnimatedThemeToggler />
      </div>
    </nav>
  )
}
```

## Comportamento

### Modo Light/Dark
- **Click**: Alterna entre light e dark
- **Visual**: Mostra ícone de sol no dark mode, lua no light mode

### Modo System
- **Automático**: Detecta preferência do sistema operacional
- **Dinâmico**: Atualiza automaticamente quando usuário muda tema do OS
- **Click**: Alterna para light ou dark (saindo do modo system)

### Animação
- **Com Suporte**: Animação circular se expande do centro do botão
- **Sem Suporte**: Mudança instantânea de tema (fallback)
- **Performance**: 400ms de duração padrão para UX suave

## Comparação com ModeToggle

| Aspecto | AnimatedThemeToggler | ModeToggle (Dropdown) |
|---------|---------------------|----------------------|
| **UI** | Botão direto | Menu dropdown |
| **Animação** | ✨ Circular expand | Básica |
| **Opções** | Light ↔ Dark | Light/Dark/System |
| **Cliques** | 1 click | 2 clicks |
| **Visual** | Moderno | Clássico |
| **Uso Recomendado** | Header/Navbar principal | Settings/Preferências |

## Integração com ThemeProvider

O componente usa nosso `ThemeProvider` existente:

```tsx
// App.tsx (já configurado)
import { ThemeProvider } from "@/components/providers/ThemeProvider"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aegiswallet-theme">
      {/* Seus componentes */}
    </ThemeProvider>
  )
}
```

## Acessibilidade

- ✅ `aria-label`: "Alternar tema"
- ✅ Indicador visual de foco (focus ring)
- ✅ Navegação por teclado (Enter/Space)
- ✅ Estados disabled
- ✅ Transições suaves

## Créditos

- **Magic UI**: Componente base e animação
- **AegisWallet**: Integração com ThemeProvider e suporte a modo system

## Troubleshooting

### Animação não funciona
- Verifique se está usando Chrome 111+, Edge 111+ ou Safari 18+
- Em Firefox, o componente funciona mas sem animação (comportamento esperado)

### Tema não persiste
- Verifique se `ThemeProvider` está no root do App.tsx
- Confirme que `storageKey` está configurado

### Conflito com ModeToggle
- Ambos podem coexistir - usam o mesmo ThemeProvider
- Use `AnimatedThemeToggler` para UX principal
- Use `ModeToggle` em páginas de configuração se precisar dropdown

## Roadmap

- [ ] Adicionar variante com 3 estados (light/dark/system)
- [ ] Suportar diferentes animações (fade, slide, etc)
- [ ] Adicionar tooltip ao hover
