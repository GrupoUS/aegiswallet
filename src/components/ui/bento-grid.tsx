"use client";

/**
 * Bento Grid Component - Adapted for AegisWallet
 * 
 * A flexible grid layout component with animated cards featuring various content types.
 * Adapted from KokonutUI with OKLCH colors and AegisWallet branding.
 * 
 * @author: @dorian_baffier (original), adapted for AegisWallet
 * @version: 1.0.0 (AegisWallet)
 * @license: MIT
 */

import { cn } from "@/lib/utils";
import {
    CheckCircle2,
    Clock,
    Sparkles,
    Zap,
    ArrowUpRight,
} from "lucide-react";
import {
    motion,
    useMotionValue,
    useTransform,
    type Variants,
} from "motion/react";
import { useState, useEffect, useRef } from "react";

export interface BentoItem {
    id: string;
    title: string;
    description: string;
    href?: string;
    feature?:
        | "chart"
        | "counter"
        | "timeline"
        | "spotlight"
        | "typing"
        | "metrics";
    spotlightItems?: string[];
    timeline?: Array<{ year: string; event: string }>;
    typingText?: string;
    metrics?: Array<{
        label: string;
        value: number;
        suffix?: string;
        color?: string;
    }>;
    statistic?: {
        value: string;
        label: string;
        start?: number;
        end?: number;
        suffix?: string;
    };
    size?: "sm" | "md" | "lg";
    className?: string;
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut",
        },
    },
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.3,
        },
    },
};

const SpotlightFeature = ({ items }: { items: string[] }) => {
    return (
        <ul className="mt-2 space-y-1.5">
            {items.map((item, index) => (
                <motion.li
                    key={`spotlight-${item.toLowerCase().replace(/\s+/g, "-")}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-2"
                >
                    <CheckCircle2 className="h-4 w-4 text-[oklch(0.5854_0.2041_277.1173)] dark:text-[oklch(0.9376_0.0260_321.9388)] flex-shrink-0" />
                    <span className="text-sm text-foreground/70 dark:text-foreground/60">
                        {item}
                    </span>
                </motion.li>
            ))}
        </ul>
    );
};

const CounterAnimation = ({
    start,
    end,
    suffix = "",
}: {
    start: number;
    end: number;
    suffix?: string;
}) => {
    const [count, setCount] = useState(start);

    useEffect(() => {
        const duration = 2000;
        const frameRate = 1000 / 60;
        const totalFrames = Math.round(duration / frameRate);

        let currentFrame = 0;
        const counter = setInterval(() => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            const easedProgress = 1 - (1 - progress) ** 3;
            const current = start + (end - start) * easedProgress;

            setCount(Math.min(current, end));

            if (currentFrame === totalFrames) {
                clearInterval(counter);
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [start, end]);

    return (
        <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
                {count.toFixed(1).replace(/\.0$/, "")}
            </span>
            <span className="text-xl font-medium text-foreground">
                {suffix}
            </span>
        </div>
    );
};

const ChartAnimation = ({ value }: { value: number }) => {
    return (
        <div className="mt-2 w-full h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
                className="h-full bg-[oklch(0.5854_0.2041_277.1173)] dark:bg-[oklch(0.9376_0.0260_321.9388)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            />
        </div>
    );
};

const TimelineFeature = ({
    timeline,
}: {
    timeline: Array<{ year: string; event: string }>;
}) => {
    return (
        <div className="mt-3 relative">
            <div className="absolute top-0 bottom-0 left-[9px] w-[2px] bg-border" />
            {timeline.map((item) => (
                <motion.div
                    key={`timeline-${item.year}-${item.event
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    className="flex gap-3 mb-3 relative"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        delay: (0.15 * Number.parseInt(item.year)) % 10,
                    }}
                >
                    <div className="w-5 h-5 rounded-full bg-background border-2 border-[oklch(0.5854_0.2041_277.1173)] dark:border-[oklch(0.9376_0.0260_321.9388)] flex-shrink-0 z-10 mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-foreground">
                            {item.year}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {item.event}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

const TypingCodeFeature = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text[currentIndex]);
                setCurrentIndex((prev) => prev + 1);

                if (terminalRef.current) {
                    terminalRef.current.scrollTop =
                        terminalRef.current.scrollHeight;
                }
            }, Math.random() * 30 + 10);

            return () => clearTimeout(timeout);
        }
    }, [currentIndex, text]);

    useEffect(() => {
        setDisplayedText("");
        setCurrentIndex(0);
    }, []);

    return (
        <div className="mt-3 relative">
            <div className="flex items-center gap-2 mb-2">
                <div className="text-xs text-muted-foreground">
                    server.ts
                </div>
            </div>
            <div
                ref={terminalRef}
                className="bg-[oklch(0.1190_0.0319_143.2409)] text-foreground p-3 rounded-md text-xs font-mono h-[150px] overflow-y-auto"
            >
                <pre className="whitespace-pre-wrap">
                    {displayedText}
                    <span className="animate-pulse">|</span>
                </pre>
            </div>
        </div>
    );
};

