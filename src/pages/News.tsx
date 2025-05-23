
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, AlertCircle, Newspaper, Wifi, WifiOff } from "lucide-react";
import { newsService, NewsItem } from "@/services/newsService";
import NewsCard from "@/components/news/NewsCard";
import NewsLoadingSkeleton from "@/components/news/NewsLoadingSkeleton";
import { useToast } from "@/hooks/use-toast";

const News = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const {
    data: newsItems,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['news'],
    queryFn: () => newsService.fetchNews(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    retryOnMount: true
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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      await newsService.fetchNews({ skipCache: true });
      await refetch();
      
      toast({
        title: "Sucesso",
        description: "Notícias atualizadas com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro na atualização",
        description: isOnline 
          ? "Não foi possível atualizar as notícias. Tente novamente."
          : "Sem conexão com a internet. Mostrando dados salvos.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format dates for all news items
  const formattedNewsItems = newsItems?.map(item => ({
    ...item,
    pubDate: newsService.formatDate(item.pubDate)
  }));

  const renderErrorState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <div className="flex flex-col items-center">
          {isOnline ? (
            <AlertCircle className="h-12 w-12 mb-4 text-red-500" />
          ) : (
            <WifiOff className="h-12 w-12 mb-4 text-gray-500" />
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isOnline ? "Erro ao carregar notícias" : "Sem conexão com a internet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            {isOnline 
              ? "Não foi possível carregar as notícias. Verifique sua conexão e tente novamente."
              : "Não foi possível conectar à internet. Verifique sua conexão e tente novamente."
            }
          </p>
          <Button 
            onClick={handleManualRefresh} 
            variant="outline"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Tentando novamente...' : 'Tentar novamente'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhuma notícia disponível
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Nenhuma notícia disponível no momento.
        </p>
        <Button 
          onClick={handleManualRefresh} 
          variant="outline"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
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
            <div className="flex items-center space-x-2">
              {!isOnline && <WifiOff className="h-5 w-5 text-gray-500" />}
              <Button variant="outline" size="sm" disabled>
                <RefreshCw className="h-4 w-4 mr-2" />
                Carregando...
              </Button>
            </div>
          </div>
          <NewsLoadingSkeleton />
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
          <div className="flex items-center space-x-2">
            {!isOnline && (
              <div className="flex items-center text-sm text-gray-500">
                <WifiOff className="h-4 w-4 mr-1" />
                <span>Offline</span>
              </div>
            )}
            <Button 
              onClick={handleManualRefresh} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
        
        {error ? renderErrorState() : 
         !formattedNewsItems || formattedNewsItems.length === 0 ? renderEmptyState() :
         (
          <div className="space-y-4">
            {formattedNewsItems.map((newsItem, index) => (
              <NewsCard
                key={`${newsItem.link}-${index}`}
                newsItem={newsItem}
                onReadMore={handleReadMore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
