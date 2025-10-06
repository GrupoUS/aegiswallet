import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

export function HoverBorderGradientExample() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8">
      <h2 className="text-2xl font-bold text-foreground">
        Hover Border Gradient Examples
      </h2>

      {/* Example 1: Button */}
      <HoverBorderGradient
        as="button"
        containerClassName="rounded-full"
        className="px-6 py-3 text-sm font-medium"
      >
        <span>Hover me - Button</span>
      </HoverBorderGradient>

      {/* Example 2: Card */}
      <HoverBorderGradient
        containerClassName="rounded-lg"
        className="p-6 w-64"
        duration={1.5}
      >
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Card Title</h3>
          <p className="text-sm text-muted-foreground">
            This is a card with hover border gradient effect. Move your mouse
            over it to see the animation.
          </p>
        </div>
      </HoverBorderGradient>

      {/* Example 3: Link */}
      <HoverBorderGradient
        as="a"
        href="#"
        containerClassName="rounded-md"
        className="px-4 py-2 text-sm"
      >
        <span>Hover me - Link</span>
      </HoverBorderGradient>

      {/* Example 4: Large gradient */}
      <HoverBorderGradient
        containerClassName="rounded-xl"
        className="p-8 w-96"
        size={800}
        duration={2}
      >
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">
            Large Gradient Effect
          </h3>
          <p className="text-muted-foreground">
            This example uses a larger gradient size (800px) and slower
            animation (2 seconds) for a more dramatic effect.
          </p>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <div className="h-8 w-8 rounded-full bg-accent" />
            <div className="h-8 w-8 rounded-full bg-secondary" />
          </div>
        </div>
      </HoverBorderGradient>

      {/* Example 5: Custom styling */}
      <HoverBorderGradient
        containerClassName="rounded-2xl"
        className="p-6 w-80 bg-card"
        duration={0.8}
        size={400}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent" />
            <div>
              <h4 className="font-semibold text-foreground">Custom Card</h4>
              <p className="text-xs text-muted-foreground">
                Fast animation (0.8s)
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This card demonstrates custom styling with faster animation and
            medium gradient size.
          </p>
        </div>
      </HoverBorderGradient>
    </div>
  )
}

