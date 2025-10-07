'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { motion } from 'motion/react'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: [
          // Primary gradient: Purple to Pink
          'bg-gradient-to-br from-[oklch(0.5854_0.2041_277.1173)] to-[oklch(0.9376_0.0260_321.9388)]',
          'text-white font-semibold',
          'shadow-[0_0_20px_rgba(88,28,135,0.3)]',
          'hover:shadow-[0_0_30px_rgba(88,28,135,0.5)]',
          'dark:shadow-[0_0_20px_rgba(168,85,247,0.4)]',
          'dark:hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]',
        ],
        trust: [
          // Trust gradient: Purple to Blue (for secure transactions)
          'bg-gradient-to-br from-[oklch(0.5854_0.2041_277.1173)] to-[oklch(0.4955_0.0951_170.4045)]',
          'text-white font-semibold',
          'shadow-[0_0_20px_rgba(88,28,135,0.3)]',
          'hover:shadow-[0_0_30px_rgba(88,28,135,0.5)]',
          'dark:shadow-[0_0_20px_rgba(59,130,246,0.4)]',
          'dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]',
        ],
        success: [
          // Success gradient: Primary to Secondary (for completed actions)
          'bg-gradient-to-br from-[oklch(0.5854_0.2041_277.1173)] to-[oklch(0.8687_0.0043_56.3660)]',
          'text-white font-semibold',
          'shadow-[0_0_20px_rgba(88,28,135,0.3)]',
          'hover:shadow-[0_0_30px_rgba(88,28,135,0.5)]',
        ],
        neumorph: [
          'bg-[#36322F]',
          'text-[#fff]',
          'hover:enabled:bg-[#4a4542]',
          'disabled:bg-[#8c8885]',
          '[box-shadow:inset_0px_-2.108433723449707px_0px_0px_#171310,_0px_1.2048193216323853px_6.325301647186279px_0px_rgba(58,_33,_8,_58%)]',
          'hover:enabled:[box-shadow:inset_0px_-2.53012px_0px_0px_#171310,_0px_1.44578px_7.59036px_0px_rgba(58,_33,_8,_64%)]',
          'disabled:shadow-none',
          'active:bg-[#2A2724]',
          'active:[box-shadow:inset_0px_-1.5px_0px_0px_#171310,_0px_0.5px_2px_0px_rgba(58,_33,_8,_70%)]',
        ],
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
        neumorphSmall: ['text-xs', 'py-1', 'px-2', 'h-9', 'rounded-[8px]'],
        neumorphMedium: ['text-base', 'py-2', 'px-4', 'h-11', 'rounded-[9px]'],
        neumorphLarge: ['text-lg', 'py-3', 'px-6', 'h-14', 'rounded-[11px]'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  withGradient?: boolean
  gradientDuration?: number
  gradientSize?: number
  loading?: boolean
  withMotion?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, withGradient = false, gradientDuration = 2, gradientSize = 600, loading = false, withMotion = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    // Helper variables for variant detection
    const isGradient = variant === 'gradient' || variant === 'trust' || variant === 'success'
    const isNeumorph = variant === 'neumorph'
    
    // Apply motion effects for neumorph buttons
    if (isNeumorph && withMotion && !asChild) {
      const {
        onDrag: _onDrag, onDragEnd: _onDragEnd, onDragStart: _onDragStart, onDragEnter: _onDragEnter,
        onDragExit: _onDragExit, onDragLeave: _onDragLeave, onDragOver: _onDragOver, onDrop: _onDrop,
        onAnimationStart: _onAnimationStart, onAnimationEnd: _onAnimationEnd, onAnimationIteration: _onAnimationIteration,
        ...restProps
      } = props;
      return (
        <motion.button
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          disabled={disabled || loading}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          {...restProps}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: loading ? 0.7 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        </motion.button>
      )
    }

    // Base button content
    const buttonContent = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )

    // Apply HoverBorderGradient for non-gradient, non-neumorph buttons
    if (withGradient && !disabled && !isGradient && !isNeumorph && variant !== 'link') {
      return (
        <HoverBorderGradient
          as="div"
          containerClassName="inline-flex"
          className="!p-0 !bg-transparent"
          duration={gradientDuration}
          size={gradientSize}
        >
          {buttonContent}
        </HoverBorderGradient>
      )
    }

    return buttonContent
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
