import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const gradientButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none overflow-hidden group",
  {
    variants: {
      variant: {
        primary: [
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
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4 text-base',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface GradientButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        data-slot="gradient-button"
        className={cn(gradientButtonVariants({ variant, size }), className)}
        {...props}
      >
        {/* Gradient overlay for enhanced effect */}
        <span className="absolute inset-0 rounded-md bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Inner glow effect */}
        <span className="absolute inset-[1px] rounded-[calc(0.375rem-1px)] bg-gradient-to-br from-white/5 to-transparent" />

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      </Comp>
    )
  }
)

GradientButton.displayName = 'GradientButton'

export { GradientButton, gradientButtonVariants }