const MetricsFeature = ({
    metrics,
}: {
    metrics: Array<{
        label: string;
        value: number;
        suffix?: string;
        color?: string;
    }>;
}) => {
    const getColorClass = (color = "primary") => {
        const colors = {
            primary: "bg-[oklch(0.5854_0.2041_277.1173)] dark:bg-[oklch(0.9376_0.0260_321.9388)]",
            accent: "bg-[oklch(0.9376_0.0260_321.9388)] dark:bg-[oklch(0.5854_0.2041_277.1173)]",
            secondary: "bg-[oklch(0.8687_0.0043_56.3660)]",
        };
        return colors[color as keyof typeof colors] || colors.primary;
    };

    return (
        <div className="mt-3 space-y-3">
            {metrics.map((metric, index) => (
                <motion.div
                    key={`metric-${metric.label
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    className="space-y-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 * index }}
                >
                    <div className="flex justify-between items-center text-sm">
                        <div className="text-foreground/70 font-medium flex items-center gap-1.5">
                            {metric.label === "Uptime" && (
                                <Clock className="w-3.5 h-3.5" />
                            )}
                            {metric.label === "Response time" && (
                                <Zap className="w-3.5 h-3.5" />
                            )}
                            {metric.label === "Cost reduction" && (
                                <Sparkles className="w-3.5 h-3.5" />
                            )}
                            {metric.label}
                        </div>
                        <div className="text-foreground/70 font-semibold">
                            {metric.value}
                            {metric.suffix}
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${getColorClass(
                                metric.color
                            )}`}
                            initial={{ width: 0 }}
                            animate={{
                                width: `${Math.min(100, metric.value)}%`,
                            }}
                            transition={{
                                duration: 1.2,
                                ease: "easeOut",
                                delay: 0.15 * index,
                            }}
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export const BentoCard = ({ item }: { item: BentoItem }) => {
    const [isHovered, setIsHovered] = useState(false);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [2, -2]);
    const rotateY = useTransform(x, [-100, 100], [-2, 2]);

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct * 100);
        y.set(yPct * 100);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
        setIsHovered(false);
    }

    const Comp = item.href ? "a" : "div";

    return (
        <motion.div
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-full"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
        >
            <Comp
                href={item.href || undefined}
                className={cn(
                    "group relative flex flex-col gap-4 h-full rounded-xl p-5",
                    "bg-card border border-border",
                    "hover:border-[oklch(0.5854_0.2041_277.1173)] dark:hover:border-[oklch(0.9376_0.0260_321.9388)]",
                    "hover:shadow-lg hover:shadow-primary/10",
                    "transition-all duration-500 ease-out",
                    item.className
                )}
                tabIndex={0}
                aria-label={`${item.title} - ${item.description}`}
            >
                <div
                    className="relative z-10 flex flex-col gap-3 h-full"
                    style={{ transform: "translateZ(20px)" }}
                >
                    <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                                {item.title}
                            </h3>
                            {item.href && (
                                <div className="text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground tracking-tight">
                            {item.description}
                        </p>

                        {/* Feature specific content */}
                        {item.feature === "spotlight" &&
                            item.spotlightItems && (
                                <SpotlightFeature items={item.spotlightItems} />
                            )}

                        {item.feature === "counter" && item.statistic && (
                            <div className="mt-auto pt-3">
                                <CounterAnimation
                                    start={item.statistic.start || 0}
                                    end={item.statistic.end || 100}
                                    suffix={item.statistic.suffix}
                                />
                            </div>
                        )}

                        {item.feature === "chart" && item.statistic && (
                            <div className="mt-auto pt-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-foreground/70">
                                        {item.statistic.label}
                                    </span>
                                    <span className="text-sm font-medium text-foreground/70">
                                        {item.statistic.end}
                                        {item.statistic.suffix}
                                    </span>
                                </div>
                                <ChartAnimation
                                    value={item.statistic.end || 0}
                                />
                            </div>
                        )}

                        {item.feature === "timeline" && item.timeline && (
                            <TimelineFeature timeline={item.timeline} />
                        )}

                        {item.feature === "typing" && item.typingText && (
                            <TypingCodeFeature text={item.typingText} />
                        )}

                        {item.feature === "metrics" && item.metrics && (
                            <MetricsFeature metrics={item.metrics} />
                        )}
                    </div>
                </div>
            </Comp>
        </motion.div>
    );
};

export interface BentoGridProps {
    items: BentoItem[];
    className?: string;
}

export default function BentoGrid({ items, className }: BentoGridProps) {
    return (
        <section className={cn("relative py-12 overflow-hidden", className)}>
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid gap-6"
            >
                {items.map((item) => (
                    <BentoCard key={item.id} item={item} />
                ))}
            </motion.div>
        </section>
    );
}
