
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Image as ImageIcon } from "lucide-react";
import { NewsItem } from "@/services/newsService";
import { useState } from "react";

interface NewsCardProps {
  newsItem: NewsItem;
  onReadMore: (url: string) => void;
}

const NewsCard = ({ newsItem, onReadMore }: NewsCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const extractImageFromDescription = (description: string): string | null => {
    try {
      const doc = new DOMParser().parseFromString(description, 'text/html');
      const img = doc.querySelector('img');
      return img?.src || null;
    } catch (error) {
      return null;
    }
  };

  const getNewsImage = (): string | null => {
    // First check if the newsItem has an image property (from RSS parsing)
    if (newsItem.image) {
      return newsItem.image;
    }
    
    // Try to extract image from description HTML
    const extractedImage = extractImageFromDescription(newsItem.description);
    if (extractedImage) {
      return extractedImage;
    }
    
    return null;
  };

  const imageUrl = getNewsImage();
  const shouldShowImage = imageUrl && !imageError;

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {shouldShowImage && (
        <div className="relative h-48 w-full overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={newsItem.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoading ? 'none' : 'block' }}
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
          Título: {newsItem.title}
        </CardTitle>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Data de Publicação: {newsItem.pubDate}</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
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
          className="w-full hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 transition-colors"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Ler matéria completa
        </Button>
      </CardContent>
    </Card>
  );
};

export default NewsCard;
