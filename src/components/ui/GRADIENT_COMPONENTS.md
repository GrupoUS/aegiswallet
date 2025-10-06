# Gradient Components Documentation

## Overview

This document provides comprehensive documentation for the gradient UI components integrated into AegisWallet. These components enhance the visual appeal of CTAs and interactive elements while maintaining brand consistency with the purple/blue theme and OKLCH color system.

## Components

### 1. Gradient Button

**File:** `src/components/ui/gradient-button.tsx`

A stylish gradient button component with three brand-aligned variants, designed for important CTAs and user actions in the AegisWallet application.

#### Features

- ✅ Three gradient variants (Primary, Trust, Success)
- ✅ OKLCH color format for perceptually uniform colors
- ✅ Multiple size options (sm, md, lg, icon variants)
- ✅ Hover effects with enhanced glow
- ✅ Light and dark mode support
- ✅ Fully accessible (keyboard navigation, ARIA labels)
- ✅ No external dependencies (pure CSS)
- ✅ Compatible with React 19 and TypeScript 5.9+

#### Variants

**Primary Variant** (Purple → Pink)
- **Use Case:** Main CTAs, payment actions, important user flows
- **Colors:** `oklch(0.5854 0.2041 277.1173)` → `oklch(0.9376 0.0260 321.9388)`
- **Example:** "Make Payment", "Create Account", "Get Started"

**Trust Variant** (Purple → Blue)
- **Use Case:** Security features, identity verification, sensitive operations
- **Colors:** `oklch(0.5854 0.2041 277.1173)` → `oklch(0.4955 0.0951 170.4045)`
- **Example:** "Verify Identity", "Secure Transaction", "Enable 2FA"

**Success Variant** (Primary → Secondary)
- **Use Case:** Confirmations, completed actions, positive feedback
- **Colors:** `oklch(0.5854 0.2041 277.1173)` → `oklch(0.8687 0.0043 56.3660)`
- **Example:** "Transaction Complete", "Confirm Action", "Save Changes"

#### Usage

```tsx
import { GradientButton } from "@/components/ui/gradient-button"
import { ArrowRight, Shield } from "lucide-react"

// Basic usage
<GradientButton variant="primary">
  Click Me
</GradientButton>

// With icons
<GradientButton variant="trust">
  <Shield className="size-4" />
  Secure Transaction
  <ArrowRight className="size-4" />
</GradientButton>

// Different sizes
<GradientButton variant="success" size="sm">Small</GradientButton>
<GradientButton variant="primary" size="lg">Large</GradientButton>

// As a link (using asChild prop)
<GradientButton variant="primary" asChild>
  <a href="/payment">Make Payment</a>
</GradientButton>
```

#### Props

```typescript
interface GradientButtonProps extends React.ComponentProps<"button"> {
  variant?: "primary" | "trust" | "success"
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"
  asChild?: boolean
  className?: string
}
```

#### Styling Details

The component uses a multi-layered approach for rich visual effects:

1. **Base Gradient:** Main gradient background using OKLCH colors
2. **Hover Overlay:** White overlay with opacity transition on hover
3. **Inner Glow:** Subtle inner glow for depth perception
4. **Shadow Effects:** Dynamic shadows that intensify on hover

---

### 2. Hover Border Gradient

**File:** `src/components/ui/hover-border-gradient.tsx`

An animated gradient border component that follows mouse movement, perfect for highlighting premium features and special content areas.

#### Features

- ✅ Mouse-tracking animated gradient border
- ✅ Smooth transitions and animations
- ✅ OKLCH color format
- ✅ Customizable animation duration and size
- ✅ Light and dark mode support
- ✅ Touch device fallback (static gradient)
- ✅ Requires Framer Motion (`motion` package)

#### Dependencies

**Required:**
- `motion` (Framer Motion) - ~50KB gzipped
- Already added to `package.json`

**Installation:**
```bash
bun install
# or
pnpm install
```

#### Usage

```tsx
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { GradientButton } from "@/components/ui/gradient-button"

// Basic usage
<HoverBorderGradient className="p-6">
  <div>
    <h3>Premium Feature</h3>
    <p>Hover to see the animated border</p>
  </div>
</HoverBorderGradient>

// With custom animation settings
<HoverBorderGradient 
  duration={1.5} 
  size={800}
  className="p-8"
>
  <div>Content here</div>
</HoverBorderGradient>

// Combined with gradient button
<HoverBorderGradient className="p-6">
  <div className="space-y-4">
    <h3>Special Offer</h3>
    <GradientButton variant="primary">
      Claim Now
    </GradientButton>
  </div>
</HoverBorderGradient>

// As a different element (e.g., section)
<HoverBorderGradient as="section" className="p-12">
  <div>Hero content</div>
</HoverBorderGradient>
```

#### Props

```typescript
interface HoverBorderGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  containerClassName?: string
  className?: string
  duration?: number        // Animation duration in seconds (default: 1)
  size?: number           // Gradient circle size in pixels (default: 600)
  as?: React.ElementType  // Element type (default: "div")
}
```

#### Technical Details

**Animation Logic:**
- Tracks mouse position relative to container
- Creates radial gradient centered at mouse position
- Smooth opacity transitions on hover enter/leave
- Uses Framer Motion for performant animations

**Color System:**
- Primary gradient: `oklch(0.5854 0.2041 277.1173)` with 15% opacity
- Static border: Purple to Pink gradient
- Dark mode: Blue-green to Purple gradient

