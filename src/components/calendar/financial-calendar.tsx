/* eslint-disable react/jsx-filename-extension */
/**
 * Financial Calendar Component
 * Calendário semanal com eventos financeiros
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useCalendar } from '@/components/calendar/calendar-context';
import { GoogleCalendarSettings } from '@/components/calendar/google-calendar-settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import type { CalendarEvent } from '@/components/ui/event-calendar';
import { EventCalendar } from '@/components/ui/event-calendar';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGoogleCalendarSync } from '@/hooks/use-google-calendar-sync';
import { cn } from '@/lib/utils';
import type { FinancialEvent } from '@/types/financial-events';
import { formatEventAmount } from '@/types/financial-events';

// Converter FinancialEvent para CalendarEvent
function toCalendarEvent(
	event: FinancialEvent,
	isSynced: boolean,
): CalendarEvent {
	return {
		id: event.id,
		title: event.title,
		description: event.description,
		start: new Date(event.start),
		end: new Date(event.end),
		color: event.color,
		allDay: event.allDay,
		// Custom property for sync indicator
		icon: isSynced ? <CalendarIcon className="h-3 w-3" /> : undefined,
	};
}

export function FinancialCalendar() {
	const {
		events: financialEvents,
		addEvent,
		updateEvent,
		categories,
		filters,
	} = useCalendar();
	const [selectedEvent, setSelectedEvent] = useState<FinancialEvent | null>(
		null,
	);
	const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const {
		isConnected,
		settings: syncSettings,
		syncSingleEvent,
		isSyncing,
	} = useGoogleCalendarSync();

	// Mock check for synced events (In real app, we'd check 'calendar_sync_mapping' via a query or prop on event)
	// Since FinancialEvent doesn't have 'isSynced' prop yet, we assume we fetch it or pass it.
	// For now, let's assume all events are potentially synced if the feature is on.
	// Ideally, 'financialEvents' should come joined with sync status.
	// We'll simulate it or add a TODO to update the fetching logic to include sync status.

	// Filtrar eventos baseado nos filtros atuais
	const filteredEvents = useMemo(() => {
		let filtered = financialEvents;

		// Aplicar filtros do contexto
		if (filters.categories && filters.categories.length > 0) {
			filtered = filtered.filter((event) =>
				filters.categories?.includes(event.category || ''),
			);
		}

		if (filters.dateRange) {
			const { start, end } = filters.dateRange;
			filtered = filtered.filter((event) => {
				const eventDate = new Date(event.start);
				return eventDate >= start && eventDate <= end;
			});
		}

		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			filtered = filtered.filter(
				(event) =>
					event.title.toLowerCase().includes(searchLower) ||
					event.description?.toLowerCase().includes(searchLower),
			);
		}

		return filtered;
	}, [financialEvents, filters]);

	// Enhanced converter com categorias
	const calendarEvents = useMemo(() => {
		return filteredEvents.map((event) => {
			// Check sync status (TODO: real check)
			const isSynced = isConnected && syncSettings?.sync_enabled;

			const calendarEvent = toCalendarEvent(event, !!isSynced);

			// Encontrar a categoria correspondente
			const category = categories.find((cat) => cat.id === event.category);
			if (category) {
				calendarEvent.category = category;
				calendarEvent.color = category.color;
			}

			// Adicionar informações adicionais
			const statusMap: Record<string, 'confirmed' | 'tentative' | 'cancelled'> =
				{
					cancelled: 'cancelled',
					completed: 'confirmed',
					paid: 'confirmed',
					pending: 'tentative',
					scheduled: 'confirmed',
				};
			calendarEvent.status = statusMap[event.status] || 'confirmed';
			calendarEvent.priority =
				event.amount && Math.abs(event.amount) > 1000
					? 'high'
					: event.amount && Math.abs(event.amount) > 500
						? 'medium'
						: 'low';
			calendarEvent.isRecurring = event.isRecurring;

			return calendarEvent;
		});
	}, [filteredEvents, categories, isConnected, syncSettings]);

	const handleEventAdd = async (
		calendarEvent: Partial<CalendarEvent>,
	): Promise<void> => {
		try {
			// Converter CalendarEvent para FinancialEvent
			const financialEvent: Partial<FinancialEvent> = {
				title: calendarEvent.title || 'Novo Evento',
				description: calendarEvent.description,
				start: calendarEvent.start || new Date(),
				end: calendarEvent.end || new Date(),
				color: calendarEvent.color || 'blue',
				allDay: calendarEvent.allDay,
				type: 'scheduled', // Default type
				amount: 0, // Default amount
				status: 'scheduled',
				icon: '📅',
			};

			const newEvent = await addEvent(financialEvent as FinancialEvent);

			// Sync if enabled
			if (isConnected && syncSettings?.sync_enabled && newEvent?.id) {
				toast.info('Sincronizando com Google Calendar...');
				await syncSingleEvent({ eventId: newEvent.id, direction: 'to_google' });
			}
		} catch (_error) {
			toast.error('Erro ao criar evento');
		}
	};

	const handleEventUpdate = async (
		calendarEvent: CalendarEvent,
	): Promise<void> => {
		try {
			// Encontrar o evento financeiro original e atualizar
			const financialEvent = financialEvents.find(
				(e) => e.id === calendarEvent.id,
			);
			if (financialEvent) {
				const updatedEvent = await updateEvent({
					...financialEvent,
					title: calendarEvent.title,
					description: calendarEvent.description,
					start: calendarEvent.start,
					end: calendarEvent.end,
					color: calendarEvent.color,
					allDay: calendarEvent.allDay,
				});

				// Sync if enabled
				if (isConnected && syncSettings?.sync_enabled && updatedEvent?.id) {
					// Debounce could be useful here to avoid too many API calls on drag
					syncSingleEvent({ eventId: updatedEvent.id, direction: 'to_google' });
				}
			}
		} catch (_error) {
			toast.error('Erro ao atualizar evento');
		}
	};

	const handleEventEdit = (calendarEvent: CalendarEvent): void => {
		// Encontrar o evento financeiro original para mostrar detalhes completos
		const financialEvent = financialEvents.find(
			(e) => e.id === calendarEvent.id,
		);
		if (financialEvent) {
			setSelectedEvent(financialEvent);
			setIsEventDialogOpen(true);
		}
	};

	return (
		<div className="flex flex-col h-full gap-4">
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-semibold">Calendário Financeiro</h2>
				<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm" className="gap-2">
							<CalendarIcon className="h-4 w-4" />
							{isConnected ? 'Google Conectado' : 'Conectar Google'}
							{isSyncing && <RefreshCw className="h-3 w-3 animate-spin ml-1" />}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Integração Google Calendar</DialogTitle>
							<DialogDescription>
								Sincronize seus eventos financeiros com sua agenda pessoal.
							</DialogDescription>
						</DialogHeader>
						<GoogleCalendarSettings />
					</DialogContent>
				</Dialog>
			</div>

			<EventCalendar
				events={calendarEvents}
				initialView="week"
				onEventAdd={handleEventAdd}
				onEventUpdate={handleEventUpdate}
				onEventEdit={handleEventEdit}
			/>

			{/* Dialog de Detalhes do Evento */}
			<Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<span className="text-2xl">{selectedEvent?.icon}</span>
							{selectedEvent?.title}
							{isConnected && syncSettings?.sync_enabled && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger>
											<Badge variant="secondary" className="ml-2 gap-1">
												<CalendarIcon className="h-3 w-3" />
												Google
											</Badge>
										</TooltipTrigger>
										<TooltipContent>
											<p>Este evento está sincronizado com o Google Calendar</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</DialogTitle>
						<DialogDescription>
							{selectedEvent &&
								format(
									new Date(selectedEvent.start),
									"d 'de' MMMM 'às' HH:mm",
									{
										locale: ptBR,
									},
								)}
						</DialogDescription>
					</DialogHeader>
					{selectedEvent && (
						<div className="space-y-4">
							<div>
								<p className="text-muted-foreground text-sm">Valor</p>
								<p className="font-bold text-2xl">
									{formatEventAmount(selectedEvent.amount)}
								</p>
							</div>
							{selectedEvent.description && (
								<div>
									<p className="text-muted-foreground text-sm">Descrição</p>
									<p>{selectedEvent.description}</p>
								</div>
							)}
							<div>
								<p className="text-muted-foreground text-sm">Status</p>
								<Badge
									className={cn(
										'mt-1',
										selectedEvent.status === 'paid' && 'bg-success',
										selectedEvent.status === 'pending' && 'bg-warning',
										selectedEvent.status === 'scheduled' && 'bg-info',
									)}
								>
									{selectedEvent.status === 'paid' && 'Pago'}
									{selectedEvent.status === 'pending' && 'Pendente'}
									{selectedEvent.status === 'scheduled' && 'Agendado'}
								</Badge>
							</div>
							{selectedEvent.category && (
								<div>
									<p className="text-muted-foreground text-sm">Categoria</p>
									<p className="capitalize">{selectedEvent.category}</p>
								</div>
							)}
							{selectedEvent.isRecurring && (
								<div>
									<Badge variant="outline">Recorrente</Badge>
								</div>
							)}
							<div className="flex gap-2 pt-4">
								<Button variant="outline" className="flex-1">
									Editar
								</Button>
								{selectedEvent.status === 'pending' && (
									<Button className="flex-1">Marcar como Pago</Button>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default FinancialCalendar;
