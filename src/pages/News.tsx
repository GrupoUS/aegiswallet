
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertCircle, Newspaper } from "lucide-react";
import { newsService, NewsItem } from "@/services/newsService";
import NewsCard from "@/components/news/NewsCard";
import { useToast } from "@/hooks/use-toast";

const News = () => {
  const { toast } = useToast();

  const {
    data: newsItems,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['news'],
    queryFn: newsService.fetchNews,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  const handleReadMore = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Erro",
        description: "Link da notícia não disponível",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    refetch();
    toast({
      title: "Atualizando",
      description: "Buscando notícias mais recentes..."
    });
  };

  // Format dates for all news items
  const formattedNewsItems = newsItems?.map(item => ({
    ...item,
    pubDate: newsService.formatDate(item.pubDate)
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Newspaper className="h-8 w-8 mr-3 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notícias
            </h1>
          </div>
          
          {/* Loading skeletons */}
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Newspaper className="h-8 w-8 mr-3 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notícias
            </h1>
          </div>
          
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Erro ao carregar notícias
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Não foi possível carregar as notícias. Tente novamente mais tarde.
              </p>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!formattedNewsItems || formattedNewsItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Newspaper className="h-8 w-8 mr-3 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notícias
            </h1>
          </div>
          
          <Card className="text-center py-12">
            <CardContent>
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma notícia disponível
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Nenhuma notícia disponível no momento.
              </p>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Newspaper className="h-8 w-8 mr-3 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notícias
            </h1>
          </div>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
        
        <div className="space-y-4">
          {formattedNewsItems.map((newsItem, index) => (
            <NewsCard
              key={`${newsItem.link}-${index}`}
              newsItem={newsItem}
              onReadMore={handleReadMore}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default News;
