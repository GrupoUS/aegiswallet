"use client"

import * as React from "react"
import { Link } from "@tanstack/react-router"
import { Sidebar, SidebarBody } from "@/components/ui/sidebar"
import { CreditCard, User, Phone, Mail, Hash, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PixKey } from "@/types/pix"

// Mock data - replace with real data from tRPC/Supabase
const mockPixKeys: PixKey[] = [
  {
    id: "1",
    type: "email",
    value: "usuario@exemplo.com",
    label: "Email Principal",
    isFavorite: true,
    userId: "user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    type: "phone",
    value: "+5511999999999",
    label: "Celular",
    isFavorite: true,
    userId: "user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    type: "cpf",
    value: "12345678900",
    label: "CPF",
    isFavorite: false,
    userId: "user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

function getPixKeyIcon(type: PixKey['type']) {
  switch (type) {
    case 'email':
      return Mail
    case 'phone':
      return Phone
    case 'cpf':
    case 'cnpj':
      return User
    case 'random':
      return Hash
    default:
      return CreditCard
  }
}

export function PixSidebar({ open, setOpen }: { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  const favoriteKeys = mockPixKeys.filter(key => key.isFavorite)

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-4">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo/Header */}
          <Link className="inline-flex mb-8" to="/pix" aria-label="PIX Dashboard">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PIX</span>
            </div>
          </Link>
          
          {/* Favorite keys */}
          <div className="flex flex-col gap-4">
            {favoriteKeys.map((pixKey) => {
              const Icon = getPixKeyIcon(pixKey.type)
              return (
                <Link
                  key={pixKey.id}
                  to="/pix/transferir"
                  search={{ pixKey: pixKey.value }}
                  className={cn(
                    "group relative flex items-center gap-4 p-3 rounded-lg transition-all duration-200",
                    "text-sidebar-foreground",
                    "hover:bg-sidebar-accent",
                    "shadow-[0_1px_1px_rgba(0,0,0,0.05),_0_2px_2px_rgba(0,0,0,0.05),_0_4px_4px_rgba(0,0,0,0.05),_0_8px_8px_rgba(0,0,0,0.05)]",
                    "dark:shadow-[0_1px_1px_rgba(255,255,255,0.02),_0_2px_2px_rgba(255,255,255,0.02)]",
                    // Active state with glow effect
                    "active:before:absolute active:before:inset-0 active:before:-z-10",
                    "active:before:bg-green-500/48 active:before:blur-[10px] active:before:rounded-lg",
                    "active:bg-green-500/10 active:border-green-500/30"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    "bg-gradient-to-br from-green-500/10 to-teal-500/10",
                    "group-hover:from-green-500/20 group-hover:to-teal-500/20",
                    "transition-all duration-200"
                  )}>
                    <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  {open && (
                    <span className="text-sm font-medium truncate">{pixKey.label || pixKey.value}</span>
                  )}
                </Link>
              )
            })}
            
            {/* Add favorite button */}
            <button
              className={cn(
                "group relative flex items-center gap-4 p-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground",
                "hover:bg-sidebar-accent",
                "border border-dashed border-sidebar-border",
                "hover:border-green-500/30 hover:bg-green-500/5"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-sidebar-accent",
                "group-hover:bg-green-500/10",
                "transition-all duration-200"
              )}>
                <Star className="w-5 h-5 text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-400" />
              </div>
              {open && <span className="text-sm font-medium">Adicionar Favorito</span>}
            </button>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  )
}
