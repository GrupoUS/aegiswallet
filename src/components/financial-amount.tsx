import React from 'react'
import { cn } from '@/lib/utils'

interface FinancialAmountProps {
  amount: number
  currency?: string
  showSign?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function FinancialAmount({ 
  amount, 
  currency = 'USD', 
  showSign = true,
  className,
  size = 'md'
}: FinancialAmountProps) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  const sign = showSign && amount > 0 ? '+' : amount < 0 ? '-' : ''
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const colorClass = amount > 0 ? 'text-green-600' : amount < 0 ? 'text-red-600' : 'text-gray-900'

  return (
    <span className={cn(
      'font-mono font-semibold',
      sizeClasses[size],
      colorClass,
      className
    )}>
      {sign}{formatted}
    </span>
  )
}