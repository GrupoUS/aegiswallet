import { createLazyFileRoute } from '@tanstack/react-router';
import { Route as AiChatRoute } from './ai-chat';

export const Route = createLazyFileRoute('/ai-chat')({
  component: AiChatRoute.component,
});
