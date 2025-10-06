/**
 * Bento Grid Demo - AegisWallet
 * 
 * Demonstrates the usage of the Bento Grid component with various features
 * and content types tailored for AegisWallet's financial assistant use cases.
 * 
 * @see src/components/ui/bento-grid.tsx
 */

import { BentoGrid, BentoCard, type BentoItem } from "@/components/ui/bento-grid"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Example 1: Financial Dashboard Bento Grid
const financialDashboardItems: BentoItem[] = [
    {
        id: "main-feature",
        title: "Autonomous Financial Management",
        description:
            "AI-powered financial assistant that automates 95% of your financial tasks with voice-first interaction and intelligent decision-making.",
        href: "#",
        feature: "spotlight",
        spotlightItems: [
            "Voice-first interface",
            "95% task automation",
            "PIX integration",
            "Open Banking support",
            "LGPD compliant",
        ],
        size: "lg",
        className: "col-span-2 row-span-1 md:col-span-2 md:row-span-1",
    },
    {
        id: "automation-stats",
        title: "Automation Performance",
        description:
            "Real-time metrics showing your financial automation efficiency",
        href: "#",
        feature: "metrics",
        metrics: [
            {
                label: "Task Automation",
                value: 95,
                suffix: "%",
                color: "primary",
            },
            {
                label: "Time Saved",
                value: 87,
                suffix: "%",
                color: "accent",
            },
            {
                label: "Cost Reduction",
                value: 72,
                suffix: "%",
                color: "secondary",
            },
        ],
        size: "md",
        className: "col-span-2 row-span-1 col-start-1 col-end-3",
    },
    {
        id: "transaction-counter",
        title: "Transactions Processed",
        description: "Total transactions automated this month",
        href: "#",
        feature: "counter",
        statistic: {
            value: "1,247",
            label: "Transactions",
            start: 0,
            end: 1247,
            suffix: "",
        },
        size: "sm",
        className: "col-span-1 row-span-1",
    },
    {
        id: "feature-timeline",
        title: "Feature Roadmap",
        description:
            "Our journey to democratize financial automation in Brazil",
        href: "#",
        feature: "timeline",
        timeline: [
            { year: "2024 Q1", event: "Voice-first interface launch" },
            { year: "2024 Q2", event: "PIX integration & Open Banking" },
            { year: "2024 Q3", event: "AI-powered insights & predictions" },
            { year: "2024 Q4", event: "Multi-bank support & automation" },
            { year: "2025 Q1", event: "Advanced AI agents & workflows" },
        ],
        size: "sm",
        className: "col-span-1 row-span-1",
    },
];

// Example 2: Feature Showcase Bento Grid
const featureShowcaseItems: BentoItem[] = [
    {
        id: "voice-assistant",
        title: "Voice-First Financial Assistant",
        description:
            "Interact with your finances using natural voice commands in Portuguese",
        href: "#",
        feature: "spotlight",
        spotlightItems: [
            "Natural language processing",
            "Brazilian Portuguese support",
            "Context-aware responses",
            "Multi-turn conversations",
        ],
        className: "col-span-1 md:col-span-2",
    },
    {
        id: "automation-level",
        title: "Progressive Automation",
        description: "Build trust gradually from 50% to 95% automation",
        href: "#",
        feature: "chart",
        statistic: {
            value: "95",
            label: "Automation Level",
            start: 50,
            end: 95,
            suffix: "%",
        },
        className: "col-span-1",
    },
    {
        id: "code-example",
        title: "Developer-Friendly API",
        description: "Simple integration with your existing systems",
        href: "#",
        feature: "typing",
        typingText:
            "const aegis = new AegisWallet({\n  apiKey: process.env.AEGIS_API_KEY,\n  language: 'pt-BR',\n  automation: 'progressive'\n});\n\n// Process voice command\nconst result = await aegis.processVoice(\n  'Pagar conta de luz'\n);\n\nconsole.log(result.status); // 'success'",
        className: "col-span-2",
    },
];

