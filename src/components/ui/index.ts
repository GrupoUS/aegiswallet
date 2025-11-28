/**
 * UI Components Index
 *
 * Central export file for all UI components in AegisWallet.
 * This allows for cleaner imports throughout the application.
 *
 * @example
 * import { Button, Card, Badge } from "@/components/ui"
 */

// Authentication Components
export { LoginForm, type LoginFormProps } from '../login-form';
// Feedback Components
export { Alert, AlertDescription, AlertTitle } from './alert';
export { AnimatedThemeToggler } from './animated-theme-toggler';
export { Badge, badgeVariants } from './badge';
export type { ButtonProps } from './button';
// Core Components
export { Button, buttonVariants } from './button';
export { Calendar } from './calendar';
export {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from './card';
export {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartStyle,
	ChartTooltip,
	ChartTooltipContent,
} from './chart';
// Form Components
export { Checkbox } from './checkbox';
export { DatePicker, DateRangePicker } from './date-picker';
// Dialog & Overlay Components
export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from './dialog';
// Navigation Components
export {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from './dropdown-menu';
export type {
	CalendarCategory,
	CalendarEvent,
	CalendarFilter,
	CalendarSettings,
	CalendarView,
	EventColor,
	EventPosition,
	TimeSlot,
	WeekDay,
} from './event-calendar';
// Event Calendar Components
export {
	CalendarHeader,
	DayView,
	EnhancedEventCard,
	EventCalendar,
	EventCard,
	EventDialog,
	MonthView,
	TimeGrid,
	WeekView,
} from './event-calendar';
export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from './form';
// Gradient Components
export { HoverBorderGradient } from './hover-border-gradient';
export { Input } from './input';
export { Label } from './label';
// Theme Components
export { ModeToggle } from './mode-toggle';
export {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
} from './popover';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { ScrollArea, ScrollBar } from './scroll-area';
export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from './select';
export { Separator } from './separator';
export {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetOverlay,
	SheetPortal,
	SheetTitle,
	SheetTrigger,
} from './sheet';
export {
	Sidebar,
	SidebarBody,
	SidebarLink,
	SidebarProvider,
} from './sidebar';
export { Skeleton } from './skeleton';
export { Toaster } from './sonner';
export { Switch } from './switch';
// Data Display Components
export {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from './table';
// Tab Components
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Textarea } from './textarea';
export {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip';
// Voice Components - Temporarily commented out due to Supabase import issues
// export { VoiceDashboard } from '../voice/VoiceDashboard';
// export { VoiceIndicator } from '../voice/VoiceIndicator';
// export { VoiceResponse } from '../voice/VoiceResponse';
