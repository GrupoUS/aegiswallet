-- Migration: Create missing contacts table for contacts API
-- Required for: src/server/routes/v1/contacts.ts functionality

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cpf TEXT,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint for email+phone per user to prevent duplicates
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_email_phone_user_unique 
UNIQUE (user_id, email, phone) 
WHERE email IS NOT NULL AND phone IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_user_email ON public.contacts(user_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_user_phone ON public.contacts(user_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_contacts_user_favorite ON public.contacts(user_id, is_favorite);
CREATE INDEX idx_contacts_user_name ON public.contacts(user_id, name);

-- Enable RLS (Row Level Security)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own contacts
CREATE POLICY "Users can view own contacts" ON public.contacts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own contacts
CREATE POLICY "Users can insert own contacts" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own contacts
CREATE POLICY "Users can update own contacts" ON public.contacts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own contacts
CREATE POLICY "Users can delete own contacts" ON public.contacts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.contacts TO authenticated;
GRANT SELECT ON public.contacts TO anon;