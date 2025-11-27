import type {
	DragEndEvent,
	DragStartEvent,
	UniqueIdentifier,
} from '@dnd-kit/core';
import {
	DndContext,
	DragOverlay,
	MouseSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { addMinutes, differenceInMinutes } from 'date-fns';
import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

import type { CalendarEvent, EventColor } from './types';
import { useFinancialEventMutations } from '@/hooks/useFinancialEvents';

// Define the context type
interface CalendarDndContextType {
	activeEvent: CalendarEvent | null;
	activeId: UniqueIdentifier | null;
	isUpdating: boolean;
}

// Create the context
const CalendarDndContext = createContext<CalendarDndContextType>({
	activeEvent: null,
	activeId: null,
	isUpdating: false,
});

// Hook to use the context
export const useCalendarDnd = () => useContext(CalendarDndContext);

// Props for the provider
interface CalendarDndProviderProps {
	children: ReactNode;
	onEventUpdate?: (event: CalendarEvent) => void;
}

export function CalendarDndProvider({
	children,
	onEventUpdate,
}: CalendarDndProviderProps) {
	const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
	const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);

	// Use Supabase mutations for persistence
	const { updateEvent } = useFinancialEventMutations();

	// Configure sensors for better drag detection
	const sensors = useSensors(
		useSensor(MouseSensor, {
			// Require the mouse to move by 5px before activating
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(PointerSensor, {
			// Require pointer to move by 5px before activating
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(TouchSensor, {
			// Require touch to move by 10px before activating
			activationConstraint: {
				delay: 200,
				tolerance: 10,
			},
		}),
	);

	// Handle drag start
	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;

		// Find the event being dragged
		// Note: This assumes the active.id corresponds to the event.id
		// You might need to adapt this based on your event structure
		const draggedEvent = {
			id: active.id as string,
			title: `Event ${active.id}`, // This would come from your actual event data
			start: new Date(),
			end: new Date(),
		} as CalendarEvent;

		setActiveEvent(draggedEvent);
		setActiveId(active.id);
	};

	// Handle drag end
	const handleDragEnd = async (event: DragEndEvent) => {
		const { over } = event;

		try {
			// If there's no drop target, exit early
			if (!over) {
				return;
			}

			// Get the dragged event from your event data
			// This would typically come from your calendar state
			const draggedEvent = activeEvent;
			if (!draggedEvent) {
				return;
			}

			// Calculate the time change based on drop position
			// This assumes you're using a time grid where y-position represents time
			const delta = event.delta;
			if (!delta) {
				return;
			}

			// Calculate new time based on vertical movement (delta.y)
			const HOUR_HEIGHT = 60; // pixels per hour (must match time-grid.tsx)
			const minutesMoved = Math.round((delta.y / HOUR_HEIGHT) * 60);

			// Calculate new dates
			const newStart = addMinutes(draggedEvent.start, minutesMoved);
			const duration = differenceInMinutes(
				draggedEvent.end,
				draggedEvent.start,
			);
			const newEnd = addMinutes(newStart, duration);

			// Only update if the start time has actually changed
			const hasStartTimeChanged =
				draggedEvent.start.getFullYear() !== newStart.getFullYear() ||
				draggedEvent.start.getMonth() !== newStart.getMonth() ||
				draggedEvent.start.getDate() !== newStart.getDate() ||
				draggedEvent.start.getHours() !== newStart.getHours() ||
				draggedEvent.start.getMinutes() !== newStart.getMinutes();

			if (hasStartTimeChanged) {
				setIsUpdating(true);

				try {
					// Create the updated event object
					const updatedEvent = {
						...draggedEvent,
						start: newStart,
						end: newEnd,
					};

					// Convert CalendarEvent to FinancialEvent format for database
					const financialEventUpdate = {
						color: updatedEvent.color as EventColor,
						end: newEnd,
						start: newStart, // Type-safe color assignment
					};

					// Persist to Supabase
					await updateEvent(draggedEvent.id, financialEventUpdate);

					// Call the original callback for local state updates
					if (onEventUpdate) {
						onEventUpdate(updatedEvent);
					}
				} catch (_error) {
					// Here you could show a toast notification to the user
				} finally {
					setIsUpdating(false);
				}
			} else {
			}
		} catch (_error) {
		} finally {
			// Always reset state
			setActiveEvent(null);
			setActiveId(null);
		}
	};

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<CalendarDndContext.Provider
				value={{
					activeEvent,
					activeId,
					isUpdating,
				}}
			>
				{children}

				<DragOverlay dropAnimation={null}>
					{activeEvent ? (
						<div
							className={`rounded-md border-2 border-primary bg-primary/20 p-2 shadow-lg ${isUpdating ? 'opacity-50' : ''}`}
						>
							<div className="font-medium text-sm">
								{activeEvent.title}
								{isUpdating && ' (Updating...)'}
							</div>
						</div>
					) : null}
				</DragOverlay>
			</CalendarDndContext.Provider>
		</DndContext>
	);
}
