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
  const variants = {
    completed: 'default',
    processing: 'secondary',
    failed: 'destructive',
    pending: 'outline',
    cancelled: 'outline',
  }
  
  const labels = {
    completed: 'Concluída',
    processing: 'Processando',
    failed: 'Falhou',
    pending: 'Pendente',
    cancelled: 'Cancelada',
  }
  
  return (
    <Badge variant={variants[status] as any}>
      {labels[status]}
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
    <Card>
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
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.type === 'sent' ? (
                          <>
                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                            <span className="text-sm">Enviado</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Recebido</span>
                          </>
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
