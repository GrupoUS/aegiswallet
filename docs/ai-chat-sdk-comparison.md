# AI Chat SDK Comparison

## Overview
Comparative analysis of four AI chat SDKs/protocols for integration into AegisWallet.

## SDKs Analyzed

### 1. CopilotKit
**URL**: https://github.com/CopilotKit/CopilotKit

**Primary Use Case**: Copilot-style AI assistants embedded in React applications

**Mental Model**:
- Copilot as a persistent assistant alongside user workflow
- Context-aware interactions based on application state
- Generative UI components

**Message Schema**:
- Uses AG-UI Protocol internally
- Roles: user, assistant, system, tool
- Supports tool calls and structured outputs

**Streaming**:
- Built-in streaming via AG-UI protocol
- Server-Sent Events (SSE) transport
- Real-time state synchronization

**Tool/Agent Integration**:
- `useCopilotAction` hook for defining tools
- Server-side tool execution
- Frontend tool integration
- Agent orchestration support

**Frontend Integration**:
- React hooks: `useCopilotChat`, `useCopilotAction`, `useCopilotReadable`
- Pre-built components: `<CopilotChat>`, `<CopilotSidebar>`, `<CopilotPopup>`
- Context injection from React state

**Pros**:
- ✅ Rich React integration
- ✅ AG-UI protocol compatibility
- ✅ Generative UI support
- ✅ Active development and community
- ✅ Good documentation

**Cons**:
- ❌ Opinionated architecture (may not fit all use cases)
- ❌ Requires backend integration (CopilotKit Runtime)
- ❌ Learning curve for advanced features

**Fit for AegisWallet**: ⭐⭐⭐⭐ (4/5)
- Good for future copilot-style features (financial assistant)
- AG-UI compatibility enables easy integration
- May be overkill for simple chat

---

### 2. AG-UI Protocol
**URL**: https://github.com/ag-ui-protocol/ag-ui

**Primary Use Case**: Universal protocol for agent-UI communication

**Mental Model**:
- Protocol-first approach (not an SDK)
- Vendor-neutral message format
- Transport-agnostic (HTTP, SSE, WebSocket, webhooks)

**Message Schema**:
- **Roles**: user, assistant, system, tool, developer
- **Structure**: `{ id, role, content, name?, metadata? }`
- **Content Types**: text, image, tool_call, structured data

**Streaming**:
- Event-based streaming:
  - `message.start`: Begin new message
  - `message.chunk`: Content chunk
  - `message.end`: Complete message
- Tool call streaming:
  - `tool_call.start`
  - `tool_call.chunk`
  - `tool_call.end`

**Tool/Agent Integration**:
- Tool calls embedded in assistant messages
- Tool results as separate tool messages
- Agent state synchronization
- Human-in-the-loop patterns

**Frontend Integration**:
- Protocol specification only
- Requires custom implementation or SDK wrapper
- Framework-agnostic (React, Vue, Svelte, native)

**Pros**:
- ✅ Universal standard (interoperability)
- ✅ Vendor-neutral (no lock-in)
- ✅ Flexible transport layer
- ✅ Well-documented protocol
- ✅ Growing ecosystem

**Cons**:
- ❌ Not an SDK (requires implementation)
- ❌ No pre-built UI components
- ❌ More work to integrate

**Fit for AegisWallet**: ⭐⭐⭐⭐⭐ (5/5)
- Perfect as abstraction layer foundation
- Enables multi-backend support
- Future-proof with vendor neutrality

---

### 3. Ottomator AG-UI RAG Agent
**URL**: https://github.com/coleam00/ottomator-agents/tree/main/ag-ui-rag-agent

**Primary Use Case**: RAG-powered AI agents with knowledge base integration

**Mental Model**:
- Agent-centric (agents as autonomous entities)
- Knowledge-augmented responses
- Community-driven agent marketplace

