/**
 * Brazilian Financial Components - Story 04.03
 * Updated to use proper Card component with animation support
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters/brazilianFormatters';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: number;
  className?: string;
}

export const BalanceCard = React.memo(function BalanceCard({
  balance,
  className,
}: BalanceCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-primary/20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BalanceCard.displayName = 'BalanceCard';
