"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"
import { useTheme } from "@/components/providers/ThemeProvider"

interface AnimatedThemeTogglerProps
  extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  // Compute effective dark mode state (considering system preference)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateDarkState = () => {
      if (theme === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setIsDark(systemPrefersDark)
      } else {
        setIsDark(theme === "dark")
      }
    }

    updateDarkState()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        updateDarkState()
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    // Determine new theme (toggle between light and dark only)
    const newTheme = isDark ? "light" : "dark"

    // Check if browser supports View Transition API
    if (!document.startViewTransition) {
      // Fallback: simple theme change without animation
      setTheme(newTheme)
      return
    }

    // Animate with View Transition API
    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme)
      })
    }).ready

    // Calculate circle animation origin from button center
    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    // Animate circular expand from button
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [isDark, duration, setTheme])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        "hover:bg-accent hover:text-accent-foreground",
        "h-10 w-10",
        className
      )}
      aria-label="Alternar tema"
      {...props}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
    </button>
  )
}
