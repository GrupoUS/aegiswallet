/**
 * Gradient Components Demo
 * 
 * This file demonstrates the usage of gradient button and hover border gradient components
 * in the AegisWallet application. These components are designed to enhance the visual
 * appeal of CTAs and interactive elements while maintaining brand consistency.
 * 
 * @see src/components/ui/gradient-button.tsx
 * @see src/components/ui/hover-border-gradient.tsx
 */

import { GradientButton } from "@/components/ui/gradient-button"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Shield, CheckCircle, CreditCard } from "lucide-react"

export function GradientComponentsDemo() {
  return (
    <div className="container mx-auto p-8 space-y-12">
      {/* Gradient Button Examples */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Gradient Buttons</h2>
          <p className="text-muted-foreground">
            Stylish gradient buttons with three variants aligned to AegisWallet's brand colors
          </p>
        </div>

        {/* Primary Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Variant</CardTitle>
            <CardDescription>
              Purple to Pink gradient - Perfect for main CTAs and important actions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <GradientButton variant="primary" size="sm">
              Small Button
            </GradientButton>
            <GradientButton variant="primary">
              Default Button
            </GradientButton>
            <GradientButton variant="primary" size="lg">
              Large Button
            </GradientButton>
            <GradientButton variant="primary">
              <CreditCard className="size-4" />
              Make Payment
              <ArrowRight className="size-4" />
            </GradientButton>
          </CardContent>
        </Card>

        {/* Trust Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Trust Variant</CardTitle>
            <CardDescription>
              Purple to Blue gradient - Ideal for secure transactions and financial operations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <GradientButton variant="trust" size="sm">
              Small Secure
            </GradientButton>
            <GradientButton variant="trust">
              Secure Transaction
            </GradientButton>
            <GradientButton variant="trust" size="lg">
              Large Secure
            </GradientButton>
            <GradientButton variant="trust">
              <Shield className="size-4" />
              Verify Identity
              <ArrowRight className="size-4" />
            </GradientButton>
          </CardContent>
        </Card>

        {/* Success Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Success Variant</CardTitle>
            <CardDescription>
              Primary to Secondary gradient - Best for completed actions and confirmations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <GradientButton variant="success" size="sm">
              Small Success
            </GradientButton>
            <GradientButton variant="success">
              Confirm Action
            </GradientButton>
            <GradientButton variant="success" size="lg">
              Large Success
            </GradientButton>
            <GradientButton variant="success">
              <CheckCircle className="size-4" />
              Transaction Complete
            </GradientButton>
          </CardContent>
        </Card>
      </section>

      {/* Hover Border Gradient Examples */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Hover Border Gradient</h2>
          <p className="text-muted-foreground">
            Animated gradient border that follows mouse movement - Perfect for premium features
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interactive Cards</CardTitle>
            <CardDescription>
              Hover over the cards to see the animated gradient border effect
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example 1: Premium Feature Card */}
            <HoverBorderGradient className="p-6">
              <div className="space-y-3">
                <Shield className="size-8 text-primary" />
                <h3 className="text-lg font-semibold">Premium Security</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced encryption and multi-factor authentication for your financial data
                </p>
                <GradientButton variant="primary" size="sm" className="w-full">
                  Learn More
                </GradientButton>
              </div>
            </HoverBorderGradient>

            {/* Example 2: Feature Highlight */}
            <HoverBorderGradient className="p-6">
              <div className="space-y-3">
                <CreditCard className="size-8 text-primary" />
                <h3 className="text-lg font-semibold">Smart Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Automated bill payments and intelligent spending insights
                </p>
                <GradientButton variant="trust" size="sm" className="w-full">
                  Activate Now
                </GradientButton>
              </div>
            </HoverBorderGradient>

            {/* Example 3: Success Story */}
            <HoverBorderGradient className="p-6">
              <div className="space-y-3">
                <CheckCircle className="size-8 text-primary" />
                <h3 className="text-lg font-semibold">95% Automation</h3>
                <p className="text-sm text-muted-foreground">
                  Join thousands of Brazilians automating their finances
                </p>
                <GradientButton variant="success" size="sm" className="w-full">
                  Get Started
                </GradientButton>
              </div>
            </HoverBorderGradient>
          </CardContent>
        </Card>

        {/* Combined Example */}
        <Card>
          <CardHeader>
            <CardTitle>Combined Usage</CardTitle>
            <CardDescription>
              Gradient buttons inside hover border gradient containers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HoverBorderGradient className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <h3 className="text-2xl font-bold">Start Your Financial Journey</h3>
                <p className="text-muted-foreground max-w-md">
                  Experience the power of AI-driven financial management with AegisWallet.
                  Voice-first, secure, and designed for the Brazilian market.
                </p>
                <div className="flex gap-4">
                  <GradientButton variant="primary" size="lg">
                    Create Account
                    <ArrowRight className="size-4" />
                  </GradientButton>
                  <GradientButton variant="trust" size="lg">
                    <Shield className="size-4" />
                    Learn More
                  </GradientButton>
                </div>
              </div>
            </HoverBorderGradient>
          </CardContent>
        </Card>
      </section>

      {/* Usage Guidelines */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Usage Guidelines</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Gradient Button Variants:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Primary:</strong> Main CTAs, payment actions, important user flows</li>
                <li><strong>Trust:</strong> Security features, identity verification, sensitive operations</li>
                <li><strong>Success:</strong> Confirmations, completed actions, positive feedback</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Hover Border Gradient:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use for premium features and special promotions</li>
                <li>Best suited for desktop experiences (hover effect)</li>
                <li>Combine with gradient buttons for enhanced visual hierarchy</li>
                <li>Avoid overuse - reserve for truly important elements</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Accessibility:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>All components support keyboard navigation</li>
                <li>Proper focus states are maintained</li>
                <li>Color contrast meets WCAG AA standards</li>
                <li>Works in both light and dark modes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default GradientComponentsDemo
