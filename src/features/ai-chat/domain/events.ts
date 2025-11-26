import { ChatStreamChunk, ChatStreamEventType } from './types';

export const createChunk = (type: ChatStreamEventType, payload: any): ChatStreamChunk => ({
  type,
  payload,
});

export const ChatEvents = {
  textDelta: (text: string) => createChunk('text-delta', text),
  reasoningDelta: (text: string) => createChunk('reasoning-delta', text),
  toolCall: (toolCall: any) => createChunk('tool-call', toolCall),
  suggestion: (suggestion: any) => createChunk('suggestion', suggestion),
  error: (error: any) => createChunk('error', error),
  done: () => createChunk('done', null),
};