// Example 3: Metrics Dashboard Bento Grid
const metricsDashboardItems: BentoItem[] = [
    {
        id: "monthly-savings",
        title: "Monthly Savings",
        description: "Total amount saved through automation",
        href: "#",
        feature: "counter",
        statistic: {
            value: "R$ 2,847",
            label: "Saved",
            start: 0,
            end: 2847,
            suffix: "",
        },
        className: "col-span-1",
    },
    {
        id: "time-saved",
        title: "Time Saved",
        description: "Hours saved this month",
        href: "#",
        feature: "counter",
        statistic: {
            value: "18.5",
            label: "Hours",
            start: 0,
            end: 18.5,
            suffix: "h",
        },
        className: "col-span-1",
    },
    {
        id: "performance-metrics",
        title: "System Performance",
        description: "Real-time performance indicators",
        href: "#",
        feature: "metrics",
        metrics: [
            {
                label: "Uptime",
                value: 99.9,
                suffix: "%",
                color: "primary",
            },
            {
                label: "Response time",
                value: 150,
                suffix: "ms",
                color: "accent",
            },
            {
                label: "Success rate",
                value: 98.5,
                suffix: "%",
                color: "secondary",
            },
        ],
        className: "col-span-2",
    },
];

export function BentoGridDemo() {
    return (
        <div className="container mx-auto p-8 space-y-12">
            {/* Introduction */}
            <section className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Bento Grid Component</h1>
                <p className="text-lg text-muted-foreground">
                    A flexible grid layout component with animated cards featuring various content types.
                    Perfect for dashboards, feature showcases, and content-rich layouts.
                </p>
            </section>

            {/* Example 1: Financial Dashboard */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Financial Dashboard</h2>
                    <p className="text-muted-foreground">
                        Showcase key financial metrics and features with spotlight items, metrics, counters, and timelines
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dashboard Layout</CardTitle>
                        <CardDescription>
                            A comprehensive dashboard showing automation stats, transaction counts, and feature roadmap
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            {financialDashboardItems.map((item) => (
                                <BentoCard key={item.id} item={item} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Example 2: Feature Showcase */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Feature Showcase</h2>
                    <p className="text-muted-foreground">
                        Highlight product features with spotlight lists, progress charts, and code examples
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Feature Grid</CardTitle>
                        <CardDescription>
                            Display voice assistant capabilities, automation levels, and developer API
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            {featureShowcaseItems.map((item) => (
                                <BentoCard key={item.id} item={item} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Example 3: Metrics Dashboard */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Metrics Dashboard</h2>
                    <p className="text-muted-foreground">
                        Display key performance indicators with animated counters and metric bars
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>
                            Real-time metrics showing savings, time saved, and system performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            {metricsDashboardItems.map((item) => (
                                <BentoCard key={item.id} item={item} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Usage Guidelines */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Usage Guidelines</h2>
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Feature Types:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li><strong>spotlight:</strong> List of key features or benefits with checkmarks</li>
                                <li><strong>counter:</strong> Animated number counter with customizable start/end values</li>
                                <li><strong>chart:</strong> Progress bar showing percentage or metric</li>
                                <li><strong>timeline:</strong> Chronological list of events or milestones</li>
                                <li><strong>typing:</strong> Animated code typing effect for developer content</li>
                                <li><strong>metrics:</strong> Multiple progress bars with labels and values</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Best Practices:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>Use spotlight for highlighting key features or benefits</li>
                                <li>Use counters for impressive statistics or achievements</li>
                                <li>Use charts for showing progress or completion percentages</li>
                                <li>Use timelines for roadmaps or historical events</li>
                                <li>Use typing effect for code examples or technical content</li>
                                <li>Use metrics for dashboard-style performance indicators</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Accessibility:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>All cards are keyboard navigable</li>
                                <li>Proper ARIA labels for screen readers</li>
                                <li>Color contrast meets WCAG AA standards</li>
                                <li>Animations respect prefers-reduced-motion</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Code Example */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Code Example</h2>
                <Card>
                    <CardContent className="pt-6">
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`import { BentoGrid, BentoCard, type BentoItem } from "@/components/ui/bento-grid"

const items: BentoItem[] = [
  {
    id: "feature-1",
    title: "Voice-First Interface",
    description: "Natural language processing for Brazilian Portuguese",
    feature: "spotlight",
    spotlightItems: [
      "Natural language processing",
      "Context-aware responses",
      "Multi-turn conversations",
    ],
    className: "col-span-2",
  },
  {
    id: "stats",
    title: "Automation Level",
    description: "Progressive trust building",
    feature: "counter",
    statistic: {
      start: 50,
      end: 95,
      suffix: "%",
    },
    className: "col-span-1",
  },
]

export function MyDashboard() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {items.map((item) => (
        <BentoCard key={item.id} item={item} />
      ))}
    </div>
  )
}`}
                        </pre>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

export default BentoGridDemo
