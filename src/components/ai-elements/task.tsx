import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface TaskItem {
	id: string;
	title: string;
	status: TaskStatus;
	progress?: number;
	subtasks?: TaskItem[];
}

export interface TaskProps {
	tasks?: TaskItem[];
	className?: string;
	children?: ReactNode;
}

/**
 * ai-sdk.dev Elements Task wrapper
 * Provides semantic structure for AI task tracking display
 */
export function Task({ tasks = [], className, children }: TaskProps) {
	const completedCount = tasks.filter((t) => t.status === 'completed').length;
	const totalCount = tasks.length;

	return (
		<section
			aria-label="Tarefas em andamento"
			className={cn('ai-tasks', className)}
			data-task-count={totalCount}
			data-completed-count={completedCount}
		>
			{children}
		</section>
	);
}
