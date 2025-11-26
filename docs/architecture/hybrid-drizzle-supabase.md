# AegisWallet Hybrid Architecture: Drizzle ORM + Supabase

## Overview

AegisWallet implements a sophisticated hybrid architecture that combines the strengths of Drizzle ORM for type-safe database operations with Supabase for authentication, real-time features, and managed database hosting.

## Key Architecture Benefits

### 1. Dual Database Access Pattern
- **Drizzle ORM**: Used in backend Hono routes for type-safe, optimized database operations
- **Direct Supabase**: Used in frontend for authentication, real-time subscriptions, and LGPD compliance operations

### 2. Security-First Design
- Row Level Security (RLS) at database level
- JWT-based authentication with request-scoped Supabase clients
- Per-user rate limiting in all API endpoints
- Comprehensive audit trails for Brazilian compliance

### 3. Performance Optimizations
- Connection pooling for database operations
- TanStack Query for intelligent frontend caching
- Edge-first architecture with Hono
- Proper indexing and query optimization

## Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Hono RPC + Drizzle ORM
- **Database**: PostgreSQL (Supabase hosted)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **State Management**: TanStack Query v5
- **Routing**: TanStack Router v5

## API Structure

All backend endpoints follow the pattern: `/api/v1/{domain}/{action}`

Examples:
- `GET /api/v1/transactions` - List user transactions
- `POST /api/v1/transactions` - Create new transaction
- `GET /api/v1/users/me` - Get user profile
- `PUT /api/v1/users/me/preferences` - Update user preferences

## Brazilian Compliance

### LGPD Implementation
- Comprehensive consent management system
- Data retention policies
- Audit trails for all data operations
- User rights (access, deletion, portability)

### Financial Features
- PIX integration support
- Brazilian Portuguese localization
- Local transaction categories
- Real-time financial notifications

## Development Benefits

### Type Safety
- End-to-end TypeScript coverage
- Drizzle schema inference
- Zod validation for API contracts
- Shared types between frontend and backend

### Developer Experience
- Hot reloading in development
- Comprehensive error handling
- Brazilian Portuguese error messages
- Extensive testing infrastructure

This hybrid architecture provides an optimal foundation for Brazilian fintech applications, combining security, performance, and compliance while maintaining excellent developer experience.