**Message Schema**:
- Uses AG-UI Protocol
- Extended with RAG-specific metadata (sources, citations)

**Streaming**:
- AG-UI protocol streaming
- Source attribution in stream

**Tool/Agent Integration**:
- RAG as primary "tool"
- Document retrieval and ranking
- Citation generation
- Multi-source knowledge synthesis

**Frontend Integration**:
- AG-UI protocol client
- Custom UI for source display
- Citation links

**Pros**:
- ✅ RAG capabilities out-of-the-box
- ✅ AG-UI protocol compatibility
- ✅ Community agents (reusable)
- ✅ Knowledge base integration

**Cons**:
- ❌ Specific to Ottomator platform
- ❌ Less mature than other options
- ❌ Limited documentation

**Fit for AegisWallet**: ⭐⭐⭐ (3/5)
- Useful for future knowledge base features (financial education)
- RAG could enhance financial advice
- Not needed for MVP chat

---

### 4. Google Gemini Chat SDK
**URL**: https://ai.google.dev

**Primary Use Case**: Direct integration with Google Gemini models

**Mental Model**:
- Provider-specific SDK
- Multi-modal AI (text, images, audio, video)
- Conversational AI with context

**Message Schema**:
- **Roles**: user, model (assistant), system (via system instruction)
- **Structure**: `{ role, parts: [{ text }] }`
- **Multi-modal**: Parts can be text, images, audio, video

**Streaming**:
- Native streaming via `streamGenerateContent()`
- Async iterator pattern
- Token-by-token delivery

**Tool/Agent Integration**:
- Function calling support
- Tool definitions in request
- Tool results in follow-up messages

**Frontend Integration**:
- Official JavaScript SDK: `@google/generative-ai`
- Simple API (no React-specific hooks)
- Requires custom React integration

**Pros**:
- ✅ Official Google SDK (reliable)
- ✅ Excellent multi-modal support
- ✅ High-quality models (Gemini Pro, Ultra)
- ✅ Good documentation
- ✅ Free tier available
- ✅ Simple API

**Cons**:
- ❌ Vendor lock-in (Google-specific)
- ❌ No pre-built React components
- ❌ Requires custom UI integration

**Fit for AegisWallet**: ⭐⭐⭐⭐⭐ (5/5)
- Perfect for MVP (simple, reliable)
- Multi-modal capabilities for future
- Easy to wrap in AG-UI adapter
- Free tier for development

---

## Comparison Matrix

| Aspect | CopilotKit | AG-UI Protocol | Ottomator | Gemini SDK |
|--------|------------|----------------|-----------|------------|
| **Type** | SDK + Protocol | Protocol | Agent Platform | Provider SDK |
| **React Integration** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Streaming** | SSE | Flexible | SSE | Native |
| **Tool Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Multi-modal** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Documentation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Vendor Lock-in** | Medium | None | High | High |
| **Learning Curve** | Medium | Low | Medium | Low |
| **MVP Readiness** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Future Potential** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## Recommendation

**For AegisWallet MVP**:
1. **Primary Backend**: Gemini SDK (simple, reliable, free tier)
2. **Abstraction Layer**: AG-UI Protocol (vendor-neutral, future-proof)
3. **Future Backends**: CopilotKit (copilot features), Ottomator (RAG)

**Rationale**:
- Gemini provides immediate value with minimal complexity
- AG-UI abstraction enables easy backend swapping
- CopilotKit and Ottomator can be added later without UI changes
- This approach balances MVP speed with long-term flexibility

## Implementation Strategy

1. **Phase 1 (MVP)**: Gemini backend + AG-UI types + shadcn/ui components
2. **Phase 2**: Add CopilotKit backend for copilot-style features
3. **Phase 3**: Add Ottomator backend for RAG/knowledge base
4. **Phase 4**: Direct AG-UI backend for custom agents

This phased approach minimizes initial complexity while maintaining extensibility.
