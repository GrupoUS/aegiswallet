
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
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const items = xmlDoc.querySelectorAll('item');
      const newsItems: NewsItem[] = [];
      
      items.forEach(item => {
        const title = item.querySelector('title')?.textContent || 'Sem título';
        const link = item.querySelector('link')?.textContent || '';
        const description = item.querySelector('description')?.textContent || 'Sem descrição disponível';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        
        newsItems.push({
          title,
          link,
          description,
          pubDate
        });
      });
      
      return newsItems;
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
