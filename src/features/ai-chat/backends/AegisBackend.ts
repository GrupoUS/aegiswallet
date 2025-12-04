import type { ChatBackend, ChatBackendConfig, ModelInfo } from '../domain/ChatBackend';
import { ChatEvents } from '../domain/events';
import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';

export interface AegisBackendConfig extends ChatBackendConfig {
/** API endpoint URL (default: /api/v1/ai/chat) */
endpoint?: string;
}

/**
 * Aegis Backend implementation
 * Connects to the server-side AI endpoint which handles:
 * - Authentication & Authorization
 * - LGPD Consent verification
 * - Context injection (financial data)
 * - Model interaction via Vercel AI SDK
 */
export class AegisBackend implements ChatBackend {
private endpoint: string;
private abortController: AbortController | null = null;

constructor(config: AegisBackendConfig) {
this.endpoint = config.endpoint || '/api/v1/ai/chat';
}

async *send(
messages: ChatMessage[],
options?: ChatRequestOptions,
): AsyncGenerator<ChatStreamChunk, void, unknown> {
this.abortController = new AbortController();

try {
const response = await fetch(this.endpoint, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
messages: messages.map((m) => ({
role: m.role,
content: m.content,
})),
model: options?.model,
}),
signal: this.abortController.signal,
});

if (!response.ok) {
const errorData = await response.json().catch(() => ({}));

// Check for consent requirement (403 Forbidden with specific flag)
if (response.status === 403 && errorData.requiresConsent) {
yield ChatEvents.error({
code: 'CONSENT_REQUIRED',
message: errorData.message || 'Consentimento necessário',
details: errorData,
});
return;
}

				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
}

if (!response.body) throw new Error('No response body');

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
const { done, value } = await reader.read();
if (done) break;

const chunk = decoder.decode(value, { stream: true });
buffer += chunk;

const lines = buffer.split('\n');
buffer = lines.pop() || '';

for (const line of lines) {
if (!line.trim()) continue;

// Parse Vercel AI SDK stream format
// Format: type:content
// 0:"text" -> text part
// d:{} -> data part
// e:{} -> error part

const match = line.match(/^(\d+|[a-z]):(.*)$/);
if (match) {
const type = match[1];
const content = match[2];

if (type === '0') {
// Text part
try {
// Content is JSON stringified, so we parse it to get the actual text
const text = JSON.parse(content);
yield ChatEvents.textDelta(text);
} catch (e) {
}
} else if (type === 'e') {
// Error part
try {
const errorInfo = JSON.parse(content);
yield ChatEvents.error({
code: 'STREAM_ERROR',
message: errorInfo.message || 'Stream error',
details: errorInfo,
});
} catch (e) {
console.error
}
// Ignore other types for now (data, etc.)
}
}
}

yield ChatEvents.done();
} catch (error: unknown) {
if (error instanceof Error && error.name === 'AbortError') {
return;
}

yield ChatEvents.error({
code: 'NETWORK_ERROR',
message: error instanceof Error ? error.message : String(error),
});
} finally {
this.abortController = null;
}
}

abort(): void {
if (this.abortController) {
this.abortController.abort();
}
}

getModelInfo(): ModelInfo {
return {
id: 'aegis-server',
name: 'Aegis Assistant',
provider: 'Aegis',
capabilities: {
streaming: true,
multimodal: false,
tools: true,
reasoning: true,
},
};
}
}
