"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle } from "lucide-react"
import { maskPixKey } from "@/types/pix"
import type { PixTransaction } from "@/types/pix"
import { cn } from "@/lib/utils"

// Mock data - replace with real data from tRPC/Supabase
const mockTransactions: PixTransaction[] = [
  {
    id: "1",
    userId: "user-1",
    type: "sent",
    status: "completed",
    amount: 150.00,
    description: "Almoço",
    pixKey: "maria@email.com",
    pixKeyType: "email",
    recipientName: "Maria Silva",
    transactionId: "TXN001",
    endToEndId: "E12345678202501061000000001",
    completedAt: "2025-01-06T10:30:00Z",
    createdAt: "2025-01-06T10:30:00Z",
    updatedAt: "2025-01-06T10:30:00Z",
  },
  {
    id: "2",
    userId: "user-1",
    type: "received",
    status: "completed",
    amount: 280.50,
    description: "Venda de produto",
    pixKey: "+5511999999999",
    pixKeyType: "phone",
    recipientName: "João Santos",
    transactionId: "TXN002",
    endToEndId: "E12345678202501061100000002",
    completedAt: "2025-01-06T11:15:00Z",
    createdAt: "2025-01-06T11:15:00Z",
    updatedAt: "2025-01-06T11:15:00Z",
  },
  {
    id: "3",
    userId: "user-1",
    type: "sent",
    status: "processing",
    amount: 500.00,
    description: "Pagamento de conta",
    pixKey: "12345678000100",
    pixKeyType: "cnpj",
    recipientName: "Empresa ABC LTDA",
    transactionId: "TXN003",
    createdAt: "2025-01-06T14:00:00Z",
    updatedAt: "2025-01-06T14:00:00Z",
  },
]

function getStatusIcon(status: PixTransaction['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'processing':
      return <Clock className="w-4 h-4 text-yellow-500" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-500" />
  }
}

function getStatusBadge(status: PixTransaction['status']) {
  const config = {
    completed: {
      variant: 'default' as const,
      label: 'Concluída',
      className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800'
    },
    processing: {
      variant: 'secondary' as const,
      label: 'Processando',
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
    },
    failed: {
      variant: 'destructive' as const,
      label: 'Falhou',
      className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800'
    },
    pending: {
      variant: 'outline' as const,
      label: 'Pendente',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    },
    cancelled: {
      variant: 'outline' as const,
      label: 'Cancelada',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    },
  }
  
  const { variant, label, className } = config[status]
  
  return (
    <Badge variant={variant} className={cn("font-medium", className)}>
      {label}
    </Badge>
  )
}

export function PixTransactionsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (!value.trim()) {
      setFilteredTransactions(mockTransactions)
      return
    }
    
    const filtered = mockTransactions.filter(tx => 
      tx.description?.toLowerCase().includes(value.toLowerCase()) ||
      tx.recipientName?.toLowerCase().includes(value.toLowerCase()) ||
      tx.pixKey.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredTransactions(filtered)
  }

  return (
    <Card className={cn(
      "shadow-[0_1px_1px_rgba(0,0,0,0.05),_0_2px_2px_rgba(0,0,0,0.05),_0_4px_4px_rgba(0,0,0,0.05),_0_8px_8px_rgba(0,0,0,0.05)]",
      "dark:shadow-[0_1px_1px_rgba(255,255,255,0.02),_0_2px_2px_rgba(255,255,255,0.02)]"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transações Recentes</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Chave PIX</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma transação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    className={cn(
                      "transition-all duration-200",
                      "hover:bg-muted/50",
                      "hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_2px_4px_rgba(255,255,255,0.02)]",
                      "cursor-pointer"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.type === 'sent' ? (
                          <div className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-md",
                            "bg-red-100 dark:bg-red-950/30"
                          )}>
                            <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">Enviado</span>
                          </div>
                        ) : (
                          <div className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-md",
                            "bg-green-100 dark:bg-green-950/30"
                          )}>
                            <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">Recebido</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.recipientName || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {maskPixKey(transaction.pixKey, transaction.pixKeyType)}
                    </TableCell>
                    <TableCell>
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${
                      transaction.type === 'sent' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'sent' ? '-' : '+'}
                      R$ {transaction.amount.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        {getStatusBadge(transaction.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Load more button */}
        <div className="flex justify-center mt-4">
          <Button variant="outline">
            Carregar mais transações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
