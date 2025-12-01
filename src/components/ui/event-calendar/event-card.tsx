import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';

import type { CalendarEvent, EventPosition } from './types';
import { EVENT_COLOR_STYLES } from './types';
import { cn } from '@/lib/utils';

interface EventCardProps {
	event: CalendarEvent;
	position: EventPosition;
	onEdit?: (event: CalendarEvent) => void;
	onDelete?: (eventId: string) => void;
}

export function EventCard({ event, position, onEdit }: EventCardProps) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		data: event,
		id: event.id,
	});
	const colorTokens = EVENT_COLOR_STYLES[event.color] ?? EVENT_COLOR_STYLES.blue;

	const style = {
		height: `${position.height}px`,
		left: position.left,
		opacity: isDragging ? 0.5 : 1,
		position: 'absolute' as const,
		top: `${position.top}px`,
		transform: CSS.Translate.toString(transform),
		width: position.width,
		zIndex: isDragging ? 50 : 10,
	};

	return (
		<button
			ref={setNodeRef}
			type="button"
			style={style}
			{...listeners}
			{...attributes}
			onClick={() => onEdit?.(event)}
			aria-label={`Editar evento: ${event.title}`}
			className={cn(
				'block',
				'border-l-4',
				'cursor-move',
				'hover:shadow-md',
				'overflow-hidden',
				'p-2',
				'pointer-events-auto',
				'rounded-md',
				'text-left',
				'text-sm',
				'transition-shadow',
				colorTokens.subtleBg,
				colorTokens.border,
				colorTokens.text,
				colorTokens.dot.replace('bg-', 'border-l-'),
			)}
		>
			<div className="truncate font-medium">{event.title}</div>
			{!event.allDay && (
				<div className="mt-1 text-xs opacity-80">
					{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
				</div>
			)}
		</button>
	);
}
