import { Expand, ImageIcon, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ChatImagePayload } from '../domain/types';

interface ChatImageProps {
  /** Image data to display */
  image: ChatImagePayload;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatImage - Image message display component
 *
 * Renders images in chat messages with:
 * - Responsive display with aspect ratio preservation
 * - Loading skeleton while image loads
 * - Alt text for accessibility
 * - Lightbox/modal for full-size view
 * - Generation metadata display (model, prompt if available)
 *
 * @example
 * ```tsx
 * <ChatImage
 *   image={{
 *     id: '1',
 *     url: 'https://example.com/image.png',
 *     alt: 'Financial chart',
 *     generatedBy: 'gemini-pro-vision',
 *   }}
 * />
 * ```
 */
export function ChatImage({ image, className }: ChatImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/50 text-muted-foreground',
          className
        )}
      >
        <ImageIcon className="w-5 h-5" />
        <span className="text-sm">Falha ao carregar imagem</span>
      </div>
    );
  }

  return (
    <Dialog>
      <div className={cn('relative group', className)}>
        {/* Loading Skeleton */}
        {isLoading && (
          <Skeleton
            className="w-full aspect-video rounded-lg"
            style={{
              width: image.width ? Math.min(image.width, 400) : 300,
              height: image.height ? Math.min(image.height, 300) : 200,
            }}
          />
        )}

        {/* Image */}
        <img
          src={image.url}
          alt={image.alt || 'Chat image'}
          className={cn(
            'max-w-full max-h-[300px] rounded-lg shadow-sm object-contain transition-opacity',
            isLoading ? 'opacity-0 absolute' : 'opacity-100'
          )}
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* Hover Overlay */}
        {!isLoading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2">
                <Expand className="w-4 h-4" />
                <span>Ver em tamanho real</span>
              </Button>
            </DialogTrigger>
          </div>
        )}

        {/* Generation Badge */}
        {image.generatedBy && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px]">
            <Sparkles className="w-3 h-3" />
            <span>Gerado por IA</span>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{image.alt || 'Imagem'}</DialogTitle>
          {image.generatedBy && (
            <DialogDescription className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Gerado por {image.generatedBy}
              {image.prompt && (
                <span className="text-muted-foreground truncate max-w-xs">
                  &mdash; &ldquo;{image.prompt}&rdquo;
                </span>
              )}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          <img
            src={image.url}
            alt={image.alt || 'Chat image'}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

