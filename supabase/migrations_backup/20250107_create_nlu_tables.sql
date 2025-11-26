-- Migration: Create NLU Database Tables
-- Description: Creates tables for conversation context and learning data
-- Author: Quality Control System
-- Date: 2025-01-07

-- Create conversation_contexts table
CREATE TABLE IF NOT EXISTS conversation_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  history JSONB DEFAULT '[]'::jsonb,
  last_entities JSONB DEFAULT '[]'::jsonb,
  last_intent TEXT,
  timestamp TIMESTZ WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTZ WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTZ WITH TIME ZONE DEFAULT NOW()
);

-- Create nlu_learning_data table
CREATE TABLE IF NOT EXISTS nlu_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  error_pattern TEXT NOT NULL,
  correction_applied TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  confidence_improvement DECIMAL(5,2) NOT NULL,
  original_confidence DECIMAL(5,2) NOT NULL,
  timestamp TIMESTZ WITH TIME ZONE DEFAULT NOW(),
  linguistic_style TEXT,
  regional_variation TEXT,
  user_feedback TEXT,
  created_at TIMESTZ WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTZ WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_user_id ON conversation_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_session_id ON conversation_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_timestamp ON conversation_contexts(timestamp);

CREATE INDEX IF NOT EXISTS idx_nlu_learning_data_user_id ON nlu_learning_data(user_id);
CREATE INDEX IF NOT EXISTS idx_nlu_learning_data_timestamp ON nlu_learning_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_nlu_learning_data_success ON nlu_learning_data(success);

-- Add RLS policies
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlu_learning_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own conversation contexts" ON conversation_contexts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own conversation contexts" ON conversation_contexts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own conversation contexts" ON conversation_contexts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own conversation contexts" ON conversation_contexts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own learning data" ON nlu_learning_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own learning data" ON nlu_learning_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own learning data" ON nlu_learning_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own learning data" ON nlu_learning_data
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON conversation_contexts TO authenticated;
GRANT ALL ON nlu_learning_data TO authenticated;

-- Grant permissions to service role for system operations
GRANT ALL ON conversation_contexts TO service_role;
GRANT ALL ON nlu_learning_data TO service_role;

-- Add comments for documentation
COMMENT ON TABLE conversation_contexts IS 'Stores conversation context for NLU system including history, entities, and intent tracking';
COMMENT ON TABLE nlu_learning_data IS 'Stores learning data from NLU error recovery and pattern evolution for continuous improvement';
