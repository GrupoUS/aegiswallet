'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LineChart, PiggyBank, Plus, Wallet } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { FinancialAmount } from '@/components/financial-amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type BankAccount, useBankAccounts } from '@/hooks/useBankAccounts';
import { cn } from '@/lib/utils';

interface AccountsCarouselProps {
	/** Callback when an account card is clicked */
	onAccountClick?: (account: BankAccount) => void;
	/** Callback when the "Add" card is clicked */
	onAddClick?: () => void;
	/** Whether to show the navigation arrows */
	showNavigation?: boolean;
	/** Additional class name for the container */
	className?: string;
}

// Get icon and color based on account type
function getAccountVisuals(accountType: string) {
	switch (accountType) {
		case 'poupanca':
		case 'savings':
			return { icon: PiggyBank, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' };
		case 'investimento':
		case 'investment':
			return { icon: LineChart, color: 'text-violet-500', bgColor: 'bg-violet-500/10' };
		default:
			return { icon: Wallet, color: 'text-primary', bgColor: 'bg-primary/10' };
	}
}

// Account card component
function AccountCard({
	account,
	onClick,
}: {
	account: BankAccount;
	onClick?: (account: BankAccount) => void;
}) {
	const {
		icon: IconComponent,
		color,
		bgColor,
	} = getAccountVisuals(account.account_type || account.accountType || 'checking');

	return (
		<motion.div
			whileHover={{ scale: 1.02, y: -2 }}
			whileTap={{ scale: 0.98 }}
			transition={{ type: 'spring', damping: 20, stiffness: 300 }}
		>
			<Card
				className={cn(
					'flex-shrink-0 w-[180px] cursor-pointer',
					'transition-all duration-300',
					'hover:border-primary/30 hover:shadow-lg',
					'snap-start',
				)}
				variant="glass-hover"
				onClick={() => onClick?.(account)}
			>
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-xs truncate max-w-[120px]">
							{account.institution_name || account.institutionName}
						</span>
						<div className={cn('rounded-full p-1.5', bgColor)}>
							<IconComponent className={cn('h-3.5 w-3.5', color)} />
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<FinancialAmount
						amount={Number(account.balance ?? 0)}
						currency={(account.currency as 'BRL' | 'USD' | 'EUR') ?? 'BRL'}
						size="lg"
						className="text-foreground"
					/>
					<p className="text-muted-foreground text-xs mt-1 capitalize">
						{account.account_type || account.accountType}
					</p>
					{(account.is_primary || account.isPrimary) && (
						<span className="inline-block mt-2 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
							Principal
						</span>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}

// Add account card
function AddAccountCard({ onClick }: { onClick?: () => void }) {
	return (
		<motion.div
			whileHover={{ scale: 1.02, y: -2 }}
			whileTap={{ scale: 0.98 }}
			transition={{ type: 'spring', damping: 20, stiffness: 300 }}
		>
			<Card
				className={cn(
					'flex-shrink-0 w-[180px] h-full cursor-pointer',
					'border-dashed border-2 border-muted-foreground/30',
					'transition-all duration-300',
					'hover:border-primary/50 hover:bg-primary/5',
					'snap-start',
				)}
				onClick={onClick}
			>
				<CardContent className="flex flex-col items-center justify-center h-full min-h-[120px] text-center p-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
						<Plus className="h-5 w-5 text-muted-foreground" />
					</div>
					<p className="text-muted-foreground text-sm font-medium">Adicionar Conta</p>
				</CardContent>
			</Card>
		</motion.div>
	);
}

// Loading skeleton
function AccountCardSkeleton() {
	return (
		<Card className="flex-shrink-0 w-[180px] snap-start">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<Skeleton className="h-3 w-20" />
					<Skeleton className="h-6 w-6 rounded-full" />
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<Skeleton className="h-6 w-24 mb-1" />
				<Skeleton className="h-3 w-16" />
			</CardContent>
		</Card>
	);
}

export function AccountsCarousel({
	onAccountClick,
	onAddClick,
	showNavigation = true,
	className,
}: AccountsCarouselProps) {
	const { accounts, isLoading } = useBankAccounts();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(true);

	// Check scroll position to show/hide navigation arrows
	const updateScrollState = useCallback(() => {
		if (scrollContainerRef.current) {
			const {
				scrollLeft: currentScrollLeft,
				scrollWidth,
				clientWidth,
			} = scrollContainerRef.current;
			setCanScrollLeft(currentScrollLeft > 0);
			setCanScrollRight(currentScrollLeft < scrollWidth - clientWidth - 10);
		}
	}, []);

	// Scroll handlers
	const handleScrollLeft = useCallback(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
		}
	}, []);

	const handleScrollRight = useCallback(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
		}
	}, []);

	// Empty state
	if (!isLoading && accounts.length === 0) {
		return (
			<div className={cn('space-y-4', className)}>
				<AddAccountCard onClick={onAddClick} />
			</div>
		);
	}

	return (
		<div className={cn('relative group', className)}>
			{/* Left Navigation Arrow */}
			{showNavigation && canScrollLeft && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
				>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8 rounded-full shadow-lg bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={handleScrollLeft}
					>
						<ChevronLeft className="h-4 w-4" />
						<span className="sr-only">Rolar para esquerda</span>
					</Button>
				</motion.div>
			)}

			{/* Scrollable Container */}
			<div
				ref={scrollContainerRef}
				onScroll={updateScrollState}
				className={cn(
					'flex gap-3 overflow-x-auto pb-2',
					'scroll-smooth snap-x snap-mandatory',
					'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/30',
					// Hide scrollbar on mobile for cleaner look
					'scrollbar-none md:scrollbar-thin',
				)}
			>
				{isLoading ? (
					// Loading state
					<>
						<AccountCardSkeleton />
						<AccountCardSkeleton />
						<AccountCardSkeleton />
					</>
				) : (
					// Accounts list
					<>
						{accounts.map((account) => (
							<AccountCard key={account.id} account={account} onClick={onAccountClick} />
						))}
						<AddAccountCard onClick={onAddClick} />
					</>
				)}
			</div>

			{/* Right Navigation Arrow */}
			{showNavigation && canScrollRight && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
				>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8 rounded-full shadow-lg bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={handleScrollRight}
					>
						<ChevronRight className="h-4 w-4" />
						<span className="sr-only">Rolar para direita</span>
					</Button>
				</motion.div>
			)}

			{/* Gradient fade edges */}
			<div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
			<div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
		</div>
	);
}
