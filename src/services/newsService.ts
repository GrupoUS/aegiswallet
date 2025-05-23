
import { RssFeed } from 'webfeed';

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

class NewsService {
  private readonly RSS_FEED_URL = 'https://rss.app/feeds/_2Ulhu5GG4fzU26MQ.xml';

  async fetchNews(): Promise<NewsItem[]> {
    try {
      const response = await fetch(this.RSS_FEED_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xmlText = await response.text();
      const feed = RssFeed.parse(xmlText);
      
      return feed.items?.map(item => ({
        title: item.title || 'Sem título',
        link: item.link || '',
        description: item.description || 'Sem descrição disponível',
        pubDate: item.pubDate || ''
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      throw new Error('Não foi possível carregar as notícias');
    }
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
