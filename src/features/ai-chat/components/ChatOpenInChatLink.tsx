import { Copy, ExternalLink, Share2 } from 'lucide-react';
import { OpenInChat } from '@/components/ai-elements';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ChatMessage } from '../domain/types';

interface ChatOpenInChatLinkProps {
  message: ChatMessage;
  className?: string;
}

export function ChatOpenInChatLink({ message, className }: ChatOpenInChatLinkProps) {
  const handleCopyLink = () => {
    // Generate a deep link or copy content
    const content =
      typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    navigator.clipboard.writeText(content);
  };

  return (
    <OpenInChat message={message} className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar conteúdo
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir no ChatGPT (Em breve)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </OpenInChat>
  );
}
