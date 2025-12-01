import type React from 'react';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ChatLayoutProps {
	children: React.ReactNode;
	header?: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
}

export function ChatLayout({ children, header, footer, className }: ChatLayoutProps) {
	return (
		<Card className={`w-full h-[600px] flex flex-col ${className}`}>
			{header && (
				<>
					<CardHeader className="py-3">{header}</CardHeader>
					<Separator />
				</>
			)}

			<CardContent className="flex-1 p-0 overflow-hidden relative">
				<ScrollArea className="h-full w-full p-4">{children}</ScrollArea>
			</CardContent>

			{footer && (
				<>
					<Separator />
					<CardFooter className="p-3 bg-muted/20">{footer}</CardFooter>
				</>
			)}
		</Card>
	);
}
