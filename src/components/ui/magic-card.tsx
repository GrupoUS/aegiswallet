'use client';

import { motion } from 'motion/react';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
}

export const MagicCard = React.forwardRef<HTMLDivElement, MagicCardProps>(
  (
    {
      children,
      className,
      gradientSize = 200,
      gradientColor = '#AC9469', // AegisWallet gold color
      gradientOpacity = 0.8,
      gradientFrom = '#AC9469', // AegisWallet gold
      gradientTo = '#112031', // AegisWallet deep blue
      ...props
    },
    ref
  ) => {
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = React.useState(false);

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }, []);

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    return (
      <button
        type="button"
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-lg border border-border bg-background p-6 text-left transition-all duration-300 hover:border-primary/50',
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Magic gradient effect */}
        {isHovering && (
          <motion.div
            className="-inset-px pointer-events-none absolute rounded-lg"
            style={{
              background: `radial-gradient(${gradientSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${gradientFrom}${Math.round(gradientOpacity * 255).toString(16)}, ${gradientTo}00)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Border highlight effect */}
        {isHovering && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-lg border-2"
            style={{
              borderColor: gradientColor,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </button>
    );
  }
);

MagicCard.displayName = 'MagicCard';
