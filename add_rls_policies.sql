
-- Add Row Level Security policies for user_subscriptions table
-- These policies ensure users can only access their own subscription data

-- Policy for SELECT operations
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
FOR SELECT
USING (user_id = auth.uid());

-- Policy for INSERT operations  
CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy for UPDATE operations
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for DELETE operations
CREATE POLICY "Users can delete their own subscription" ON public.user_subscriptions
FOR DELETE
USING (user_id = auth.uid());

-- Enable RLS on the table (if not already enabled)
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
