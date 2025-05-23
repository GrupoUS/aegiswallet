
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar } from "lucide-react";
import { NewsItem } from "@/services/newsService";

interface NewsCardProps {
  newsItem: NewsItem;
  onReadMore: (url: string) => void;
}

const NewsCard = ({ newsItem, onReadMore }: NewsCardProps) => {
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
          {newsItem.title}
        </CardTitle>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Data de Publicação: {newsItem.pubDate}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Resumo:
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {truncateText(stripHtml(newsItem.description))}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onReadMore(newsItem.link)}
          className="w-full"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Ler matéria completa
        </Button>
      </CardContent>
    </Card>
  );
};

export default NewsCard;
