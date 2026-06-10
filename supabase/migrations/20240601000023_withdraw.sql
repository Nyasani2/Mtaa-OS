-- ============================================
-- A2 WALLET WITHDRAW — SQL CHUNK
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure transactions table has all needed columns for withdrawals
DO $$
BEGIN
    -- Add fee column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'fee') THEN
        ALTER TABLE transactions ADD COLUMN fee NUMERIC(20, 2) DEFAULT 0;
    END IF;

    -- Add net_amount column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'net_amount') THEN
        ALTER TABLE transactions ADD COLUMN net_amount NUMERIC(20, 2);
    END IF;

    -- Add method column if missing (for withdrawal method: bank_transfer, mobile_money, crypto)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'method') THEN
        ALTER TABLE transactions ADD COLUMN method TEXT;
    END IF;

    -- Add destination column if missing (JSONB for bank details, crypto address, etc.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'destination') THEN
        ALTER TABLE transactions ADD COLUMN destination JSONB;
    END IF;

    -- Ensure metadata is JSONB
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'transactions' AND column_name = 'metadata' 
               AND data_type = 'json') THEN
        ALTER TABLE transactions ALTER COLUMN metadata TYPE JSONB USING metadata::JSONB;
    END IF;
END $$;

-- 2. Create RPC function: reserve_withdrawal_funds
-- This atomically debits wallet and creates escrow record
CREATE OR REPLACE FUNCTION reserve_withdrawal_funds(
    p_wallet_id UUID,
    p_amount NUMERIC,
    p_transaction_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_balance NUMERIC;
    v_wallet_status TEXT;
    v_user_id UUID;
BEGIN
    -- Lock the wallet row
    SELECT balance, status, user_id 
    INTO v_current_balance, v_wallet_status, v_user_id
    FROM wallets 
    WHERE id = p_wallet_id
    FOR UPDATE;

    -- Validate
    IF v_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_wallet_status != 'active' THEN
        RAISE EXCEPTION 'Wallet is not active: %', v_wallet_status;
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance: % < %', v_current_balance, p_amount;
    END IF;

    -- Debit wallet
    UPDATE wallets 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = p_wallet_id;

    -- Create or update escrow account
    INSERT INTO escrow_accounts (
        id,
        transaction_id,
        wallet_id,
        user_id,
        amount,
        currency,
        status,
        type,
        created_at,
        expires_at
    )
    SELECT
        gen_random_uuid(),
        p_transaction_id,
        p_wallet_id,
        v_user_id,
        p_amount,
        w.currency,
        'held',
        'withdrawal_reserve',
        NOW(),
        NOW() + INTERVAL '48 hours'
    FROM wallets w
    WHERE w.id = p_wallet_id
    ON CONFLICT (transaction_id) 
    DO UPDATE SET
        amount = p_amount,
        status = 'held',
        updated_at = NOW();

    -- Create audit log entry
    INSERT INTO audit_logs (
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        'withdrawal_reserved',
        'escrow',
        p_transaction_id,
        jsonb_build_object(
            'wallet_id', p_wallet_id,
            'amount', p_amount,
            'transaction_id', p_transaction_id,
            'balance_before', v_current_balance,
            'balance_after', v_current_balance - p_amount
        ),
        NOW()
    );

END;
$$;

-- 3. Create RPC function: complete_withdrawal (for admin/ops to mark as completed)
CREATE OR REPLACE FUNCTION complete_withdrawal(
    p_transaction_id UUID,
    p_reference_code TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tx RECORD;
BEGIN
    -- Get and lock transaction
    SELECT * INTO v_tx
    FROM transactions
    WHERE id = p_transaction_id AND type = 'withdrawal'
    FOR UPDATE;

    IF v_tx IS NULL THEN
        RAISE EXCEPTION 'Withdrawal transaction not found';
    END IF;

    IF v_tx.status != 'pending' THEN
        RAISE EXCEPTION 'Transaction is not pending: %', v_tx.status;
    END IF;

    -- Update transaction to completed
    UPDATE transactions 
    SET status = 'completed',
        metadata = metadata || jsonb_build_object(
            'completed_at', NOW(),
            'reference_code', p_reference_code
        ),
        updated_at = NOW()
    WHERE id = p_transaction_id;

    -- Release escrow (mark as released, don't return funds since payout happened)
    UPDATE escrow_accounts
    SET status = 'released',
        released_at = NOW(),
        updated_at = NOW()
    WHERE transaction_id = p_transaction_id;

    -- Audit log
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (
        gen_random_uuid(),
        v_tx.user_id,
        'withdrawal_completed',
        'transaction',
        p_transaction_id,
        jsonb_build_object(
            'amount', v_tx.amount,
            'net_amount', v_tx.net_amount,
            'reference_code', p_reference_code
        ),
        NOW()
    );

END;
$$;

-- 4. Create RPC function: fail_withdrawal (return funds to wallet)
CREATE OR REPLACE FUNCTION fail_withdrawal(
    p_transaction_id UUID,
    p_reason TEXT DEFAULT 'Unknown error'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tx RECORD;
    v_escrow RECORD;
BEGIN
    SELECT * INTO v_tx
    FROM transactions
    WHERE id = p_transaction_id AND type = 'withdrawal'
    FOR UPDATE;

    IF v_tx IS NULL THEN
        RAISE EXCEPTION 'Withdrawal transaction not found';
    END IF;

    IF v_tx.status NOT IN ('pending', 'processing') THEN
        RAISE EXCEPTION 'Cannot fail transaction with status: %', v_tx.status;
    END IF;

    -- Get escrow
    SELECT * INTO v_escrow
    FROM escrow_accounts
    WHERE transaction_id = p_transaction_id
    FOR UPDATE;

    -- Return funds to wallet
    IF v_escrow IS NOT NULL THEN
        UPDATE wallets
        SET balance = balance + v_escrow.amount,
            updated_at = NOW()
        WHERE id = v_escrow.wallet_id;
    END IF;

    -- Update transaction
    UPDATE transactions
    SET status = 'failed',
        metadata = metadata || jsonb_build_object(
            'failed_at', NOW(),
            'fail_reason', p_reason
        ),
        updated_at = NOW()
    WHERE id = p_transaction_id;

    -- Update escrow
    IF v_escrow IS NOT NULL THEN
        UPDATE escrow_accounts
        SET status = 'returned',
            updated_at = NOW()
        WHERE transaction_id = p_transaction_id;
    END IF;

    -- Audit log
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (
        gen_random_uuid(),
        v_tx.user_id,
        'withdrawal_failed',
        'transaction',
        p_transaction_id,
        jsonb_build_object(
            'amount', v_tx.amount,
            'reason', p_reason,
            'refunded', v_escrow IS NOT NULL
        ),
        NOW()
    );

END;
$$;

-- 5. Add RLS policies for escrow_accounts if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'escrow_accounts' 
        AND policyname = 'Users can view own escrow'
    ) THEN
        CREATE POLICY "Users can view own escrow" ON escrow_accounts
            FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

-- 6. Add withdrawal method to transactions type enum if using enum
-- (If transactions.type is TEXT, no change needed. If ENUM, uncomment below:)
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
--         ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'withdrawal';
--     END IF;
-- END $$;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION reserve_withdrawal_funds(UUID, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_withdrawal(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION fail_withdrawal(UUID, TEXT) TO service_role;
