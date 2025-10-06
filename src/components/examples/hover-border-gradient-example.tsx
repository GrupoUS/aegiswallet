import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

/**
 * Comprehensive examples showcasing both variants of HoverBorderGradient
 */
export function HoverBorderGradientExample() {
  return (
    <div className="flex flex-col items-center justify-center gap-12 p-8">
      <h2 className="text-3xl font-bold text-foreground">
        Hover Border Gradient Examples
      </h2>

      {/* Rotating Variant Section */}
      <section className="w-full max-w-4xl space-y-6">
        <h3 className="text-2xl font-semibold text-foreground border-b pb-2">
          Rotating Variant (Aceternity UI Style)
        </h3>
        <p className="text-muted-foreground">
          Directional gradient that rotates around the border. Transitions to highlight on hover.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8">
          {/* Rotating Button - Clockwise */}
          <HoverBorderGradient
            variant="rotating"
            as="button"
            containerClassName="rounded-full"
            className="px-6 py-3 text-sm font-medium"
            clockwise={true}
          >
            <span>Clockwise Rotation</span>
          </HoverBorderGradient>

          {/* Rotating Button - Counter-clockwise */}
          <HoverBorderGradient
            variant="rotating"
            as="button"
            containerClassName="rounded-full"
            className="px-6 py-3 text-sm font-medium"
            clockwise={false}
          >
            <span>Counter-clockwise</span>
          </HoverBorderGradient>

          {/* Rotating with slower duration */}
          <HoverBorderGradient
            variant="rotating"
            as="button"
            containerClassName="rounded-full"
            className="px-8 py-4 text-base font-semibold"
            duration={2}
          >
            <span>Slow Rotation (2s)</span>
          </HoverBorderGradient>
        </div>
      </section>

      {/* Mouse-Follow Variant Section */}
      <section className="w-full max-w-4xl space-y-6">
        <h3 className="text-2xl font-semibold text-foreground border-b pb-2">
          Mouse-Follow Variant (Default)
        </h3>
        <p className="text-muted-foreground">
          Radial gradient that follows your mouse cursor for an interactive glow effect.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8">
          {/* Mouse-follow Button */}
          <HoverBorderGradient
            variant="mouse-follow"
            as="button"
            containerClassName="rounded-full"
            className="px-6 py-3 text-sm font-medium"
          >
            <span>Mouse-Follow Button</span>
          </HoverBorderGradient>

          {/* Mouse-follow Card */}
          <HoverBorderGradient
            variant="mouse-follow"
            containerClassName="rounded-lg"
            className="p-6 w-64"
            duration={1.5}
          >
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-foreground">Interactive Card</h4>
              <p className="text-sm text-muted-foreground">
                Move your mouse over this card to see the gradient follow your cursor.
              </p>
            </div>
          </HoverBorderGradient>

          {/* Large gradient effect */}
          <HoverBorderGradient
            variant="mouse-follow"
            containerClassName="rounded-xl"
            className="p-8 w-96"
            size={800}
            duration={2}
          >
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-foreground">
                Large Gradient Effect
              </h4>
              <p className="text-muted-foreground">
                This example uses a larger gradient size (800px) for a more dramatic effect.
              </p>
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-primary" />
                <div className="h-8 w-8 rounded-full bg-accent" />
                <div className="h-8 w-8 rounded-full bg-secondary" />
              </div>
            </div>
          </HoverBorderGradient>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="w-full max-w-4xl space-y-6">
        <h3 className="text-2xl font-semibold text-foreground border-b pb-2">
          Side-by-Side Comparison
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Rotating Variant</p>
            <HoverBorderGradient
              variant="rotating"
              as="button"
              containerClassName="rounded-full"
              className="px-8 py-4"
            >
              <span>Hover Me</span>
            </HoverBorderGradient>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Automatic rotation animation</li>
              <li>✓ Directional gradient pattern</li>
              <li>✓ Highlight effect on hover</li>
              <li>✓ Best for buttons and CTAs</li>
            </ul>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Mouse-Follow Variant</p>
            <HoverBorderGradient
              variant="mouse-follow"
              as="button"
              containerClassName="rounded-full"
              className="px-8 py-4"
            >
              <span>Hover Me</span>
            </HoverBorderGradient>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Interactive cursor tracking</li>
              <li>✓ Radial glow effect</li>
              <li>✓ Smooth mouse following</li>
              <li>✓ Best for cards and containers</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
