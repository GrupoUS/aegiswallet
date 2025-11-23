import { cn } from '@/lib/utils';

interface FinancialAmountProps {
  amount: number;
  currency?: string;
  showSign?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FinancialAmount({
  amount,
  currency = 'USD',
  showSign = true,
  className,
  size = 'md',
}: FinancialAmountProps) {
  const formatted = new Intl.NumberFormat('en-US', {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(Math.abs(amount));

  const sign = showSign && amount > 0 ? '+' : amount < 0 ? '-' : '';

  const sizeClasses = {
    lg: 'text-lg',
    md: 'text-base',
    sm: 'text-sm',
    xl: 'text-xl',
  };

  const colorClass =
    amount > 0
      ? 'text-financial-positive'
      : amount < 0
        ? 'text-financial-negative'
        : 'text-gray-900';

  return (
    <span className={cn('font-mono font-semibold', sizeClasses[size], colorClass, className)}>
      {sign}
      {formatted}
    </span>
  );
}
