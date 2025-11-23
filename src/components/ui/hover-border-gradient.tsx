'use client';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Direction = 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT';

export interface HoverBorderGradientProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The content to be wrapped with the hover border gradient effect
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes for the container
   */
  containerClassName?: string;
  /**
   * The HTML element type to render
   */
  as?: React.ElementType;
  /**
   * Duration of the gradient animation in seconds
   */
  duration?: number;
  /**
   * Whether the gradient rotates clockwise (true) or counter-clockwise (false)
   * Only applies to 'rotating' variant
   */
  clockwise?: boolean;
  /**
   * Variant of the hover effect
   * - 'rotating': Aceternity UI style with rotating directional gradient
   * - 'mouse-follow': Mouse-following radial gradient (default)
   */
  variant?: 'rotating' | 'mouse-follow';
  /**
   * Size of the gradient circle in pixels (only for 'mouse-follow' variant)
   */
  size?: number;
}

/**
 * HoverBorderGradient Component
 *
 * A versatile component that adds animated gradient border effects on hover.
 * Supports two variants:
 *
 * 1. **Rotating Variant** (Aceternity UI style):
 *    - Gradient rotates around the border in a directional pattern
 *    - Configurable rotation direction (clockwise/counter-clockwise)
 *    - Smooth transition to highlight effect on hover
 *
 * 2. **Mouse-Follow Variant** (default):
 *    - Gradient follows mouse position
 *    - Creates a radial glow effect at cursor location
 *    - Configurable gradient size
 */
const HoverBorderGradient = React.forwardRef<HTMLElement, HoverBorderGradientProps>(
  (
    {
      children,
      containerClassName,
      className,
      as: Tag = 'button',
      duration = 1,
      clockwise = true,
      variant = 'mouse-follow',
      size = 600,
      ...props
    },
    ref
  ) => {
    // State for rotating variant
    const [hovered, setHovered] = useState<boolean>(false);
    const [direction, setDirection] = useState<Direction>('TOP');

    // State for mouse-follow variant
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Rotating variant logic
    const rotateDirection = useCallback(
      (currentDirection: Direction): Direction => {
        const directions: Direction[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT'];
        const currentIndex = directions.indexOf(currentDirection);
        const nextIndex = clockwise
          ? (currentIndex - 1 + directions.length) % directions.length
          : (currentIndex + 1) % directions.length;
        return directions[nextIndex];
      },
      [clockwise]
    );

    const movingMap: Record<Direction, string> = {
      BOTTOM:
        'radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
      LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
      RIGHT:
        'radial-gradient(16.2% 41.199999999999996% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
      TOP: 'radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
    };

    const highlight =
      'radial-gradient(75% 181.15942028985506% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)';

    // Mouse-follow variant logic
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLElement>) => {
        if (variant === 'mouse-follow') {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
      },
      [variant]
    );

    // Rotation effect for rotating variant
    useEffect(() => {
      if (variant === 'rotating' && !hovered) {
        const interval = setInterval(() => {
          setDirection((prevState) => rotateDirection(prevState));
        }, duration * 1000);
        return () => clearInterval(interval);
      }
    }, [hovered, variant, duration, rotateDirection]);

    // Render rotating variant
    if (variant === 'rotating') {
      return (
        <Tag
          ref={ref}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            'relative flex h-min w-fit flex-col flex-nowrap content-center items-center justify-center gap-10 overflow-visible rounded-full border bg-black/20 decoration-clone p-px transition duration-500 hover:bg-black/10 dark:bg-white/20',
            containerClassName
          )}
          {...props}
        >
          <div
            className={cn('z-10 w-auto rounded-[inherit] bg-black px-4 py-2 text-white', className)}
          >
            {children}
          </div>
          <motion.div
            className={cn('absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]')}
            style={{
              filter: 'blur(2px)',
              height: '100%',
              position: 'absolute',
              width: '100%',
            }}
            initial={{ background: movingMap[direction] }}
            animate={{
              background: hovered ? [movingMap[direction], highlight] : movingMap[direction],
            }}
            transition={{ duration: duration ?? 1, ease: 'linear' }}
          />
          <div className="absolute inset-[2px] z-1 flex-none rounded-[100px] bg-black" />
        </Tag>
      );
    }

    // Render mouse-follow variant (default)
    return (
      <Tag
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={handleMouseMove}
        className={cn(
          'relative flex rounded-md p-[1px] transition-all duration-300',
          containerClassName
        )}
        {...props}
      >
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-md opacity-0 transition-opacity duration-300"
          style={{
            background: hovered
              ? `radial-gradient(${size}px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(172, 148, 105, 0.45), rgba(17, 32, 49, 0.15) 60%, transparent 80%)`
              : 'transparent',
            opacity: hovered ? 1 : 0,
          }}
          animate={{
            opacity: hovered ? 1 : 0,
          }}
          transition={{
            duration: duration,
            ease: 'easeInOut',
          }}
        />

        {/* Static gradient border (visible when not hovered) */}
        <div
          className={cn(
            'absolute inset-0 rounded-md bg-gradient-to-br from-[#AC9469]/70 via-[#D2AA60]/60 to-[#112031]/70 opacity-60',
            'dark:from-[#D2AA60]/70 dark:via-[#AC9469]/60 dark:to-[#112031]/80'
          )}
        />

        {/* Content container */}
        <div
          className={cn(
            'relative z-10 flex w-full rounded-[calc(0.375rem-1px)] bg-background',
            className
          )}
        >
          {children}
        </div>
      </Tag>
    );
  }
);

HoverBorderGradient.displayName = 'HoverBorderGradient';

export { HoverBorderGradient };
