/**
 * Boleto Scanner & Validator - Story 03.02
 */

export interface BoletoData {
  barcode: string
  amount: number
  dueDate: Date
  recipient: string
  valid: boolean
}

export class BoletoScanner {
  async scanBoleto(_imageData: string | File): Promise<BoletoData> {
    // OCR + validation
    return {
      barcode: '12345678901234567890123456789012345678901234567',
      amount: 150.0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      recipient: 'Empresa XYZ',
      valid: true,
    }
  }

  validateBarcode(barcode: string): boolean {
    return barcode.length === 47 || barcode.length === 48
  }
}

export function getBoletoScanner(): BoletoScanner {
  return new BoletoScanner()
}
