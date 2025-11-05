/**
 * UI Components Index
 *
 * Central export file for all UI components in AegisWallet.
 * This allows for cleaner imports throughout the application.
 *
 * @example
 * import { Button, GradientButton, Card } from "@/components/ui"
 */

// Authentication Components
export { LoginForm, type LoginFormProps } from '../login-form'
// Feedback Components
export { Alert, AlertDescription, AlertTitle } from './alert'
export { AnimatedThemeToggler } from './animated-theme-toggler'
export { Badge, badgeVariants } from './badge'
// Layout Components
export { BentoCard, type BentoGridProps, type BentoItem, default as BentoGrid } from './bento-grid'
export type { ButtonProps } from './button'
// Core Components
export { Button, buttonVariants } from './button'
export { Calendar } from './calendar'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from './chart'
// Form Components
export { Checkbox } from './checkbox'
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
export { DatePicker, DateRangePicker } from './date-picker'
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
} from './dialog'
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
} from './dropdown-menu'
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form'
// Gradient Components (New)
export { GradientButton, gradientButtonVariants } from './gradient-button'
export { HoverBorderGradient } from './hover-border-gradient'
export { Input } from './input'
export { Label } from './label'
// Theme Components
export { ModeToggle } from './mode-toggle'
// Neumorphic Components
export { default as NeumorphButton } from './neumorph-button'
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './popover'
export { RadioGroup, RadioGroupItem } from './radio-group'
export { ScrollArea, ScrollBar } from './scroll-area'
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
} from './select'
export { Separator } from './separator'
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
} from './sheet'
export {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarProvider,
  useSidebar,
} from './sidebar'
export { Skeleton } from './skeleton'
export { Toaster } from './sonner'
export { Switch } from './switch'
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
} from './table'
export { Textarea } from './textarea'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
// Voice Components
export {
  VoiceDashboard,
  VoiceDashboardLoader,
  VoiceIndicator,
  VoiceInterface,
  VoiceInterfaceLoader,
  VoiceResponse,
} from './voice'
