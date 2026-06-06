-- Step 1: Add 'cancelled' to earnings status constraint
ALTER TABLE earnings DROP CONSTRAINT IF EXISTS earnings_status_check;
ALTER TABLE earnings ADD CONSTRAINT earnings_status_check
  CHECK (status IN ('pending', 'approved', 'paid', 'cancelled'));

-- Step 2: Extend the earning trigger to reverse pending_balance when cancelled
CREATE OR REPLACE FUNCTION public.handle_earning_status_change()
RETURNS trigger AS $$
BEGIN
  -- pending → approved: move balance and count toward total
  IF new.status = 'approved' AND old.status = 'pending' THEN
    new.approved_at = now();
    UPDATE public.profiles
    SET
      pending_balance  = pending_balance  - new.amount,
      approved_balance = approved_balance + new.amount,
      total_earned     = total_earned     + new.amount
    WHERE id = new.editor_id;
  END IF;

  -- approved → paid: remove from approved balance
  IF new.status = 'paid' AND old.status = 'approved' THEN
    new.paid_at = now();
    UPDATE public.profiles
    SET approved_balance = approved_balance - new.amount
    WHERE id = new.editor_id;
  END IF;

  -- pending → cancelled (rejection): claw back pending balance, floor at 0
  IF new.status = 'cancelled' AND old.status = 'pending' THEN
    UPDATE public.profiles
    SET pending_balance = GREATEST(0, pending_balance - new.amount)
    WHERE id = new.editor_id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
