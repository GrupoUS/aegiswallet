
import { NewsCache } from '@/utils/newsCache';

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface FetchOptions {
  skipCache?: boolean;
  retryCount?: number;
}

class NewsService {
  private readonly RSS_URLS = [
    'https://rss.app/feeds/_2Ulhu5GG4fzU26MQ.xml',
    'https://api.allorigins.win/get?url=' + encodeURIComponent('https://rss.app/feeds/_2Ulhu5GG4fzU26MQ.xml'),
    'https://corsproxy.io/?' + encodeURIComponent('https://rss.app/feeds/_2Ulhu5GG4fzU26MQ.xml')
  ];

  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000; // 1 second

  async fetchNews(options: FetchOptions = {}): Promise<NewsItem[]> {
    const { skipCache = false, retryCount = 0 } = options;

    // Try to get cached data first unless explicitly skipping
    if (!skipCache) {
      const cachedNews = NewsCache.get();
      if (cachedNews) {
        // If cache is recent, return it and fetch fresh data in background
        if (NewsCache.isRecent()) {
          this.fetchFreshDataInBackground();
          return cachedNews;
        }
        // If cache exists but not recent, return it while fetching fresh data
        this.fetchFreshDataInBackground();
        return cachedNews;
      }
    }

    // Fetch fresh data
    return this.fetchFreshNews(retryCount);
  }

  private async fetchFreshNews(retryCount: number = 0): Promise<NewsItem[]> {
    let lastError: Error | null = null;

    for (const url of this.RSS_URLS) {
      try {
        console.log(`Tentando buscar notícias de: ${url}`);
        const newsItems = await this.fetchFromUrl(url);
        
        // Cache successful result
        NewsCache.set(newsItems);
        console.log(`Notícias carregadas com sucesso: ${newsItems.length} itens`);
        
        return newsItems;
      } catch (error) {
        console.warn(`Falha ao buscar de ${url}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    // If all URLs failed and we haven't exceeded retry limit
    if (retryCount < this.MAX_RETRIES) {
      console.log(`Tentativa ${retryCount + 1} falhou, tentando novamente em ${this.RETRY_DELAY}ms...`);
      await this.delay(this.RETRY_DELAY * (retryCount + 1));
      return this.fetchFreshNews(retryCount + 1);
    }

    // All attempts failed
    const cachedNews = NewsCache.get();
    if (cachedNews) {
      console.log('Usando dados em cache devido a falhas na rede');
      return cachedNews;
    }

    throw new Error(lastError?.message || 'Não foi possível carregar as notícias de nenhuma fonte');
  }

  private async fetchFromUrl(url: string): Promise<NewsItem[]> {
    const isProxyUrl = url.includes('allorigins.win') || url.includes('corsproxy.io');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'AegisWallet/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    let xmlText: string;
    
    if (isProxyUrl) {
      const data = await response.json();
      xmlText = data.contents || data.data;
      if (!xmlText) {
        throw new Error('Resposta do proxy não contém dados XML válidos');
      }
    } else {
      xmlText = await response.text();
    }

    return this.parseXML(xmlText);
  }

  private parseXML(xmlText: string): NewsItem[] {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for XML parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Erro ao analisar XML: formato inválido');
      }
      
      const items = xmlDoc.querySelectorAll('item');
      const newsItems: NewsItem[] = [];
      
      items.forEach(item => {
        const title = item.querySelector('title')?.textContent?.trim() || 'Sem título';
        const link = item.querySelector('link')?.textContent?.trim() || '';
        const description = item.querySelector('description')?.textContent?.trim() || 'Sem descrição disponível';
        const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
        
        if (title && link) {
          newsItems.push({
            title,
            link,
            description,
            pubDate
          });
        }
      });
      
      if (newsItems.length === 0) {
        throw new Error('Nenhum item de notícia encontrado no feed RSS');
      }
      
      return newsItems;
    } catch (error) {
      console.error('Erro ao analisar XML:', error);
      throw new Error('Falha ao processar dados das notícias');
    }
  }

  private async fetchFreshDataInBackground(): Promise<void> {
    try {
      const freshNews = await this.fetchFreshNews();
      // Data is already cached in fetchFreshNews
      console.log('Dados atualizados em segundo plano');
    } catch (error) {
      console.warn('Falha na atualização em segundo plano:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data não disponível';
    }
  }
}

export const newsService = new NewsService();
