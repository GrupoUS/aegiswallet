-- Add is_primary field to bank_accounts table
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Create index for is_primary field for better performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_primary ON bank_accounts(user_id, is_primary);

-- Update existing accounts to set the first account as primary if no primary account exists
UPDATE bank_accounts 
SET is_primary = true 
WHERE id = (
    SELECT id FROM bank_accounts 
    WHERE user_id IN (
        SELECT user_id FROM bank_accounts 
        GROUP BY user_id 
        HAVING COUNT(*) = 1 OR NOT EXISTS (
            SELECT 1 FROM bank_accounts ba2 
            WHERE ba2.user_id = bank_accounts.user_id AND ba2.is_primary = true
        )
    )
    ORDER BY created_at ASC 
    LIMIT 1
);