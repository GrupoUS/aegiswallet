/**
 * UI Components Index
 * 
 * Central export file for all UI components in AegisWallet.
 * This allows for cleaner imports throughout the application.
 * 
 * @example
 * import { Button, GradientButton, Card } from "@/components/ui"
 */

// Core Components
export { Button, buttonVariants } from "./button"
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./card"
export { Input } from "./input"
export { Label } from "./label"
export { Textarea } from "./textarea"

// Gradient Components (New)
export { GradientButton, gradientButtonVariants } from "./gradient-button"
export { HoverBorderGradient } from "./hover-border-gradient"

// Neumorphic Components
export { default as NeumorphButton } from "./neumorph-button"

// Layout Components
export { BentoGrid, BentoCard, type BentoItem, type BentoGridProps } from "./bento-grid"

// Authentication Components
export { LoginForm, type LoginFormProps } from "../login-form"

// Form Components
export { Checkbox } from "./checkbox"
export { RadioGroup, RadioGroupItem } from "./radio-group"
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from "./select"
export { Switch } from "./switch"
export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "./form"

// Dialog & Overlay Components
export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./dialog"
export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from "./sheet"
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./popover"
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip"
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./collapsible"
export { ScrollArea, ScrollBar } from "./scroll-area"

// Navigation Components
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup } from "./dropdown-menu"
export { Sidebar, SidebarBody, SidebarProvider, SidebarLink, DesktopSidebar, MobileSidebar, useSidebar } from "./sidebar"

// Feedback Components
export { Alert, AlertTitle, AlertDescription } from "./alert"
export { Badge, badgeVariants } from "./badge"
export { Skeleton } from "./skeleton"
export { Separator } from "./separator"
export { Toaster } from "./sonner"

// Data Display Components
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "./table"
export { Calendar } from "./calendar"
export { DatePicker, DateRangePicker } from "./date-picker"
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle } from "./chart"

// Theme Components
export { ModeToggle } from "./mode-toggle"
export { AnimatedThemeToggler } from "./animated-theme-toggler"
