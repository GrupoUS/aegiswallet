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
                    "flex items-center gap-4 p-2 rounded-lg hover:bg-accent transition-colors",
                    "text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {open && (
                    <span className="text-sm font-medium">{pixKey.label || pixKey.value}</span>
                  )}
                </Link>
              )
            })}
            
            {/* Add favorite button */}
            <button
              className={cn(
                "flex items-center gap-4 p-2 rounded-lg hover:bg-accent transition-colors",
                "text-sidebar-foreground"
              )}
            >
              <Star className="w-5 h-5" />
              {open && <span className="text-sm font-medium">Adicionar Favorito</span>}
            </button>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  )
}
