"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calculator, Copy } from "lucide-react"
import { toast } from "sonner"

export function PixConverter() {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")

  const formatCurrency = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '')
    if (!cleanValue) return ''
    const formatted = (Number(cleanValue) / 100).toFixed(2)
    return `R$ ${formatted.replace('.', ',')}`
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    setAmount(formatCurrency(value))
  }

  const copyAmount = () => {
    const numericAmount = amount.replace(/[^\d,]/g, '').replace(',', '.')
    navigator.clipboard.writeText(numericAmount)
    toast.success("Valor copiado!")
  }

  return (
    <Card className="lg:w-90 shrink-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-green-500" />
          Calculadora PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="converter-amount">Valor</Label>
          <div className="relative">
            <Input
              id="converter-amount"
              type="text"
              placeholder="R$ 0,00"
              value={amount}
              onChange={handleAmountChange}
              className="text-2xl font-bold pr-12"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={copyAmount}
              disabled={!amount}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="converter-description">Descrição (opcional)</Label>
          <Input
            id="converter-description"
            type="text"
            placeholder="Para que é este valor?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Quick amount buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[50, 100, 200].map((value) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              onClick={() => setAmount(formatCurrency(String(value * 100)))}
            >
              R$ {value}
            </Button>
          ))}
        </div>

        {/* Summary */}
        {amount && (
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-semibold">{amount}</span>
            </div>
            {description && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descrição</span>
                <span className="text-right">{description}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-green-600 dark:text-green-400">{amount}</span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center">
          Transferências PIX são instantâneas e disponíveis 24/7
        </div>
      </CardContent>
    </Card>
  )
}
