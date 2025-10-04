# Screen Designs & User Flows - Assistente Financeiro Autônomo

## Navigation Architecture

### Voice-First Navigation Hierarchy
```
Home (Voice Interface) 
├── Voice Activation (Always Primary)
├── AI Status Display
├── Quick Insights
└── Emergency Menu (Visual Only)
```

### Visual-Only Navigation (Emergency Mode)
```
Dashboard
├── Balance Overview
├── Recent Transactions
├── Scheduled Payments
├── Quick Actions
└── Settings
└── Emergency Contact
```

## Screen 1: Home - Voice Interface (Primary)

### Layout Structure
```
┌─────────────────────────────────────┐
│ Status Bar (Time, Battery, Signal) │
├─────────────────────────────────────┤
│                                     │
│    AI Status Indicator (Animated)   │
│        🤖 Working...               │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Voice Activation Circle        │
│          [ Tap to Speak ]           │
│                                     │
│     "O que você gostaria            │
│        de saber sobre               │
│           suas finanças?"           │
│                                     │
├─────────────────────────────────────┤
│                                     │
│    Quick Insights (Scrollable)      │
│  💰 Saldo: R$ 3.450,00            │
│  📊 Disponível este mês: R$ 2.100  │
│  ⏰ Próximo boleto: 5 dias         │
│                                     │
├─────────────────────────────────────┤
│ Emergency Menu [⋮]    Settings [⚙]  │
└─────────────────────────────────────┘
```

### Component Breakdown

#### AI Status Indicator
- **Purpose**: Shows AI autonomy and activity
- **States**: Idle, Listening, Processing, Responding
- **Animation**: Pulse, rotate, or wave based on state
- **Trust Building**: Shows recent successful actions

