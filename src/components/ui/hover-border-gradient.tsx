"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export interface HoverBorderGradientProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content to be wrapped with the hover border gradient effect
   */
  children: React.ReactNode
  /**
   * Additional CSS classes for the container
   */
  containerClassName?: string
  /**
   * Duration of the gradient animation in seconds
   */
  duration?: number
  /**
   * Size of the gradient circle in pixels
   */
  size?: number
  /**
   * Whether the component is in a loading state
   */
  as?: React.ElementType
}

const HoverBorderGradient = React.forwardRef<
  HTMLDivElement,
  HoverBorderGradientProps
>(
  (
    {
      children,
      containerClassName,
      className,
      duration = 1,
      size = 600,
      as: Component = "div",
      ...props
    },
    ref
  ) => {
    const [hovered, setHovered] = React.useState(false)
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      },
      []
    )

    return (
      <Component
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={handleMouseMove}
        className={cn(
          "relative flex rounded-md p-[1px] transition-all duration-300",
          containerClassName
        )}
        {...props}
      >
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-md opacity-0 transition-opacity duration-300"
          style={{
            background: hovered
              ? `radial-gradient(${size}px circle at ${mousePosition.x}px ${mousePosition.y}px, oklch(0.5854 0.2041 277.1173 / 0.15), transparent 40%)`
              : "transparent",
            opacity: hovered ? 1 : 0,
          }}
          animate={{
            opacity: hovered ? 1 : 0,
          }}
          transition={{
            duration: duration,
            ease: "easeInOut",
          }}
        />

        {/* Static gradient border (visible when not hovered) */}
        <div
          className={cn(
            "absolute inset-0 rounded-md bg-gradient-to-br from-[oklch(0.5854_0.2041_277.1173)] to-[oklch(0.9376_0.0260_321.9388)] opacity-50",
            "dark:from-[oklch(0.4955_0.0951_170.4045)] dark:to-[oklch(0.5854_0.2041_277.1173)]"
          )}
        />

        {/* Content container */}
        <div
          className={cn(
            "relative z-10 flex w-full rounded-[calc(0.375rem-1px)] bg-background",
            className
          )}
        >
          {children}
        </div>
      </Component>
    )
  }
)

HoverBorderGradient.displayName = "HoverBorderGradient"

export { HoverBorderGradient }
