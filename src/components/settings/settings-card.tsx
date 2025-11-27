/**
 * Settings Card Component
 *
 * Reusable card wrapper for settings sections with consistent styling.
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

interface SettingsCardProps {
	/** Card title */
	title: string;
	/** Optional description */
	description?: string;
	/** Icon to display in header */
	icon?: LucideIcon;
	/** Card content */
	children: ReactNode;
	/** Additional className for content */
	contentClassName?: string;
	/** Test ID for testing */
	testId?: string;
}

export function SettingsCard({
	title,
	description,
	icon: Icon,
	children,
	contentClassName,
	testId,
}: SettingsCardProps) {
	return (
		<Card variant="glass" data-testid={testId}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{Icon && <Icon className="h-5 w-5 text-primary" />}
					{title}
				</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent className={contentClassName}>{children}</CardContent>
		</Card>
	);
}
