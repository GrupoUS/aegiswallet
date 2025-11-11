# Story 1.2: Voice Command Processor

Status: ready-for-dev

## Story

As a user of AegisWallet,
I want to speak natural language commands and have the system understand my financial intent,
so that I can issue complex financial instructions conversationally.

## Acceptance Criteria

1. [ ] Classifies 6 essential voice commands with 98% accuracy
2. [ ] Extracts parameters from commands (amounts, names, dates)
3. [ ] Handles variations in phrasing and synonyms
4. [ ] Provides confidence scoring for intent classification
5. [ ] Supports contextual understanding for follow-up commands

## Tasks / Subtasks

- [ ] Implement Natural Language Processing engine (AC: #1, #3)
  - [ ] Create Portuguese NLP tokenization and parsing
  - [ ] Implement command pattern matching algorithms
  - [ ] Add synonym handling and variant recognition
- [ ] Create Intent Classification System (AC: #1, #5)
  - [ ] Define intent categories for financial commands
  - [ ] Implement machine learning or rule-based classifier
  - [ ] Create confidence scoring algorithms
  - [ ] Add training data for Portuguese financial commands
- [ ] Implement Parameter Extraction Engine (AC: #2)
  - [ ] Create named entity recognition for financial terms
  - [ ] Extract amounts, names, dates, and financial parameters
  - [ ] Validate and normalize extracted parameters
  - [ ] Handle Portuguese number and currency formats
- [ ] Create Context Management System (AC: #5)
  - [ ] Implement conversation state tracking
  - [ ] Handle follow-up commands and contextual understanding
  - [ ] Create session persistence for multi-turn conversations
  - [ ] Add context timeout and reset mechanisms
- [ ] Add Performance Optimization (AC: #1)
  - [ ] Optimize NLP processing for real-time response
  - [ ] Implement caching for common command patterns
  - [ ] Add performance monitoring and benchmarks
- [ ] Create Comprehensive Testing Suite (AC: #1-5)
  - [ ] Unit tests for intent classification accuracy
  - [ ] Integration tests with speech recognition service
  - [ ] Parameter extraction validation tests
  - [ ] Context management scenario tests
  - ] Performance and load testing

## Dev Notes

### Project Structure Notes

Build on existing voice infrastructure:
- **Service Location**: `src/lib/nlp/VoiceCommandProcessor.ts` (new service)
- **Integration**: Connects with SpeechRecognitionService (Story 1.1)
- **Hook Integration**: `src/hooks/useVoiceCommand.ts` (enhance existing hook)
- **Component Integration**: `src/components/voice/VoiceCommandProcessor.tsx` (new component)

### Architecture Alignment

Follow existing voice processing pipeline:
- **Input**: Receives recognized text from SpeechRecognitionService
- **Processing**: Applies NLP and intent classification
- **Output**: Returns VoiceCommand objects with intent and parameters
- **Performance**: Must maintain sub-second processing time
- **Integration**: Works with existing VoiceCommandProcessor service

### Existing Integration Points

- **VoiceCommand Interface**: Use existing interface structure from architecture
- **Database Integration**: Use existing voice_commands table for logging
- **Error Handling**: Follow patterns established in Story 1.1
- **Testing Framework**: Use Vitest patterns from speech recognition tests

### Brazilian Market Specifics

- **Language**: Natural language processing for Brazilian Portuguese
- **Financial Terms**: Handle Brazilian financial terminology
- **Currency Formats**: Support Brazilian real (R$) formatting
- **Cultural Context**: Adapt to Brazilian financial communication patterns

### References

- [Source: docs/epics/voice-interface-foundation.md#Story-1.2]
- [Source: docs/architecture.md#Voice-Processing]
- [Source: docs/prd.md#Functional-Requirements]

### Previous Story Context

**From Story 1.1 (Status: ready-for-dev)**

- **New Capability**: SpeechRecognitionService provides recognized text input
- **Integration Point**: Use SpeechRecognitionService output as input for command processing
- **Performance Targets**: Build on &lt;1 second response time requirement
- **Error Patterns**: Follow established error handling patterns from speech recognition
- **Testing Framework**: Use Vitest patterns established in Story 1.1

### Learnings to Apply

Since Story 1.1 established the voice foundation:
- **Performance Baseline**: Maintain sub-second processing requirements
- **Error Handling**: Use consistent error handling patterns
- **Testing Framework**: Follow established Vitest testing patterns
- **Integration Architecture**: Build on existing voice service integration patterns
- **Brazilian Localization**: Apply Portuguese language handling patterns

## Dev Agent Record

### Context Reference

- [1-2-voice-command-processor.context.xml](./1-2-voice-command-processor.context.xml)

### Agent Model Used

BMad SM Agent v6-alpha

### Debug Log References

### Completion Notes List

### File List

- [NEW] `src/lib/nlp/VoiceCommandProcessor.ts` - Main NLP service implementation
- [NEW] `src/lib/nlp/__tests__/VoiceCommandProcessor.test.ts` - Unit tests
- [NEW] `src/types/voiceCommandTypes.ts` - Type definitions for NLP
- [MODIFIED] `src/hooks/useVoiceCommand.ts` - Enhanced hook integration
- [NEW] `src/components/voice/VoiceCommandProcessor.tsx` - UI component for command processing
- [NEW] `src/lib/nlp/training-data/` - Training data for Portuguese commands
- [MODIFIED] `src/services/voiceCommandProcessor.ts` - Enhanced business logic service

## Change Log

**Created**: 2025-11-10
**Status**: drafted
**Epic**: 1 (Voice Interface Foundation)
**Story**: 1.2 (Voice Command Processor)
**Author**: SM Agent