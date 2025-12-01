/**
 * Compact Calendar Component
 * Mini calendário para dashboard com indicadores de eventos
 */

import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useCalendar } from '@/components/calendar/hooks/useCalendar';
import { Calendar } from '@/components/ui/calendar';
import { EVENT_COLOR_STYLES } from '@/components/ui/event-calendar/types';
import { cn } from '@/lib/utils';
import type { FinancialEvent } from '@/types/financial-events';

interface CompactCalendarProps {
	selectedDate?: Date;
	onDateClick?: (date: Date) => void;
	className?: string;
}

export function CompactCalendar({ selectedDate, onDateClick, className }: CompactCalendarProps) {
	const { currentDate, setCurrentDate, getEventsForMonth } = useCalendar();

	const eventsInMonth = getEventsForMonth(currentDate);

	const getEventsForDay = (date: Date): FinancialEvent[] => {
		return eventsInMonth.filter((event) => isSameDay(new Date(event.start), date));
	};

	const handleSelect = (date: Date | undefined) => {
		if (date) {
			if (onDateClick) {
				onDateClick(date);
			}
		}
	};

	return (
		<div className={className}>
			<div className="mb-2 text-center font-semibold text-sm">
				{format(currentDate, 'MMMM yyyy', { locale: ptBR })}
			</div>
			<Calendar
				mode="single"
				selected={selectedDate}
				onSelect={handleSelect}
				month={currentDate}
				onMonthChange={setCurrentDate}
				className={cn('rounded-md [--cell-size:1.75rem]')}
				components={{
					// biome-ignore lint/correctness/noNestedComponentDefinitions: react-day-picker requires inline component definition for custom day rendering
					DayButton: ({ day, ...props }) => {
						const dayEvents = getEventsForDay(day.date);
						const hasEvents = dayEvents.length > 0;

						return (
							<button
								{...props}
								className={cn(
									props.className,
									'relative flex flex-col items-center justify-center text-xs',
								)}
							>
								<span>{day.date.getDate()}</span>
								{hasEvents && (
									<div className="-translate-x-1/2 absolute bottom-0.5 left-1/2 flex gap-0.5">
										{dayEvents.slice(0, 2).map((event) => (
											<div
												key={event.id}
												className={cn(
													'h-1 w-1 rounded-full',
													(EVENT_COLOR_STYLES[event.color] ?? EVENT_COLOR_STYLES.blue).dot,
												)}
											/>
										))}
									</div>
								)}
							</button>
						);
					},
				}}
			/>
		</div>
	);
}
