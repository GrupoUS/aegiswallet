# HoverBorderGradient Component Guide

## Overview

The `HoverBorderGradient` component provides animated gradient border effects with two distinct variants:

1. **Rotating Variant** (Aceternity UI style) - Directional gradient that rotates around the border
2. **Mouse-Follow Variant** (default) - Radial gradient that follows mouse cursor

## Installation

This component is already integrated into your AegisWallet project with all required dependencies:

- ✅ `motion` (Framer Motion) - For smooth animations
- ✅ `tailwindcss` - For styling
- ✅ TypeScript - For type safety
- ✅ `@/lib/utils` - For className merging

## Usage

### Basic Import

```tsx
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
```

### Rotating Variant (Aceternity UI Style)

Perfect for buttons, CTAs, and elements that need constant visual interest.

```tsx
<HoverBorderGradient
  variant="rotating"
  as="button"
  containerClassName="rounded-full"
  className="px-6 py-3"
>
  <span>Click Me</span>
</HoverBorderGradient>
```

**Features:**
- Automatic rotation animation
- Directional gradient pattern
- Highlight effect on hover
- Configurable rotation direction (clockwise/counter-clockwise)
- Adjustable rotation speed

### Mouse-Follow Variant (Default)

Ideal for cards, containers, and interactive elements.

```tsx
<HoverBorderGradient
  variant="mouse-follow"
  containerClassName="rounded-lg"
  className="p-6"
  size={600}
>
  <div>Your content here</div>
</HoverBorderGradient>
```

**Features:**
- Interactive cursor tracking
- Radial glow effect
- Smooth mouse following
- Configurable gradient size
- Static gradient when not hovered

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Content to wrap with gradient effect |
| `variant` | `"rotating" \| "mouse-follow"` | `"mouse-follow"` | Type of gradient animation |
| `as` | `React.ElementType` | `"button"` | HTML element to render |
| `containerClassName` | `string` | `undefined` | Classes for outer container |
| `className` | `string` | `undefined` | Classes for inner content wrapper |
| `duration` | `number` | `1` | Animation duration in seconds |
| `clockwise` | `boolean` | `true` | Rotation direction (rotating variant only) |
| `size` | `number` | `600` | Gradient size in pixels (mouse-follow variant only) |

## Examples

### 1. Rotating Button with Custom Speed

```tsx
<HoverBorderGradient
  variant="rotating"
  as="button"
  duration={2}
  clockwise={false}
  containerClassName="rounded-full"
  className="px-8 py-4 font-semibold"
>
  Slow Counter-clockwise
</HoverBorderGradient>
```

### 2. Mouse-Follow Card

```tsx
<HoverBorderGradient
  variant="mouse-follow"
  containerClassName="rounded-xl"
  className="p-8 w-96"
  size={800}
>
  <div className="space-y-4">
    <h3 className="text-xl font-bold">Card Title</h3>
    <p>Card content with interactive gradient border</p>
  </div>
</HoverBorderGradient>
```

### 3. Link with Rotating Gradient

```tsx
<HoverBorderGradient
  variant="rotating"
  as="a"
  href="/dashboard"
  containerClassName="rounded-md"
  className="px-4 py-2"
>
  Go to Dashboard
</HoverBorderGradient>
```

### 4. Custom Element with Mouse-Follow

```tsx
<HoverBorderGradient
  variant="mouse-follow"
  as="div"
  containerClassName="rounded-2xl"
  className="p-6 bg-card"
  size={400}
>
  <div className="flex items-center gap-3">
    <div className="h-12 w-12 rounded-full bg-primary" />
    <div>
      <h4 className="font-semibold">Custom Element</h4>
      <p className="text-sm text-muted-foreground">With gradient border</p>
    </div>
  </div>
</HoverBorderGradient>
```

## Styling Tips

### Container Styling
Use `containerClassName` to control the outer wrapper:
- Border radius: `rounded-full`, `rounded-lg`, `rounded-xl`
- Size constraints: `w-fit`, `w-full`, `max-w-md`

### Content Styling
Use `className` to style the inner content:
- Padding: `p-4`, `px-6 py-3`
- Background: `bg-card`, `bg-background`
- Text: `text-sm`, `font-medium`

### Dark Mode Support
Both variants automatically adapt to dark mode using Tailwind's dark mode classes.

## Performance Considerations

- **Rotating Variant**: Uses CSS animations and `setInterval` for rotation
- **Mouse-Follow Variant**: Uses `onMouseMove` event handler
- Both variants use Framer Motion for smooth transitions
- Animations pause when element is not hovered (rotating variant)

## Accessibility

- Supports any HTML element via `as` prop
- Maintains semantic HTML structure
- Preserves all native element attributes
- Works with keyboard navigation when used as button/link

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Requires JavaScript for animation effects
- Gracefully degrades without motion support

## Demo Components

See these files for live examples:
- `src/components/examples/hover-border-gradient-demo.tsx` - Aceternity UI demo
- `src/components/examples/hover-border-gradient-example.tsx` - Comprehensive examples

## Troubleshooting

### Gradient not visible
- Ensure parent container has sufficient space
- Check z-index conflicts
- Verify Tailwind CSS is properly configured

### Animation not smooth
- Adjust `duration` prop for slower/faster animation
- Check for performance issues in parent components
- Ensure Framer Motion is properly installed

### TypeScript errors
- Verify `@/lib/utils` path is correctly configured in tsconfig.json
- Check that all dependencies are installed
- Ensure TypeScript version is 5.0+

## Related Components

- `Button` - Standard button component
- `Card` - Card container component
- `GradientButton` - Alternative gradient button style

## Version History

- **v2.0.0** - Added rotating variant (Aceternity UI style)
- **v1.0.0** - Initial release with mouse-follow variant
