/**
 * 24/7 Data Ingestion Pipeline - Story 02.02
 */

import { supabase } from '@/integrations/supabase/client'
import { getOpenBankingConnector } from './openBankingConnector'

export class DataIngestionPipeline {
  private intervalId: NodeJS.Timeout | null = null

  start(): void {
    // Sync every 5 minutes
    this.intervalId = setInterval(
      () => {
        this.syncAllAccounts().catch(console.error)
      },
      5 * 60 * 1000
    )
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async syncAllAccounts(): Promise<void> {
    const { data: users } = await supabase.from('user_bank_links').select('*')
    if (!users) return

    const connector = getOpenBankingConnector()

    for (const user of users) {
      const accounts = await connector.listAccounts(user.link_id)
      for (const account of accounts) {
        await this.syncTransactions(account.id, user.user_id)
      }
    }
  }

  private async syncTransactions(accountId: string, userId: string): Promise<void> {
    const connector = getOpenBankingConnector()
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const now = new Date()

    const transactions = await connector.listTransactions(accountId, last7Days, now)

    for (const tx of transactions) {
      await supabase.from('transactions').upsert({
        id: tx.id,
        user_id: userId,
        account_id: accountId,
        date: tx.date.toISOString(),
        amount: tx.amount,
        description: tx.description,
        type: tx.type,
        category: tx.category,
      })
    }
  }
}

let pipelineInstance: DataIngestionPipeline | null = null

export function getIngestionPipeline(): DataIngestionPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new DataIngestionPipeline()
  }
  return pipelineInstance
}
