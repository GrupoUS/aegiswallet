import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';

import type { ChatTask } from '../domain/types';
import { Task } from '@/components/ai-elements';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChatTasksProps {
	tasks: ChatTask[];
	className?: string;
}

export function ChatTasks({ tasks, className }: ChatTasksProps) {
	if (tasks.length === 0) return null;

	const getStatusIcon = (status: ChatTask['status']) => {
		switch (status) {
			case 'completed':
				return <CheckCircle2 className="w-4 h-4 text-green-500" />;
			case 'in-progress':
				return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
			case 'failed':
				return <XCircle className="w-4 h-4 text-red-500" />;
			default:
				return <Circle className="w-4 h-4 text-muted-foreground" />;
		}
	};

	const getStatusColor = (status: ChatTask['status']) => {
		switch (status) {
			case 'completed':
				return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
			case 'in-progress':
				return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
			case 'failed':
				return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
			default:
				return 'bg-muted text-muted-foreground';
		}
	};

	return (
		<Task tasks={tasks} className={className}>
			<div className={cn('space-y-4')}>
				{tasks.map((task) => (
					<Card
						key={task.id}
						className="overflow-hidden border-l-4 border-l-primary"
					>
						<CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-sm font-medium flex items-center gap-2">
								{getStatusIcon(task.status)}
								{task.title}
							</CardTitle>
							<Badge
								variant="secondary"
								className={cn(
									'capitalize text-[10px]',
									getStatusColor(task.status),
								)}
							>
								{task.status}
							</Badge>
						</CardHeader>
						<CardContent className="p-4 pt-2 space-y-3">
							{typeof task.progress === 'number' && (
								<div className="space-y-1">
									<div className="flex justify-between text-[10px] text-muted-foreground">
										<span>Progresso</span>
										<span>{task.progress}%</span>
									</div>
									<Progress value={task.progress} className="h-1.5" />
								</div>
							)}

							{task.subtasks && task.subtasks.length > 0 && (
								<div className="space-y-2 mt-2 pl-2 border-l">
									{task.subtasks.map((subtask) => (
										<div
											key={subtask.id}
											className="flex items-center gap-2 text-xs text-muted-foreground"
										>
											{getStatusIcon(subtask.status)}
											<span
												className={cn(
													subtask.status === 'completed' &&
														'line-through opacity-70',
												)}
											>
												{subtask.title}
											</span>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>
		</Task>
	);
}
