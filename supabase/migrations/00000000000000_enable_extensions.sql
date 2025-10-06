-- Enable required PostgreSQL extensions
-- This must be run first before any other migrations

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- HTTP client functions
CREATE EXTENSION IF NOT EXISTS "http";
