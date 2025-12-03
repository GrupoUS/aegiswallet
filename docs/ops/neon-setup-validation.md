# Neon Database Setup & Validation Guide

> Comprehensive guide for setting up and validating Neon PostgreSQL integration with AegisWallet

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration](#2-environment-configuration)
3. [Database Connection Setup](#3-database-connection-setup)
4. [Migration Management](#4-migration-management)
5. [Validation & Testing](#5-validation--testing)
6. [Troubleshooting](#6-troubleshooting)
7. [Production Deployment](#7-production-deployment)

---

## 1. Prerequisites

### Required Tools

```bash
# Bun runtime (latest)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version  # Should be 1.x or higher

# Optional: Neon CLI for database management
npm install -g neon-cli
neon auth  # Authenticate with Neon
```

### Neon Account Setup

1. Create a Neon account at [https://console.neon.tech](https://console.neon.tech)
2. Create a new project (recommended region: `sa-east-1` for Brazil)
3. Note your project ID and default branch

### Project Dependencies

Ensure these packages are installed (already in `package.json`):

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "drizzle-orm": "^0.44.7"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.7"
  }
}
```

---

## 2. Environment Configuration

### Connection String Format

Neon provides two types of connection strings:

#### Pooled Connection (PgBouncer)
- **Use for**: API endpoints, serverless functions, high concurrency
- **Hostname**: Contains `-pooler` suffix
- **Example**:
```
postgresql://neondb_owner:password@ep-example-123456-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

#### Direct Connection
- **Use for**: Migrations, admin operations, transactions with session state
- **Hostname**: No `-pooler` suffix
- **Example**:
```
postgresql://neondb_owner:password@ep-example-123456.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Copy the template
cp env.example .env

# Edit with your credentials
code .env  # or your preferred editor
```

#### Required Variables

```bash
# ============================================
# 🗄️ Neon Database Configuration
# ============================================

# Pooled connection (for API operations)
# Get from: Neon Console > Connection Details > Pooled connection
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-ID-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Direct connection (for migrations)
# Get from: Neon Console > Connection Details > Direct connection
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-ID.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

#### SSL Mode Options

| Mode | Security Level | Use Case |
|------|---------------|----------|
| `sslmode=require` | Good | Default, ensures encryption |
| `sslmode=verify-full` | Best | Verifies server certificate |
| `sslmode=disable` | ❌ Never | Do not use |

#### Optional Connection Pool Settings

```bash
# Connection pool configuration (optional)
DATABASE_POOL_MAX=10           # Maximum connections in pool
DATABASE_POOL_TIMEOUT=30000    # Connection acquisition timeout (ms)
```

### Complete `.env` Example

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_xxx@ep-calm-unit-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_xxx@ep-calm-unit-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Server
PORT=3000
```

---

## 3. Database Connection Setup

### Getting Connection Strings from Neon Console

1. Log in to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to **Dashboard** → **Connection Details**
4. Copy both:
   - **Pooled connection** (for `DATABASE_URL`)
   - **Direct connection** (for `DATABASE_URL_UNPOOLED`)

### Using Neon CLI

```bash
# Authenticate
neon auth

# List projects
neon projects list

# Get connection string for default branch
neon connection-string --project-id YOUR_PROJECT_ID

# Get connection string with pooling
neon connection-string --project-id YOUR_PROJECT_ID --pooled
```

### Testing Connection

```bash
# Quick connection test
bun run smoke:db

# Comprehensive verification
bun run neon:verify
```

### Understanding the Database Client

AegisWallet uses two connection types (see `src/db/client.ts`):

```typescript
// HTTP Client (Pooled) - For API endpoints
import { getHttpClient } from '@/db/client';
const db = getHttpClient();
await db.select().from(users);

// Pool Client (Direct) - For transactions and migrations
import { getPoolClient } from '@/db/client';
const db = getPoolClient();
await db.transaction(async (tx) => {
  // Transaction operations
});
```

---

## 4. Migration Management

### Understanding Drizzle Migrations

Drizzle Kit manages database schema through migrations:

1. **Schema Definition**: TypeScript files in `src/db/schema/`
2. **Migration Generation**: SQL files in `drizzle/migrations/`
3. **Migration Application**: Executed against database

### Migration Commands

```bash
# Generate migrations from schema changes
bun db:generate

# Apply migrations to database
bun db:migrate

# Push schema directly (development only)
bun db:push

# Open Drizzle Studio (visual database browser)
bun db:studio
```

### Migration Workflow

#### 1. Making Schema Changes

Edit schema files in `src/db/schema/`:

```typescript
// src/db/schema/users.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### 2. Generating Migration

```bash
bun db:generate
# Output: drizzle/migrations/0001_new_migration.sql
```

#### 3. Reviewing Migration SQL

Always review generated SQL before applying:

```bash
cat drizzle/migrations/0001_*.sql
```

#### 4. Applying Migration

```bash
# Development: Apply to database
bun db:migrate

# Or push directly (skips migration files)
bun db:push
```

### Checking Migration Status

```bash
# View applied migrations
bun run neon:verify

# Manual check via psql or Drizzle Studio
bun db:studio
```

### Rolling Back Migrations

Drizzle doesn't have automatic rollback. Options:

1. **Manual Rollback**: Create a new migration that reverts changes
2. **Branch-Based**: Use Neon branching for safe testing

```bash
# Create a test branch in Neon
neon branches create --project-id YOUR_PROJECT_ID --name test-migration

# Test migration on branch
DATABASE_URL=<branch_connection_string> bun db:migrate

# Delete branch if migration fails
neon branches delete --project-id YOUR_PROJECT_ID --name test-migration
```

---

## 5. Validation & Testing

### Quick Validation Commands

```bash
# Comprehensive Neon setup verification
bun run neon:verify

# Quick database connection test
bun run smoke:db

# Health endpoint check (requires server running)
bun run health:check

# Full integration test
bun run integration:test

# Complete validation suite
bun run dev:validate
```

### What Each Test Validates

#### `neon:verify` - Comprehensive Setup Check

- ✅ Environment variables configured
- ✅ Pooled connection working
- ✅ Direct connection working
- ✅ Schema tables match Drizzle definitions
- ✅ Migrations applied
- ✅ RLS policies in place
- ✅ SSL/TLS enabled

#### `smoke:db` - Quick Connection Test

- ✅ Basic database connectivity
- ✅ Query execution
- ✅ Schema access

#### `integration:test` - Full Stack Test

- ✅ Backend server running
- ✅ Health endpoint responding
- ✅ Database accessible through API
- ✅ CORS configured correctly
- ✅ Vite proxy working (if running)

### Health Endpoint Testing

```bash
# Start the server first
bun dev:server

# In another terminal, check health
curl http://localhost:3000/api/health | jq

# Expected response:
{
  "status": "ok",
  "database": {
    "status": "connected",
    "latency": 45
  },
  "uptime": 123.456,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Running Full Validation

```bash
# Validate database and integration
bun run dev:validate

# This runs:
# 1. bun run neon:verify (database setup)
# 2. bun run integration:test (full stack)
```

---

## 6. Troubleshooting

### Common Connection Errors

#### "Connection refused"

**Cause**: Database server unreachable
**Solution**:
```bash
# Check if Neon project is active
neon projects list

# Verify connection string format
echo $DATABASE_URL | grep -o 'postgresql://[^@]*@[^/]*'

# Try direct connection
psql $DATABASE_URL -c "SELECT 1"
```

#### "Authentication failed"

**Cause**: Invalid credentials
**Solution**:
1. Regenerate password in Neon Console
2. Update `.env` with new password
3. Ensure no extra spaces or quotes around URL

#### "SSL connection required"

**Cause**: Missing or incorrect SSL mode
**Solution**:
```bash
# Ensure sslmode is in connection string
DATABASE_URL="postgresql://...?sslmode=require"
```

#### "Connection timeout"

**Cause**: Network issues or cold start
**Solution**:
```bash
# Neon auto-suspends after inactivity
# First connection may be slow (cold start)
# Wait 5-10 seconds and retry

# Or disable auto-suspend in Neon Console (paid plans)
```

### Schema Sync Issues

#### "Table not found"

**Cause**: Migrations not applied
**Solution**:
```bash
# Check migration status
bun run neon:verify

# Apply pending migrations
bun db:migrate

# Or push schema directly
bun db:push
```

#### "Column type mismatch"

**Cause**: Schema drift between Drizzle and database
**Solution**:
```bash
# Generate fresh migration
bun db:generate

# Review the SQL
cat drizzle/migrations/*.sql

# Apply the migration
bun db:migrate
```

### Migration Conflicts

#### "Migration already applied"

**Cause**: Migration file changed after application
**Solution**:
```bash
# Option 1: Reset migration table (DEV ONLY!)
# DROP TABLE drizzle.__drizzle_migrations;
# Then re-run migrations

# Option 2: Create new migration for changes
bun db:generate
```

### CORS Errors

#### "CORS policy blocked"

**Cause**: Backend CORS not configured for frontend origin
**Solution**: Check `src/server/middleware/cors.ts`:
```typescript
// Ensure localhost:8080 is in allowed origins
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);
```

### RLS Policy Issues

#### "Permission denied"

**Cause**: RLS policy blocking access
**Solution**:
```bash
# Check RLS policies
bun db:studio

# Or via SQL
SELECT * FROM pg_policies WHERE schemaname = 'public';

# Temporarily disable RLS (DEV ONLY!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## 7. Production Deployment

### Setting Environment Variables in Vercel

```bash
# Using Vercel CLI
vercel env add DATABASE_URL production
vercel env add DATABASE_URL_UNPOOLED production
vercel env add VITE_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production

# Using Vercel Dashboard
# Project Settings > Environment Variables > Add
```

### Database Branching Strategy

For safe production deployments:

1. **Main Branch**: Production database
2. **Preview Branches**: Created per PR
3. **Development Branch**: Shared development

```bash
# Create preview branch for testing
neon branches create --project-id YOUR_PROJECT_ID --name preview-pr-123

# Get connection string for preview
neon connection-string --project-id YOUR_PROJECT_ID --branch preview-pr-123
```

### Migration Workflow for Production

```bash
# 1. Test migration on preview branch
DATABASE_URL=<preview_connection> bun db:migrate

# 2. Verify schema
DATABASE_URL=<preview_connection> bun run neon:verify

# 3. Run integration tests
DATABASE_URL=<preview_connection> bun run integration:test

# 4. Apply to production (after approval)
DATABASE_URL=<production_connection> bun db:migrate
```

### Monitoring & Health Checks

#### Vercel Health Check

Configure in `vercel.json`:
```json
{
  "routes": [
    {
      "src": "/api/health",
      "dest": "/api/index.mjs"
    }
  ]
}
```

#### External Monitoring

Set up monitoring with services like:
- **Uptime Robot**: Ping `/api/health` every 5 minutes
- **Better Uptime**: More detailed monitoring
- **Neon Dashboard**: Database metrics and alerts

### Performance Optimization

#### Connection Pooling

```bash
# Use pooled connection for API
DATABASE_URL=postgresql://...@...-pooler.../...?sslmode=require

# Configure pool size based on Vercel plan
DATABASE_POOL_MAX=10  # Hobby: 10, Pro: 25
```

#### Query Optimization

```bash
# Run health check with performance metrics
bun db:health

# Analyze slow queries
bun db:optimize
```

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `bun run neon:verify` | Comprehensive setup verification |
| `bun run smoke:db` | Quick connection test |
| `bun db:generate` | Generate migrations |
| `bun db:migrate` | Apply migrations |
| `bun db:push` | Push schema directly |
| `bun db:studio` | Open Drizzle Studio |
| `bun run integration:test` | Full stack integration test |

### File Locations

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `drizzle.config.ts` | Drizzle Kit configuration |
| `src/db/client.ts` | Database client setup |
| `src/db/schema/` | Table schema definitions |
| `drizzle/migrations/` | Migration SQL files |
| `src/db/migrate.ts` | Migration runner |

### Support Resources

- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [AegisWallet Issues](https://github.com/GrupoUS/aegiswallet/issues)

---

**Last Updated**: December 2025
