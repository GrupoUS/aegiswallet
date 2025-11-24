BEGIN;

-- Ensure user_id columns are not null for ownership enforcement
ALTER TABLE public.bank_accounts
  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.transactions
  ALTER COLUMN user_id SET NOT NULL;

-- Re-enable RLS for bank_accounts and recreate owner-scoped policies
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can create own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can update own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can delete own bank accounts" ON public.bank_accounts;

CREATE POLICY "Users can view own bank accounts"
ON public.bank_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bank accounts"
ON public.bank_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts"
ON public.bank_accounts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts"
ON public.bank_accounts
FOR DELETE
USING (auth.uid() = user_id);

-- Normalize transaction policies to ensure WITH CHECK clause is enforced
DROP POLICY IF EXISTS "Users can CRUD their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.transactions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.transactions
FOR DELETE
USING (auth.uid() = user_id);

COMMIT;
