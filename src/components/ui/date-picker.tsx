/**
 * Date Picker Component
 * Popover-based date picker using the Origin UI Compact Calendar
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { OriginCompactCalendar } from '@/components/calendar/origin-compact-calendar';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
	/**
	 * Currently selected date
	 */
	date?: Date;
	/**
	 * Callback when date is selected
	 */
	onDateChange?: (date: Date | undefined) => void;
	/**
	 * Placeholder text when no date is selected
	 */
	placeholder?: string;
	/**
	 * Additional CSS classes for the trigger button
	 */
	className?: string;
	/**
	 * Disable the date picker
	 */
	disabled?: boolean;
	/**
	 * Start month for the year dropdown (default: January 1980)
	 */
	startMonth?: Date;
	/**
	 * Format string for displaying the date (default: 'PPP')
	 */
	dateFormat?: string;
}

export function DatePicker({
	date,
	onDateChange,
	placeholder = 'Selecione uma data',
	className,
	disabled = false,
	startMonth = new Date(1980, 0),
	dateFormat = 'PPP',
}: DatePickerProps) {
	const [open, setOpen] = useState(false);

	const handleSelect = (selectedDate: Date | undefined) => {
		if (onDateChange) {
			onDateChange(selectedDate);
		}
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						'w-full justify-start text-left font-normal',
						!date && 'text-muted-foreground',
						className,
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? format(date, dateFormat, { locale: ptBR }) : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<OriginCompactCalendar
					selected={date}
					onSelect={handleSelect}
					startMonth={startMonth}
					defaultMonth={date || new Date()}
				/>
			</PopoverContent>
		</Popover>
	);
}

/**
 * Date Range Picker Component
 * Allows selection of start and end dates
 */
interface DateRangePickerProps {
	/**
	 * Start date
	 */
	startDate?: Date;
	/**
	 * End date
	 */
	endDate?: Date;
	/**
	 * Callback when start date changes
	 */
	onStartDateChange?: (date: Date | undefined) => void;
	/**
	 * Callback when end date changes
	 */
	onEndDateChange?: (date: Date | undefined) => void;
	/**
	 * Additional CSS classes
	 */
	className?: string;
	/**
	 * Disable the date pickers
	 */
	disabled?: boolean;
}

export function DateRangePicker({
	startDate,
	endDate,
	onStartDateChange,
	onEndDateChange,
	className,
	disabled = false,
}: DateRangePickerProps) {
	return (
		<div className={cn('grid gap-2', className)}>
			<DatePicker
				date={startDate}
				onDateChange={onStartDateChange}
				placeholder="Data inicial"
				disabled={disabled}
			/>
			<DatePicker
				date={endDate}
				onDateChange={onEndDateChange}
				placeholder="Data final"
				disabled={disabled}
			/>
		</div>
	);
}
