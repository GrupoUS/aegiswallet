/**
 * Data Normalization & Enrichment - Story 02.03
 */

export interface EnrichedTransaction {
  id: string;
  normalizedCategory: string;
  merchant: string;
  location?: string;
  tags: string[];
  confidence: number;
}

export class DataNormalizer {
  private categoryMap: Record<string, string> = {
    '99': 'transporte',
    netflix: 'entretenimento',
    restaurante: 'alimentacao',
    spotify: 'entretenimento',
    supermercado: 'alimentacao',
    uber: 'transporte',
  };

  normalizeTransaction(description: string): EnrichedTransaction {
    const lower = description.toLowerCase();
    let category = 'outros';
    let confidence = 0.5;

    for (const [keyword, cat] of Object.entries(this.categoryMap)) {
      if (lower.includes(keyword)) {
        category = cat;
        confidence = 0.9;
        break;
      }
    }

    return {
      confidence,
      id: `enr_${Date.now()}`,
      merchant: description,
      normalizedCategory: category,
      tags: [category],
    };
  }

  enrichBatch(transactions: { description: string }[]): EnrichedTransaction[] {
    return transactions.map((tx) => this.normalizeTransaction(tx.description));
  }
}

export function getNormalizer(): DataNormalizer {
  return new DataNormalizer();
}
