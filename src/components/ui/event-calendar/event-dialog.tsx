import { zodResolver } from '@hookform/resolvers/zod';
import { addHours, format, setHours, setMinutes } from 'date-fns';
import { useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import type { CalendarEvent, EventColor } from './types';
import { EVENT_COLOR_STYLES } from './types';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const baseEventFormSchema = z.object({
	allDay: z.boolean().optional(),
	color: z.enum([
		'emerald',
		'rose',
		'orange',
		'blue',
		'violet',
		'indigo',
		'amber',
		'red',
		'green',
		'yellow',
		'purple',
		'pink',
		'teal',
		'cyan',
	]),
	date: z.string(),
	description: z.string().optional(),
	endTime: z.string(),
	recurrenceRule: z.string().optional(),
	recurring: z.boolean().optional(),
	startTime: z.string(),
	title: z.string().min(1, 'Título é obrigatório'),
});

const eventFormSchema = baseEventFormSchema.transform((values) => ({
	...values,
	allDay: values.allDay ?? false,
	recurring: values.recurring ?? false,
}));

type EventFormInput = z.input<typeof eventFormSchema>;

interface EventDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (event: Partial<CalendarEvent>) => void;
	event?: CalendarEvent | null;
	initialDate?: Date;
	initialStartTime?: Date;
}

const colorOptionDefinitions: { value: EventColor; label: string }[] = [
	{ label: 'Verde (Receita)', value: 'emerald' },
	{ label: 'Vermelho (Despesa)', value: 'rose' },
	{ label: 'Laranja (Conta)', value: 'orange' },
	{ label: 'Azul (Agendamento)', value: 'blue' },
	{ label: 'Roxo (Transferência)', value: 'violet' },
	{ label: 'Índigo', value: 'indigo' },
	{ label: 'Âmbar', value: 'amber' },
	{ label: 'Vermelho', value: 'red' },
	{ label: 'Verde', value: 'green' },
	{ label: 'Amarelo', value: 'yellow' },
	{ label: 'Roxo', value: 'purple' },
	{ label: 'Rosa', value: 'pink' },
	{ label: 'Ciano', value: 'teal' },
	{ label: 'Azul claro', value: 'cyan' },
];

const colorOptions: { value: EventColor; label: string; class: string }[] =
	colorOptionDefinitions.map((option) => ({
		...option,
		class: (EVENT_COLOR_STYLES[option.value] ?? EVENT_COLOR_STYLES.blue).dot,
	}));

const recurrenceOptions = [
	{ label: 'Diariamente', value: 'FREQ=DAILY' },
	{ label: 'Semanalmente', value: 'FREQ=WEEKLY' },
	{ label: 'Seg, Qua, Sex', value: 'FREQ=WEEKLY;BYDAY=MO,WE,FR' },
	{ label: 'Mensalmente', value: 'FREQ=MONTHLY' },
	{ label: 'Anualmente', value: 'FREQ=YEARLY' },
];

export function EventDialog({
	open,
	onOpenChange,
	onSave,
	event,
	initialDate,
	initialStartTime,
}: EventDialogProps) {
	const [isRecurring, setIsRecurring] = useState(false);
	const isEditing = !!event;

	const form = useForm<EventFormInput>({
		defaultValues: {
			allDay: false,
			color: 'blue',
			date: format(initialDate || new Date(), 'yyyy-MM-dd'),
			description: '',
			endTime: initialStartTime
				? format(addHours(initialStartTime, 1), 'HH:mm')
				: '10:00',
			recurrenceRule: '',
			recurring: false,
			startTime: initialStartTime ? format(initialStartTime, 'HH:mm') : '09:00',
			title: '',
		} satisfies EventFormInput,
		resolver: zodResolver(eventFormSchema),
	});

	// Update form when event changes
	useEffect(() => {
		if (event) {
			form.reset({
				allDay: event.allDay || false,
				color: event.color,
				date: format(event.start, 'yyyy-MM-dd'),
				description: event.description || '',
				endTime: format(event.end, 'HH:mm'),
				recurrenceRule: '',
				recurring: false,
				startTime: format(event.start, 'HH:mm'),
				title: event.title,
			});
		} else if (initialDate || initialStartTime) {
			form.reset({
				allDay: false,
				color: 'blue',
				date: format(initialDate || new Date(), 'yyyy-MM-dd'),
				description: '',
				endTime: initialStartTime
					? format(addHours(initialStartTime, 1), 'HH:mm')
					: '10:00',
				recurrenceRule: '',
				recurring: false,
				startTime: initialStartTime
					? format(initialStartTime, 'HH:mm')
					: '09:00',
				title: '',
			});
		}
	}, [event, initialDate, initialStartTime, form]);

	const onSubmit: SubmitHandler<EventFormInput> = (values) => {
		const parsed = eventFormSchema.parse(values);
		const [startHour, startMinute] = parsed.startTime.split(':').map(Number);
		const [endHour, endMinute] = parsed.endTime.split(':').map(Number);
		const baseDate = new Date(parsed.date);

		const start = setMinutes(setHours(baseDate, startHour), startMinute);
		const end = setMinutes(setHours(baseDate, endHour), endMinute);

		const eventData: Partial<CalendarEvent> = {
			allDay: parsed.allDay,
			color: parsed.color,
			description: parsed.description,
			end,
			id: event?.id,
			start,
			title: parsed.title,
		};

		onSave(eventData);
		onOpenChange(false);
		form.reset();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? 'Editar Evento' : 'Novo Evento'}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? 'Atualize as informações do evento'
							: 'Crie um novo evento no calendário financeiro'}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Title */}
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Título *</FormLabel>
									<FormControl>
										<Input placeholder="Nome do evento" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Description */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descrição</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Detalhes adicionais sobre o evento"
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Date */}
						<FormField
							control={form.control}
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Data *</FormLabel>
									<FormControl>
										<DatePicker
											date={field.value ? new Date(field.value) : undefined}
											onDateChange={(date) => {
												field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
											}}
											placeholder="Selecione a data do evento"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Time Range */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="startTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hora Início *</FormLabel>
										<FormControl>
											<Input type="time" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="endTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hora Fim *</FormLabel>
										<FormControl>
											<Input type="time" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Color */}
						<FormField
							control={form.control}
							name="color"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Categoria (Cor) *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecione uma categoria" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{colorOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													<div className="flex items-center gap-2">
														<div
															className={`h-3 w-3 rounded-full ${option.class}`}
														/>
														{option.label}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* All Day Toggle */}
						<FormField
							control={form.control}
							name="allDay"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Dia inteiro</FormLabel>
										<FormDescription>
											Evento sem horário específico
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Recurring Toggle */}
						<FormField
							control={form.control}
							name="recurring"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											Evento recorrente
										</FormLabel>
										<FormDescription>
											Repetir este evento periodicamente
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={(checked) => {
												field.onChange(checked);
												setIsRecurring(checked);
											}}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Recurrence Rule */}
						{isRecurring && (
							<FormField
								control={form.control}
								name="recurrenceRule"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Frequência de Repetição</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione a frequência" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{recurrenceOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											Define quando e como o evento será repetido
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									onOpenChange(false);
									form.reset();
								}}
							>
								Cancelar
							</Button>
							<Button type="submit">
								{isEditing ? 'Atualizar' : 'Criar'} Evento
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
