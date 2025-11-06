import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

/**
 * Comprehensive examples showcasing both variants of HoverBorderGradient
 */
export function HoverBorderGradientExample() {
  return (
    <div className="flex flex-col items-center justify-center gap-12 p-8">
      <h2 className="font-bold text-3xl text-foreground">Hover Border Gradient Examples</h2>

      {/* Rotating Variant Section */}
      <section className="w-full max-w-4xl space-y-6">
        <h3 className="border-b pb-2 font-semibold text-2xl text-foreground">
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
            className="px-6 py-3 font-medium text-sm"
            clockwise={true}
          >
            <span>Clockwise Rotation</span>
          </HoverBorderGradient>

          {/* Rotating Button - Counter-clockwise */}
          <HoverBorderGradient
            variant="rotating"
            as="button"
            containerClassName="rounded-full"
            className="px-6 py-3 font-medium text-sm"
            clockwise={false}
          >
            <span>Counter-clockwise</span>
          </HoverBorderGradient>

          {/* Rotating with slower duration */}
          <HoverBorderGradient
            variant="rotating"
            as="button"
            containerClassName="rounded-full"
            className="px-8 py-4 font-semibold text-base"
            duration={2}
          >
            <span>Slow Rotation (2s)</span>
          </HoverBorderGradient>
        </div>
      </section>

      {/* Mouse-Follow Variant Section */}
      <section className="w-full max-w-4xl space-y-6">
        <h3 className="border-b pb-2 font-semibold text-2xl text-foreground">
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
            className="px-6 py-3 font-medium text-sm"
          >
            <span>Mouse-Follow Button</span>
          </HoverBorderGradient>

          {/* Mouse-follow Card */}
          <HoverBorderGradient
            variant="mouse-follow"
            containerClassName="rounded-lg"
            className="w-64 p-6"
            duration={1.5}
          >
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-lg">Interactive Card</h4>
              <p className="text-muted-foreground text-sm">
                Move your mouse over this card to see the gradient follow your cursor.
              </p>
            </div>
          </HoverBorderGradient>

          {/* Large gradient effect */}
          <HoverBorderGradient
            variant="mouse-follow"
            containerClassName="rounded-xl"
            className="w-96 p-8"
            size={800}
            duration={2}
          >
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-xl">Large Gradient Effect</h4>
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
        <h3 className="border-b pb-2 font-semibold text-2xl text-foreground">
          Side-by-Side Comparison
        </h3>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col items-center gap-4">
            <p className="font-medium text-muted-foreground text-sm">Rotating Variant</p>
            <HoverBorderGradient
              variant="rotating"
              as="button"
              containerClassName="rounded-full"
              className="px-8 py-4"
            >
              <span>Hover Me</span>
            </HoverBorderGradient>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li>✓ Automatic rotation animation</li>
              <li>✓ Directional gradient pattern</li>
              <li>✓ Highlight effect on hover</li>
              <li>✓ Best for buttons and CTAs</li>
            </ul>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="font-medium text-muted-foreground text-sm">Mouse-Follow Variant</p>
            <HoverBorderGradient
              variant="mouse-follow"
              as="button"
              containerClassName="rounded-full"
              className="px-8 py-4"
            >
              <span>Hover Me</span>
            </HoverBorderGradient>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li>✓ Interactive cursor tracking</li>
              <li>✓ Radial glow effect</li>
              <li>✓ Smooth mouse following</li>
              <li>✓ Best for cards and containers</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
