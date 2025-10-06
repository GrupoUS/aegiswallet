-- Quick script to apply PIX tables only
-- This script enables extensions first, then creates PIX tables

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Now include the PIX tables migration
\i 20251006145111_pix_tables.sql
