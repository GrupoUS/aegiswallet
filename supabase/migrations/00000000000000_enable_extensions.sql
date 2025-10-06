-- Enable required PostgreSQL extensions

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full text search for Portuguese
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Additional useful extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
