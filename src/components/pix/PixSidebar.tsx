'use client';

import { Link } from '@tanstack/react-router';
import { CreditCard, Hash, Loader2, Mail, Phone, Star, User } from 'lucide-react';
import * as React from 'react';
import { Sidebar, SidebarBody, SidebarProvider } from '@/components/ui/sidebar';
import { usePixFavorites } from '@/hooks/usePix';
import { cn } from '@/lib/utils';
import type { PixKey } from '@/types/pix';

// Memoize the icon mapping function to avoid recreating it on every render
function getPixKeyIcon(type: PixKey['type']) {
  switch (type) {
    case 'email':
      return Mail;
    case 'phone':
      return Phone;
    case 'cpf':
    case 'cnpj':
      return User;
    case 'random':
      return Hash;
    default:
      return CreditCard;
  }
}

// Memoize the PixKeyItem component to prevent unnecessary re-renders
const PixKeyItem = React.memo(function PixKeyItem({
  pixKey,
  isOpen,
}: {
  pixKey: PixKey;
  isOpen: boolean;
}) {
  const Icon = getPixKeyIcon(pixKey.type);

  return (
    <Link
      key={pixKey.id}
      to="/pix/transferir"
      search={{ pixKey: pixKey.value }}
      className={cn(
        'group relative flex items-center gap-4 rounded-lg p-3 transition-all duration-200',
        'text-sidebar-foreground',
        'hover:bg-sidebar-accent',
        'shadow-[0_1px_1px_rgba(0,0,0,0.05),_0_2px_2px_rgba(0,0,0,0.05),_0_4px_4px_rgba(0,0,0,0.05),_0_8px_8px_rgba(0,0,0,0.05)]',
        'dark:shadow-[0_1px_1px_rgba(255,255,255,0.02),_0_2px_2px_rgba(255,255,255,0.02)]',
        // Active state with glow effect
        'active:before:-z-10 active:before:absolute active:before:inset-0',
        'active:before:rounded-lg active:before:bg-pix-primary/48 active:before:blur-[10px]',
        'active:border-pix-primary/30 active:bg-pix-primary/10'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          'bg-gradient-to-br from-pix-primary/10 to-pix-accent/10',
          'group-hover:from-pix-primary/20 group-hover:to-pix-accent/20',
          'transition-all duration-200'
        )}
      >
        <Icon className="h-5 w-5 text-pix-primary" />
      </div>
      {isOpen && (
        <span className="truncate font-medium text-sm">{pixKey.label || pixKey.value}</span>
      )}
    </Link>
  );
});

// Memoize the AddFavoriteButton component
const AddFavoriteButton = React.memo(function AddFavoriteButton({ isOpen }: { isOpen: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'group relative flex items-center gap-4 rounded-lg p-3 transition-all duration-200',
        'text-sidebar-foreground',
        'hover:bg-sidebar-accent',
        'border border-sidebar-border border-dashed',
        'hover:border-pix-primary/30 hover:bg-pix-primary/5'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          'bg-sidebar-accent',
          'group-hover:bg-pix-primary/10',
          'transition-all duration-200'
        )}
      >
        <Star className="h-5 w-5 text-muted-foreground group-hover:text-pix-primary" />
      </div>
      {isOpen && <span className="font-medium text-sm">Adicionar Favorito</span>}
    </button>
  );
});

// Memoize the Logo component
const Logo = React.memo(function Logo() {
  return (
    <Link className="mb-8 inline-flex" to="/pix" aria-label="PIX Dashboard">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-pix-primary to-pix-accent">
        <span className="font-bold text-sm text-white">PIX</span>
      </div>
    </Link>
  );
});

// Memoize the LoadingState component
const LoadingState = React.memo(function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
});

// Memoize the EmptyState component
const EmptyState = React.memo(function EmptyState({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="py-4 text-center text-muted-foreground text-sm">
      {isOpen && 'Nenhuma chave favorita'}
    </div>
  );
});

export const PixSidebar = React.memo(function PixSidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { favorites: favoriteKeys, isLoading } = usePixFavorites();

  // Memoize the favorite keys list to prevent unnecessary re-renders
  const favoriteKeysList = React.useMemo(() => {
    if (isLoading) {
      return <LoadingState />;
    }
    if (favoriteKeys.length === 0) {
      return <EmptyState isOpen={open} />;
    }

    return favoriteKeys.map((pixKey) => (
      <PixKeyItem key={pixKey.id} pixKey={pixKey} isOpen={open} />
    ));
  }, [favoriteKeys, isLoading, open]);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <Sidebar>
        <SidebarBody className="justify-between gap-4">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {/* Logo/Header */}
            <Logo />

            {/* Favorite keys */}
            <div className="flex flex-col gap-4">
              {favoriteKeysList}

              {/* Add favorite button */}
              <AddFavoriteButton isOpen={open} />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
    </SidebarProvider>
  );
});
