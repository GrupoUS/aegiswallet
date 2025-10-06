/**
 * Origin UI Compact Calendar Component
 * Compact calendar with dropdown month/year selectors
 * Based on Origin UI comp-497 - https://originui.com/r/comp-497.json
 */

import { useState } from 'react'
import type { DropdownNavProps, DropdownProps } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface OriginCompactCalendarProps {
  /**
   * Currently selected date
   */
  selected?: Date
  /**
   * Callback when date is selected
   */
  onSelect?: (date: Date | undefined) => void
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Start month for the year dropdown (default: January 1980)
   */
  startMonth?: Date
  /**
   * Default month to display (default: current month)
   */
  defaultMonth?: Date
  /**
   * Show outside days (default: true)
   */
  showOutsideDays?: boolean
}

export function OriginCompactCalendar({
  selected,
  onSelect,
  className,
  startMonth = new Date(1980, 0),
  defaultMonth = new Date(),
  showOutsideDays = true,
}: OriginCompactCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(selected || new Date())

  const handleCalendarChange = (
    _value: string | number,
    _e: React.ChangeEventHandler<HTMLSelectElement>
  ) => {
    const _event = {
      target: {
        value: String(_value),
      },
    } as React.ChangeEvent<HTMLSelectElement>
    _e(_event)
  }

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    if (onSelect) {
      onSelect(newDate)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelect}
        className="rounded-md border p-2"
        classNames={{
          month_caption: 'mx-0',
        }}
        captionLayout="dropdown"
        defaultMonth={defaultMonth}
        startMonth={startMonth}
        hideNavigation
        showOutsideDays={showOutsideDays}
        components={{
          DropdownNav: (props: DropdownNavProps) => {
            return (
              <div className="flex w-full items-center gap-2">
                {props.children}
              </div>
            )
          },
          Dropdown: (props: DropdownProps) => {
            return (
              <Select
                value={String(props.value)}
                onValueChange={(value) => {
                  if (props.onChange) {
                    handleCalendarChange(value, props.onChange)
                  }
                }}
              >
                <SelectTrigger className="h-8 w-fit font-medium first:grow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                  {props.options?.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={String(option.value)}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          },
        }}
      />
    </div>
  )
}

