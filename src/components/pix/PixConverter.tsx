"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calculator, Copy, Send, QrCode as QrCodeIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { usePixTransactions, usePixQRCodes } from "@/hooks/usePix"
import { useNavigate } from "@tanstack/react-router"
import QRCode from "react-qr-code"

export function PixConverter() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("transferir")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [pixKey, setPixKey] = useState("")
  
  const { createTransaction, isPending: isCreatingTransaction } = usePixTransactions()
  const { generateQRCode, isGenerating: isCreatingQRCode, qrCodes } = usePixQRCodes()
  
  const qrCodeData = qrCodes[0] // Get the most recent QR Code

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

  const getNumericAmount = () => {
    const cleanValue = amount.replace(/[^\d,]/g, '').replace(',', '.')
    return Number(cleanValue)
  }

  const handleSendPix = () => {
    const numericAmount = getNumericAmount()
    
    if (!pixKey || !pixKey.trim()) {
      toast.error("Informe a chave PIX do destinatário")
      return
    }
    
    if (numericAmount <= 0) {
      toast.error("Informe um valor válido")
      return
    }

    createTransaction({
      pixKey,
      amount: numericAmount,
      description: description || undefined,
    })
    
    // Reset form
    setAmount("")
    setDescription("")
    setPixKey("")
  }

  const handleGenerateQRCode = () => {
    const numericAmount = getNumericAmount()
    
    if (numericAmount <= 0) {
      toast.error("Informe um valor válido")
      return
    }

    createQRCode({
      amount: numericAmount,
      description: description || undefined,
    })
  }

  return (
    <Card className={cn(
      "lg:w-90 shrink-0",
      "shadow-[0_1px_1px_rgba(0,0,0,0.05),_0_2px_2px_rgba(0,0,0,0.05),_0_4px_4px_rgba(0,0,0,0.05),_0_8px_8px_rgba(0,0,0,0.05)]",
      "dark:shadow-[0_1px_1px_rgba(255,255,255,0.02),_0_2px_2px_rgba(255,255,255,0.02)]"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-green-600 dark:text-green-400" />
          PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transferir" className="gap-2">
              <Send className="w-4 h-4" />
              Transferir
            </TabsTrigger>
            <TabsTrigger value="receber" className="gap-2">
              <QrCodeIcon className="w-4 h-4" />
              Receber
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transferir" className="space-y-4 mt-4">
            {/* Transferir content */}
        {/* PIX Key Input */}
        <div className="space-y-2">
          <Label htmlFor="converter-pix-key">Chave PIX do Destinatário</Label>
          <Input
            id="converter-pix-key"
            type="text"
            placeholder="Email, CPF, telefone ou chave aleatória"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
          />
        </div>
        
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
              className={cn(
                "relative overflow-hidden",
                "before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-500/0 before:via-green-500/10 before:to-green-500/0",
                "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500"
              )}
            >
              R$ {value}
            </Button>
          ))}
        </div>

        {/* Summary */}
        {amount && (
          <div className={cn(
            "relative p-4 rounded-lg space-y-2",
            "bg-gradient-to-br from-green-50 to-teal-50",
            "dark:from-green-950/20 dark:to-teal-950/20",
            "border border-green-200/50 dark:border-green-800/50",
            "[mask-image:radial-gradient(100%_100%_at_50%_50%,white,transparent_90%)]"
          )}>
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
            <div className="border-t border-green-200/50 dark:border-green-800/50 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-green-600 dark:text-green-400">{amount}</span>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleSendPix}
          disabled={isCreatingTransaction || !amount || !pixKey}
        >
          {isCreatingTransaction ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar PIX
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center">
          Transferências PIX são instantâneas e disponíveis 24/7
        </div>
          </TabsContent>
          
          <TabsContent value="receber" className="space-y-4 mt-4">
            {/* Receber content */}
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="receive-amount">Valor a Receber</Label>
              <div className="relative">
                <Input
                  id="receive-amount"
                  type="text"
                  placeholder="R$ 0,00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="text-2xl font-bold"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="receive-description">Descrição (opcional)</Label>
              <Input
                id="receive-description"
                type="text"
                placeholder="Para que é este pagamento?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Generate QR Code Button */}
            <Button 
              className="w-full" 
              size="lg"
              variant="outline"
              onClick={handleGenerateQRCode}
              disabled={isCreatingQRCode || !amount}
            >
              {isCreatingQRCode ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCodeIcon className="w-4 h-4 mr-2" />
                  Gerar QR Code
                </>
              )}
            </Button>

            {/* QR Code Display */}
            {qrCodeData && (
              <div className={cn(
                "relative p-6 rounded-lg space-y-4",
                "bg-gradient-to-br from-green-50 to-teal-50",
                "dark:from-green-950/20 dark:to-teal-950/20",
                "border border-green-200/50 dark:border-green-800/50",
                "text-center"
              )}>
                <div className="text-sm font-medium text-muted-foreground">
                  QR Code PIX Gerado
                </div>
                <div className="bg-white p-4 rounded-lg inline-block">
                  {qrCodeData.pixCopyPaste ? (
                    <QRCode
                      value={qrCodeData.pixCopyPaste}
                      size={200}
                      level="H"
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded">
                      <QrCodeIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Escaneie este código para realizar o pagamento
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (qrCodeData.pixCopyPaste) {
                      navigator.clipboard.writeText(qrCodeData.pixCopyPaste)
                      toast.success("Código PIX copiado!")
                    }
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar código PIX
                </Button>
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground text-center">
              O QR Code expira em 15 minutos
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
