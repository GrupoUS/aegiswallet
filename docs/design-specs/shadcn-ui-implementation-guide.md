# shadcn/ui Integration Guide & Implementation Instructions

## Overview

This guide provides comprehensive instructions for implementing the "Assistente Financeiro Autônomo" UI using React Native Reusables (shadcn/ui for React Native). The integration leverages the component library's accessibility features and NativeWind styling to create the revolutionary voice-first financial assistant.

## Project Setup

### Initial Configuration

#### 1. Install React Native Reusables

```bash
# Install core dependencies
npm install @rnr/registry
npm install nativewind react-native-svg react-native-reanimated

# Install required primitives
npm install @rn-primitives/alert-dialog @rn-primitives/progress
npm install @rn-primitives/avatar @rn-primitives/badge
npm install @rn-primitives/card @rn-primitives/button
npm install @rn-primitives/input @rn-primitives/text
```

#### 2. Configure Tailwind CSS (NativeWind)

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brazilian Financial Color Palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          50: '#fef7ee',
          100: '#fdecd7',
          200: '#fbd9a9',
          300: '#f7bb6c',
          400: '#f59e0b',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Brazilian Financial System Colors
        pix: '#00bfa5',
        boleto: '#1565c0',
        transfer: '#7c3aed',
        // Voice Interface Colors
        voice: {
          active: '#f59e0b',
          processing: '#3b82f6',
          complete: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'voice-listening': 'voice-listening 1.5s ease-in-out infinite',
        'ai-thinking': 'ai-thinking 2s linear infinite',
        'confidence-wave': 'confidence-wave 1s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

#### 3. Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for Nativewind and SVG
config.resolver.assetExts.push('svg');

module.exports = config;
```

#### 4. Babel Configuration

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['nativewind/babel'],
      'react-native-reanimated/plugin',
    ],
  };
};
```

## Component Implementation

### Core UI Components Setup

#### 1. Base Text Component

```typescript
// src/components/ui/text.tsx
import * as React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface TextProps extends RNTextProps {
  className?: string;
}

export const Text = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => {
    return (
      <RNText
        ref={ref}
        className={cn(
          'text-base text-foreground font-normal',
          className
        )}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';
```

#### 2. Button Component

```typescript
// src/components/ui/button.tsx
import * as React from 'react';
import { Pressable, PressableProps, Text, View } from 'react-native';
import { cn } from '@/lib/utils';

export interface ButtonProps extends PressableProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  textClass?: string;
  children: React.ReactNode;
}

export const Button = React.forwardRef<Pressable, ButtonProps>(
  ({ 
    variant = 'default', 
    size = 'default', 
    className, 
    textClass, 
    children, 
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-primary',
      destructive: 'bg-destructive',
      outline: 'border border-input bg-background',
      secondary: 'bg-secondary',
      ghost: 'bg-transparent',
    };

    const sizes = {
      default: 'py-3 px-4',
      sm: 'py-2 px-3',
      lg: 'py-4 px-6',
    };

    const textVariants = {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
    };

    const textSizes = {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-lg',
    };

    return (
      <Pressable
        ref={ref}
        className={cn(
          'rounded-md items-center justify-center active:opacity-70',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <Text
          className={cn(
            'font-medium',
            textVariants[variant],
            textSizes[size],
            textClass
          )}
        >
          {children}
        </Text>
      </Pressable>
    );
  }
);

Button.displayName = 'Button';
```

#### 3. Card Component

```typescript
// src/components/ui/card.tsx
import * as React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface CardProps extends ViewProps {
  className?: string;
}

export const Card = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          'rounded-lg border bg-card shadow-sm',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('flex-col space-y-1.5 p-6', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

export const CardContent = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('p-6 pt-0', className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';
```

### Voice Interface Components

#### 1. Voice Activation Indicator

```typescript
// src/components/voice/voice-indicator.tsx
import React, { useState, useEffect } from 'react';
import { Pressable, Animated, View } from 'react-native';
import { cn } from '@/lib/utils';

interface VoiceIndicatorProps {
  isActive: boolean;
  state: 'idle' | 'listening' | 'processing' | 'responding';
  onPress: () => void;
  className?: string;
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  isActive,
  state,
  onPress,
  className,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (state === 'listening') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else if (state === 'processing') {
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotate.start();
      return () => rotate.stop();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [state, pulseAnim, rotateAnim]);

  const getStateColor = () => {
    switch (state) {
      case 'listening':
        return 'bg-voice-active';
      case 'processing':
        return 'bg-voice-processing';
      case 'responding':
        return 'bg-voice-complete';
      default:
        return 'bg-primary';
    }
  };

  const getStateMessage = () => {
    switch (state) {
      case 'listening':
        return 'Ouvindo...';
      case 'processing':
        return 'Processando...';
      case 'responding':
        return 'Respondendo...';
      default:
        return 'Toque para falar';
    }
  };

  return (
    <View className={cn('items-center justify-center', className)}>
      <Pressable
        onPress={onPress}
        className={cn(
          'w-20 h-20 rounded-full items-center justify-center shadow-lg',
          getStateColor(),
          state === 'listening' && 'animate-pulse'
        )}
      >
        <Animated.View
          style={{
            transform: [
              { scale: state === 'listening' ? pulseAnim : 1 },
              { rotate: state === 'processing' ? rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }) : '0deg' },
            ],
          }}
        >
          <View className="w-8 h-8 bg-white rounded-full" />
        </Animated.View>
      </Pressable>
      <Text className="text-sm text-muted-foreground mt-2">
        {getStateMessage()}
      </Text>
    </View>
  );
};
```

#### 2. AI Status Display

```typescript
// src/components/ai/ai-status.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIStatusProps {
  isWorking: boolean;
  currentTask?: string;
  trustLevel: number;
  className?: string;
}

export const AIStatus: React.FC<AIStatusProps> = ({
  isWorking,
  currentTask,
  trustLevel,
  className,
}) => {
  const getTrustColor = () => {
    if (trustLevel >= 80) return 'bg-green-500';
    if (trustLevel >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrustLabel = () => {
    if (trustLevel >= 80) return 'Alta Confiança';
    if (trustLevel >= 50) return 'Confiança Média';
    return 'Construindo Confiança';
  };

  return (
    <Card className={cn('mb-4', className)}>
      <CardContent className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className={cn(
              'w-3 h-3 rounded-full mr-2',
              isWorking ? 'bg-green-500' : 'bg-gray-400'
            )} />
            <Text className="font-semibold text-sm">
              IA {isWorking ? 'Ativa' : 'Em Espera'}
            </Text>
          </View>
          <Badge variant="secondary">
            {getTrustLabel()}
          </Badge>
        </View>
        
        {currentTask && (
          <Text className="text-xs text-muted-foreground mb-2">
            {currentTask}
          </Text>
        )}
        
        <View className="flex-row items-center">
          <Text className="text-xs text-muted-foreground mr-2">
            Nível de Confiança:
          </Text>
          <View className="flex-1 bg-gray-200 rounded-full h-2">
            <View 
              className={cn('h-2 rounded-full', getTrustColor())}
              style={{ width: `${trustLevel}%` }}
            />
          </View>
          <Text className="text-xs text-muted-foreground ml-2">
            {trustLevel}%
          </Text>
        </View>
      </CardContent>
    </Card>
  );
};
```

### Financial Components

#### 1. Balance Card

```typescript
// src/components/financial/balance-card.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  currentBalance: number;
  availableBalance: number;
  projectedBalance: number;
  currency?: string;
  trustLevel?: number;
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  currentBalance,
  availableBalance,
  projectedBalance,
  currency = 'BRL',
  trustLevel = 0,
  className,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const getTrendColor = (current: number, projected: number) => {
    if (projected > current) return 'text-green-600';
    if (projected < current) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (current: number, projected: number) => {
    if (projected > current) return '📈';
    if (projected < current) return '📉';
    return '➡️';
  };

  return (
    <Card className={cn('mb-4', className)}>
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold">Seu Saldo</Text>
          {trustLevel > 0 && (
            <Badge variant="outline">
              🤖 {trustLevel}% Autonomia
            </Badge>
          )}
        </View>
      </CardHeader>
      
      <CardContent>
        <View className="mb-4">
          <Text className="text-3xl font-bold text-primary">
            {formatCurrency(currentBalance)}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Saldo Total
          </Text>
        </View>
        
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">
              Disponível para Gastos
            </Text>
            <Text className="text-sm font-semibold text-green-600">
              {formatCurrency(availableBalance)}
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted-foreground">
              Projeção Final do Mês
            </Text>
            <View className="flex-row items-center">
              <Text className={cn(
                'text-sm font-semibold mr-1',
                getTrendColor(currentBalance, projectedBalance)
              )}>
                {formatCurrency(projectedBalance)}
              </Text>
              <Text className="text-xs">
                {getTrendIcon(currentBalance, projectedBalance)}
              </Text>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};
```

#### 2. Transaction Item

```typescript
// src/components/financial/transaction-item.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  id: string;
  type: 'pix' | 'boleto' | 'transfer' | 'income' | 'expense';
  description: string;
  amount: number;
  date: Date;
  status: 'pending' | 'completed' | 'failed' | 'scheduled';
  className?: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  id,
  type,
  description,
  amount,
  date,
  status,
  className,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'pix': return '🚀';
      case 'boleto': return '📄';
      case 'transfer': return '💸';
      case 'income': return '📥';
      case 'expense': return '📤';
      default: return '💰';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'pix': return 'bg-green-100 text-green-800';
      case 'boleto': return 'bg-blue-100 text-blue-800';
      case 'transfer': return 'bg-purple-100 text-purple-800';
      case 'income': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'scheduled': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const isIncome = amount > 0;
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';

  return (
    <Card className={cn('mb-2', className)}>
      <CardContent className="p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Text className="text-2xl mr-3">{getTypeIcon()}</Text>
            <View className="flex-1">
              <Text className="font-semibold text-sm mb-1">
                {description}
              </Text>
              <View className="flex-row items-center">
                <Badge 
                  variant="secondary" 
                  className={cn('mr-2', getTypeColor())}
                >
                  {type.toUpperCase()}
                </Badge>
                <Text className="text-xs text-muted-foreground">
                  {formatDate(date)}
                </Text>
              </View>
            </View>
          </View>
          
          <View className="items-end">
            <Text className={cn('font-bold text-lg', amountColor)}>
              {isIncome ? '+' : ''}{formatCurrency(amount)}
            </Text>
            <Text className={cn('text-xs', getStatusColor())}>
              {status === 'completed' ? 'Concluído' :
               status === 'pending' ? 'Pendente' :
               status === 'scheduled' ? 'Agendado' : 'Falhou'}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};
```

### Navigation Components

#### 1. Quick Actions Grid

```typescript
// src/components/navigation/quick-actions.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  className,
}) => {
  return (
    <View className={cn('px-4 py-2', className)}>
      <Text className="text-lg font-semibold mb-3 px-2">
        Ações Rápidas
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {actions.map((action) => (
          <Pressable
            key={action.id}
            onPress={action.onPress}
            className={cn(
              'flex-1 min-w-[140px] bg-card border rounded-lg p-4 items-center',
              'active:opacity-70 active:scale-95',
              'shadow-sm'
            )}
            style={{ minHeight: 100 }}
          >
            <View 
              className={cn(
                'w-12 h-12 rounded-full items-center justify-center mb-2',
                action.color ? action.color : 'bg-primary'
              )}
            >
              <Text className="text-white text-xl">{action.icon}</Text>
            </View>
            <Text className="text-xs text-center font-medium">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
```

## Screen Implementation Examples

### Home Screen Implementation

```typescript
// src/screens/home-screen.tsx
import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
import { VoiceIndicator } from '@/components/voice/voice-indicator';
import { AIStatus } from '@/components/ai/ai-status';
import { BalanceCard } from '@/components/financial/balance-card';
import { TransactionItem } from '@/components/financial/transaction-item';
import { QuickActions } from '@/components/navigation/quick-actions';
import { Button } from '@/components/ui/button';

const HomeScreen: React.FC = () => {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'responding'>('idle');
  const [isAIWorking, setIsAIWorking] = useState(false);
  const [trustLevel, setTrustLevel] = useState(75);

  const handleVoiceActivation = () => {
    setVoiceState('listening');
    // Voice recognition logic here
    setTimeout(() => {
      setVoiceState('processing');
      setTimeout(() => {
        setVoiceState('responding');
        setTimeout(() => {
          setVoiceState('idle');
        }, 2000);
      }, 1500);
    }, 3000);
  };

  const quickActions = [
    {
      id: 'balance',
      label: 'Ver Saldo',
      icon: '💰',
      onPress: () => console.log('Ver saldo'),
      color: 'bg-blue-500',
    },
    {
      id: 'pix',
      label: 'Fazer PIX',
      icon: '🚀',
      onPress: () => console.log('Fazer PIX'),
      color: 'bg-green-500',
    },
    {
      id: 'boleto',
      label: 'Pagar Boleto',
      icon: '📄',
      onPress: () => console.log('Pagar boleto'),
      color: 'bg-indigo-500',
    },
    {
      id: 'transfer',
      label: 'Transferir',
      icon: '💸',
      onPress: () => console.log('Transferir'),
      color: 'bg-purple-500',
    },
  ];

  const recentTransactions = [
    {
      id: '1',
      type: 'income' as const,
      description: 'Salário',
      amount: 3500,
      date: new Date(),
      status: 'completed' as const,
    },
    {
      id: '2',
      type: 'expense' as const,
      description: 'Supermercado',
      amount: -450,
      date: new Date(Date.now() - 86400000),
      status: 'completed' as const,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* AI Status */}
          <AIStatus
            isWorking={isAIWorking}
            currentTask="Analisando suas finanças..."
            trustLevel={trustLevel}
          />

          {/* Voice Activation */}
          <View className="items-center py-6">
            <VoiceIndicator
              isActive={voiceState !== 'idle'}
              state={voiceState}
              onPress={handleVoiceActivation}
            />
            <Text className="text-center text-muted-foreground mt-4 px-8">
              Toque para falar ou diga "Ok Assistente"
            </Text>
          </View>

          {/* Balance Card */}
          <BalanceCard
            currentBalance={3450}
            availableBalance={2100}
            projectedBalance={2850}
            trustLevel={trustLevel}
          />

          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Recent Transactions */}
          <View className="mt-6">
            <Text className="text-lg font-semibold mb-3 px-2">
              Transações Recentes
            </Text>
            {recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                {...transaction}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
```

## Performance Optimization

### Component Optimization

#### 1. Memoization for Heavy Components

```typescript
// src/components/optimized/balance-card.tsx
import React, { memo } from 'react';
import { BalanceCard as BaseBalanceCard } from '@/components/financial/balance-card';

interface OptimizedBalanceCardProps {
  balance: number;
  available: number;
  projected: number;
}

export const OptimizedBalanceCard = memo<OptimizedBalanceCardProps>(({
  balance,
  available,
  projected,
}) => {
  return (
    <BaseBalanceCard
      currentBalance={balance}
      availableBalance={available}
      projectedBalance={projected}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.balance === nextProps.balance &&
    prevProps.available === nextProps.available &&
    prevProps.projected === nextProps.projected
  );
});
```

#### 2. Lazy Loading for Screens

```typescript
// src/navigation/lazy-screens.tsx
import React, { lazy } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const HomeScreen = lazy(() => import('@/screens/home-screen'));
const BalanceScreen = lazy(() => import('@/screens/balance-screen'));
const PaymentScreen = lazy(() => import('@/screens/payment-screen'));

export const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Balance" 
        component={BalanceScreen}
        options={{ title: 'Detalhes do Saldo' }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ title: 'Pagamentos' }}
      />
    </Stack.Navigator>
  );
};
```

## Testing Strategy

### Component Testing

```typescript
// src/components/__tests__/voice-indicator.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VoiceIndicator } from '../voice/voice-indicator';

describe('VoiceIndicator', () => {
  it('should render correctly in idle state', () => {
    const { getByTestId } = render(
      <VoiceIndicator
        isActive={false}
        state="idle"
        onPress={jest.fn()}
      />
    );
    
    expect(getByTestId('voice-indicator')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <VoiceIndicator
        isActive={false}
        state="idle"
        onPress={mockOnPress}
      />
    );
    
    fireEvent.press(getByTestId('voice-indicator'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('should show correct colors for different states', () => {
    const { rerender, getByTestId } = render(
      <VoiceIndicator
        isActive={true}
        state="listening"
        onPress={jest.fn()}
      />
    );
    
    expect(getByTestId('voice-indicator')).toHaveStyle({
      backgroundColor: '#f59e0b', // voice-active color
    });
  });
});
```

This comprehensive implementation guide provides everything needed to build the revolutionary voice-first financial assistant using React Native Reusables (shadcn/ui), ensuring accessibility, performance, and cultural adaptation for the Brazilian market.