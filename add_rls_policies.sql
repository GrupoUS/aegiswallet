
-- Add Row Level Security policies for all tables
-- These policies ensure users can only access their own data
-- BUT allow service_role to bypass for bot operations

-- Policies for bill_reminders table
CREATE POLICY "Users and service_role can view bill_reminders" ON public.bill_reminders
FOR SELECT
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Users and service_role can insert bill_reminders" ON public.bill_reminders
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Users and service_role can update bill_reminders" ON public.bill_reminders
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Users and service_role can delete bill_reminders" ON public.bill_reminders
FOR DELETE
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

-- Policies for transactions table
CREATE POLICY "Users and service_role can view transactions" ON public.transactions
FOR SELECT
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Users and service_role can insert transactions" ON public.transactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Users and service_role can update transactions" ON public.transactions
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Users and service_role can delete transactions" ON public.transactions
FOR DELETE
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

-- Policies for categories table
CREATE POLICY "Users and service_role can view categories" ON public.categories
FOR SELECT
USING (
  user_id IS NULL OR 
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Users and service_role can insert categories" ON public.categories
FOR INSERT
WITH CHECK (
  user_id IS NULL OR 
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role'
);

-- Enable RLS on all tables
ALTER TABLE public.bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