#### Voice Activation Circle
- **Size**: 80x80px minimum touch target
- **Visual Feedback**: Color changes + haptic feedback
- **Accessibility**: Double-tap to activate, voice-over support
- **States**: 
  - Idle: Blue (#3b82f6)
  - Listening: Orange (#f59e0b) with pulse
  - Processing: Blue with rotation
  - Responding: Green (#22c55e) with fade

#### Quick Insights Cards
- **Balance Overview**: Current balance + available
- **Monthly Budget**: Spent vs available
- **Upcoming Events**: Bills, income, deadlines
- **Swipe Actions**: Left for details, right for actions

### Interaction Patterns

#### Voice Command Flow
1. **User taps voice activation** (or says "Ok Assistente")
2. **Voice indicator turns orange** with haptic feedback
3. **User speaks command** ("Como está meu saldo?")
4. **AI processes** (blue rotation animation)
5. **AI responds** with voice + visual confirmation
6. **Result displays** in insights section

#### Emergency Access Flow
1. **User taps emergency menu** (top-right corner)
2. **Visual-only mode activates** immediately
3. **All information becomes touch-accessible**
4. **Voice commands remain available** as secondary option

## Screen 2: Dashboard - Visual Only Mode

### Layout Structure
```
┌─────────────────────────────────────┐
│ < Back    Dashboard    Voice [🎤]   │
├─────────────────────────────────────┤
│                                     │
│  Balance Overview Card              │
│  💰 Saldo Total                    │
│     R$ 3.450,00                   │
│  📊 Disponível para gastos         │
│     R$ 2.100,00                   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Financial Health Indicator         │
│  ████████████████░░░░  75%         │
│  Saúde financeira: Boa            │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Quick Actions Grid                 │
│  [ Ver saldo ]  [ Fazer PIX ]      │
│  [ Pagar boleto] [ Transferir ]    │
│  [ Ver extrato] [ Projeções ]      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Recent Transactions (List)         │
│  📥 +R$ 1.200,00  Salário         │
│  📤 -R$ 450,00   Supermercado     │
│  📥 +R$ 350,00   Freelance        │
│                                     │
└─────────────────────────────────────┘
```

### Component Details

#### Balance Overview Card
- **Primary balance** (R$ 3.450,00)
- **Available balance** (R$ 2.100,00)
- **Trust indicator** (green checkmark if verified)
- **Last updated** timestamp
- **Swipe up** for detailed breakdown

#### Financial Health Indicator
- **Visual progress bar** (0-100%)
- **Color coding**: Red (<50%), Yellow (50-80%), Green (>80%)
- **Trend indicator** (↑ improving, ↓ declining)
- **Tap for detailed analysis**

#### Quick Actions Grid
- **6 primary actions** in 2x3 grid
- **Large touch targets** (60x60px)
- **Clear icons + labels**
- **Haptic feedback** on tap

## Screen 3: Balance Details

### Layout Structure
```
┌─────────────────────────────────────┐
│ < Back    Detalhes do Saldo        │
├─────────────────────────────────────┤
│                                     │
│  Total Account Balance              │
│     R$ 3.450,00                   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Balance Breakdown                 │
│  💳 Conta Principal                │
│     R$ 3.200,00                   │
│  🏦 Poupança                       │
│     R$ 250,00                     │
│  💰 Carteira Digital               │
│     R$ 0,00                       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Monthly Projection                │
│  Projeção final do mês:            │
│     R$ 2.850,00                   │
│  📈 +R$ 200,00 vs mês anterior    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Voice Commands Available          │
│  "Como está meu saldo?"            │
│  "Quanto posso gastar?"            │
│  "Como ficará meu saldo final?"    │
│                                     │
└─────────────────────────────────────┘
```

## Screen 4: Payment Methods & Actions

### Layout Structure
```
┌─────────────────────────────────────┐
│ < Back    Pagamentos & Transferências│
├─────────────────────────────────────┤
│                                     │
│  Scheduled Payments                 │
│  📄 Boleto - Energia               │
│     Vence em 5 dias                │
│     R$ 180,00                     │
│     [ Pagar Agora ]                │
│                                     │
│  📄 Boleto - Internet              │
│     Vence em 12 dias               │
│     R$ 120,00                     │
│     [ Programar Pagamento ]        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Quick Transfer                    │
│  👤 Para: [ Selecionar contato ]   │
│  💰 Valor: R$ [ 0,00 ]            │
│  💳 Método: [ PIX | TED | DOC ]   │
│                                     │
│  [ Fazer Transferência ]           │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Voice Commands Available          │
│  "Tem algum boleto programado?"    │
│  "Faz transferência para [nome]"   │
│  "Pagar boleto de energia"         │
│                                     │
└─────────────────────────────────────┘
```

## Screen 5: Settings & Trust Management

### Layout Structure
```
┌─────────────────────────────────────┐
│ < Back    Configurações             │
├─────────────────────────────────────┤
│                                     │
│  Trust & Security                   │
│  🔐 Autenticação Biométrica         │
│     [ Ativada ]                   │
│                                     │
│  🤖 Nível de Autonomia da IA        │
│     ████████████████░░░░  80%      │
│     [ Ajustar ]                   │
│                                     │
│  🛡️ Verificação de Voz             │
│     [ Ativada ]                   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Voice Settings                     │
│  🎤 Idioma: Português (BR)         │
│  🔊 Volume de resposta: Médio      │
│  ⚡ Velocidade de fala: Normal      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Accessibility                     │
│  👁️ Alto Contraste [ Desativado ]  │
│  🗣️ Leitura de Tela [ Ativado ]    │
│  🤸 Redução de Movimento [ Desativ. ]│
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Emergency Contact                  │
│  📞 [ Adicionar Contato ]          │
│                                     │
└─────────────────────────────────────┘
```

## User Flow Maps

### Primary Voice-First Flow

#### Flow 1: Balance Check
```
1. User: Taps voice activation
2. System: Shows listening state
3. User: "Como está meu saldo?"
4. AI: Processes request
5. AI: "Seu saldo atual é de R$ 3.450,00"
6. System: Updates balance card in insights
7. AI: "Você tem R$ 2.100,00 disponíveis para gastos"
8. System: Shows budget availability
```

#### Flow 2: Bill Payment
```
1. User: "Tem algum boleto programado para pagar?"
2. AI: "Sim, você tem 2 boletos programados"
3. AI: "O boleto de energia vence em 5 dias, R$ 180,00"
4. AI: "E o boleto de internet vence em 12 dias, R$ 120,00"
5. AI: "Gostaria de pagar algum agora?"
6. User: "Sim, paga o de energia"
7. AI: "Confirmo pagamento do boleto de energia, R$ 180,00"
8. AI: "Boleto pago com sucesso via PIX"
9. System: Updates balance and shows confirmation
```

#### Flow 3: Money Transfer
```
1. User: "Faz uma transferência para a Maria"
2. AI: "Quanto você quer transferir para Maria?"
3. User: "R$ 100,00"
4. AI: "Transferindo R$ 100,00 para Maria via PIX"
5. AI: "Por favor, confirme com sua voz ou biometria"
6. User: "Confirmo"
7. AI: "Transferência realizada com sucesso"
8. System: Updates balance and transaction history
```

### Emergency Visual-Only Flow

#### Flow 4: Silent Environment Balance Check
```
1. User: Taps emergency menu (top-right)
2. System: Switches to visual-only mode
3. User: Taps "Ver saldo" quick action
4. System: Shows balance details screen
5. User: Views all balance information
6. User: Taps back to return to dashboard
```

#### Flow 5: Manual Payment Setup
```
1. User: Navigates to "Pagamentos & Transferências"
2. User: Views scheduled boletos
3. User: Taps "Pagar Agora" on energy bill
4. System: Shows payment confirmation
5. User: Confirms with biometric authentication
6. System: Processes payment
7. System: Shows success confirmation
```

## Animation & Transition Patterns

### Voice Interface Animations
- **Listening**: Orange pulse, 1.5s duration
- **Processing**: Blue rotation, 2s duration  
- **Success**: Green fade-in, 0.5s duration
- **Error**: Red shake, 0.3s duration

### Screen Transitions
- **Push transitions**: Right-to-left slide
- **Modal presentations**: Bottom-to-top slide
- **Dismiss gestures**: Top-to-bottom swipe
- **Tab switching**: Horizontal slide with bounce

### Loading States
- **Skeleton screens**: For financial data loading
- **Progressive loading**: Load balance first, then transactions
- **Retry mechanisms**: After 3 failed attempts
- **Offline indicators**: When network unavailable

## Accessibility Patterns

### Voice Interface Accessibility
- **Voice commands always available** regardless of visual state
- **Alternative input methods** for users with speech difficulties
- **Visual feedback** for voice commands
- **High contrast mode** for voice indicators

### Visual Accessibility
- **Large touch targets** (44x44px minimum)
- **High contrast support** (4.5:1 ratio minimum)
- **Screen reader support** for all financial data
- **Reduced motion options** for vestibular disorders

### Cognitive Accessibility
- **Simple language** for all financial terms
- **Progressive disclosure** of complex information
- **Clear error messages** with suggested actions
- **Consistent interaction patterns** across all screens

## Error Handling & Recovery

### Voice Command Errors
- **Not understood**: "Não entendi, pode repetir?"
- **Ambiguous commands**: "Encontrei múltiplas opções, qual você quer?"
- **Insufficient permissions**: "Preciso de sua autorização para esta ação"
- **Network issues**: "Sem conexão no momento, tente novamente"

### Financial Transaction Errors
- **Insufficient funds**: Clear indication + alternative suggestions
- **Payment failures**: Retry options + alternative methods
- **Timeout**: Automatic retry with user confirmation
- **Security blocks**: Biometric verification required

### System Recovery
- **Graceful degradation**: Voice → visual mode
- **Offline functionality**: Critical data available offline
- **Data sync**: Automatic synchronization when online
- **State preservation**: Maintain context across sessions

This comprehensive screen design and user flow specification ensures the voice-first financial assistant provides an intuitive, trustworthy, and accessible experience for Brazilian users while maintaining the revolutionary autonomy that makes the app unique.