**Performance:**
- Uses `React.useCallback` for optimized event handlers
- Smooth 60fps animations via Framer Motion
- Minimal re-renders with proper state management

---

## Installation Guide

### Step 1: Verify Dependencies

Check that `motion` is in your `package.json`:

```json
{
  "dependencies": {
    "motion": "^11.18.0"
  }
}
```

### Step 2: Install Dependencies

```bash
# Using Bun (recommended for AegisWallet)
bun install

# Or using pnpm
pnpm install
```

### Step 3: Import Components

```tsx
// Individual imports
import { GradientButton } from "@/components/ui/gradient-button"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"

// Or from index (if using barrel exports)
import { GradientButton, HoverBorderGradient } from "@/components/ui"
```

---

## Design Guidelines

### When to Use Gradient Button

✅ **DO USE for:**
- Primary CTAs (payment, signup, important actions)
- Security-related actions (verification, authentication)
- Success confirmations and positive feedback
- High-priority user flows

❌ **DON'T USE for:**
- Secondary or tertiary actions (use regular Button)
- Destructive actions (use destructive variant of Button)
- Frequent, repetitive actions
- Low-priority navigation

### When to Use Hover Border Gradient

✅ **DO USE for:**
- Premium feature highlights
- Special promotions or offers
- Hero sections and landing pages
- Important content cards
- Marketing materials

❌ **DON'T USE for:**
- Every card or container (avoid overuse)
- Mobile-first experiences (hover doesn't work on touch)
- Performance-critical sections
- Frequently repeated elements

### Combining Components

The components work beautifully together:

```tsx
<HoverBorderGradient className="p-8">
  <div className="space-y-4 text-center">
    <h2>Premium Plan</h2>
    <p>Unlock all features</p>
    <GradientButton variant="primary" size="lg">
      Upgrade Now
    </GradientButton>
  </div>
</HoverBorderGradient>
```

---

## Accessibility

Both components follow WCAG 2.1 AA standards:

### Gradient Button
- ✅ Keyboard navigable (Tab, Enter, Space)
- ✅ Focus visible states
- ✅ Proper ARIA attributes
- ✅ Color contrast ≥ 4.5:1
- ✅ Screen reader compatible

### Hover Border Gradient
- ✅ Semantic HTML structure
- ✅ Keyboard navigation preserved
- ✅ Focus states maintained
- ✅ Touch device fallback (static gradient)
- ✅ No motion for users with `prefers-reduced-motion`

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14.1+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note:** OKLCH color support requires modern browsers. Fallbacks are automatically handled by Tailwind CSS.

---

## Performance Considerations

### Gradient Button
- **Bundle Impact:** ~2KB (minified + gzipped)
- **Runtime:** Pure CSS, no JavaScript overhead
- **Rendering:** Hardware-accelerated transforms

### Hover Border Gradient
- **Bundle Impact:** ~52KB (includes Framer Motion)
- **Runtime:** Optimized animations via Framer Motion
- **Rendering:** 60fps animations, GPU-accelerated

**Recommendation:** Use Gradient Button liberally, reserve Hover Border Gradient for special cases.

---

## Troubleshooting

### Issue: "Cannot find module 'motion/react'"

**Solution:**
```bash
bun install
# or
pnpm install
```

### Issue: Colors look different in production

**Cause:** OKLCH color space not supported in older browsers

**Solution:** Tailwind CSS automatically provides fallbacks. Ensure you're using Tailwind CSS v4.1.14+.

### Issue: Hover Border Gradient not animating

**Checks:**
1. Verify `motion` is installed
2. Check browser console for errors
3. Ensure component has `"use client"` directive (React 19)
4. Verify mouse events are not blocked by parent elements

### Issue: TypeScript errors

**Solution:**
```bash
# Regenerate types
bun run types:generate

# Check for errors
bun run type-check
```

---

## Examples

See `src/components/examples/gradient-components-demo.tsx` for comprehensive usage examples including:

- All gradient button variants and sizes
- Hover border gradient with different content types
- Combined usage patterns
- Real-world use cases for AegisWallet

---

## Maintenance

### Updating Colors

To update gradient colors, modify the OKLCH values in the component files:

**Gradient Button:** `src/components/ui/gradient-button.tsx`
```tsx
// Update variant colors
variant: {
  primary: [
    "bg-gradient-to-br from-[oklch(NEW_COLOR)] to-[oklch(NEW_COLOR)]",
    // ...
  ],
}
```

**Hover Border Gradient:** `src/components/ui/hover-border-gradient.tsx`
```tsx
// Update radial gradient color
background: `radial-gradient(..., oklch(NEW_COLOR / 0.15), transparent 40%)`
```

### Adding New Variants

To add a new gradient button variant:

1. Add variant to `gradientButtonVariants` in `gradient-button.tsx`
2. Define gradient colors using OKLCH format
3. Add hover effects and shadows
4. Update TypeScript types
5. Document in this file

---

## Credits

- **Gradient Button:** Inspired by KokonutUI, adapted for AegisWallet
- **Hover Border Gradient:** Inspired by Aceternity UI, adapted for AegisWallet
- **Color System:** AegisWallet brand colors in OKLCH format
- **Integration:** Custom implementation for React 19 + TypeScript 5.9+

---

## Support

For issues or questions:
1. Check this documentation
2. Review example file: `src/components/examples/gradient-components-demo.tsx`
3. Check project documentation: `docs/architecture/`
4. Consult AegisWallet development team

---

**Last Updated:** 2025-01-06
**Version:** 1.0.0
**Maintainer:** AegisWallet Development Team
